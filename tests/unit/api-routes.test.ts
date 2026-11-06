import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EMPTY_SECTIONS } from '@/lib/integration-contract';

// ---------- mock lapisan server ----------
const requireStaff = vi.fn();
const fetchSectionSummary = vi.fn();
const getIntegration = vi.fn();
const auditAdd = vi.fn().mockResolvedValue(undefined);
const counts: Record<string, number> = { whitelist: 5, accessRequests: 2, notices: 7 };

vi.mock('@/lib/server/auth', async () => {
  const actual = await vi.importActual<typeof import('@/lib/server/auth')>('@/lib/server/auth');
  return { ...actual, requireStaff: (...args: unknown[]) => requireStaff(...args) };
});
vi.mock('@/lib/server/integrations', () => ({
  fetchSectionSummary: (...args: unknown[]) => fetchSectionSummary(...args),
  getIntegration: (...args: unknown[]) => getIntegration(...args),
}));
vi.mock('@/lib/server/firebase-admin', () => {
  const query = (name: string) => ({
    where: () => query(name),
    count: () => ({ get: async () => ({ data: () => ({ count: counts[name] }) }) }),
    add: auditAdd,
  });
  return {
    AdminNotConfiguredError: class extends Error {},
    adminDb: () => ({ collection: (name: string) => query(name) }),
  };
});

const { GET: metricsGET } = await import('@/app/api/metrics/route');
const { POST: ssoPOST } = await import('@/app/api/sso/[app]/route');
const { HttpError } = await import('@/lib/server/auth');

const ADMIN = { uid: 'u', email: 'admin@rep.test', name: 'Admin', role: 'IT_ADMIN' };

beforeEach(() => {
  requireStaff.mockReset().mockResolvedValue(ADMIN);
  fetchSectionSummary.mockReset();
  getIntegration.mockReset();
  auditAdd.mockClear();
});

describe('GET /api/metrics', () => {
  it('hanya untuk pimpinan & IT', async () => {
    requireStaff.mockRejectedValue(new HttpError(403, 'Role Anda tidak memiliki izin untuk aksi ini.'));
    const res = await metricsGET(new Request('http://localhost/api/metrics'));
    expect(res.status).toBe(403);
    expect(requireStaff.mock.calls[0][1]).toEqual(['IT_ADMIN', 'EXECUTIVE']);
  });

  it('menggabungkan sumber & menghitung kesehatan dari aplikasi yang terkonfigurasi saja', async () => {
    fetchSectionSummary.mockImplementation(async (key: string) =>
      key === 'posGudang'
        ? { status: 'LIVE', data: EMPTY_SECTIONS.posGudang }
        : key === 'keuangan'
          ? { status: 'ERROR', message: 'down' }
          : { status: 'NOT_CONFIGURED' }
    );
    const res = await metricsGET(new Request('http://localhost/api/metrics?period=THIS_MONTH'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.period).toBe('THIS_MONTH');
    expect(fetchSectionSummary).toHaveBeenCalledWith('posGudang', 'THIS_MONTH');
    expect(body.sections.posGudang.status).toBe('LIVE');
    expect(body.sections.reservasi.status).toBe('NOT_CONFIGURED');
    // 2 terkonfigurasi (POS live, SIK-REP error) → 50%
    expect(body.operasional).toEqual({
      activeStaffOnDuty: 5,
      pendingAccessRequests: 2,
      activeNoticesCount: 7,
      systemHealthScore: 50,
    });
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it('periode tidak dikenal jatuh ke TODAY', async () => {
    fetchSectionSummary.mockResolvedValue({ status: 'NOT_CONFIGURED' });
    const body = await (await metricsGET(new Request('http://localhost/api/metrics?period=SELAMANYA'))).json();
    expect(body.period).toBe('TODAY');
    expect(body.operasional.systemHealthScore).toBe(0);
  });
});

describe('POST /api/sso/[app]', () => {
  const call = (app: string) =>
    ssoPOST(new Request(`http://localhost/api/sso/${app}`, { method: 'POST' }), { params: Promise.resolve({ app }) });
  const cfg = { baseUrl: 'https://pos.example.com', secret: 's'.repeat(64) };

  it('404 untuk aplikasi tak dikenal', async () => {
    expect((await call('bank-luar')).status).toBe(404);
  });

  it('404 NOT_CONFIGURED bila integrasi belum disiapkan (klien membuka aplikasi biasa)', async () => {
    getIntegration.mockReturnValue(null);
    const res = await call('posGudang');
    expect(res.status).toBe(404);
    expect((await res.json()).code).toBe('NOT_CONFIGURED');
  });

  it('meneruskan NO_ACCOUNT dari sub-aplikasi', async () => {
    getIntegration.mockReturnValue(cfg);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'Belum punya akun', code: 'NO_ACCOUNT' }), { status: 404 }))
    );
    const res = await call('posGudang');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Belum punya akun', code: 'NO_ACCOUNT' });
  });

  it('menolak URL tiket di luar domain sub-aplikasi (cegah redirect ke situs lain)', async () => {
    getIntegration.mockReturnValue(cfg);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ url: 'https://evil.example.com/sso?ticket=x' })))
    );
    const res = await call('posGudang');
    expect(res.status).toBe(502);
    expect(auditAdd).not.toHaveBeenCalled();
  });

  it('sukses: mengirim email staf + secret, mencatat audit SSO_LAUNCH', async () => {
    getIntegration.mockReturnValue(cfg);
    const fetchSpy = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ url: 'https://pos.example.com/sso?ticket=abc' })));
    vi.stubGlobal('fetch', fetchSpy);

    const res = await call('posGudang');

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: 'https://pos.example.com/sso?ticket=abc' });
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://pos.example.com/api/portal/sso/ticket');
    expect(init.headers.Authorization).toBe(`Bearer ${cfg.secret}`);
    expect(JSON.parse(init.body)).toMatchObject({ email: 'admin@rep.test' });
    expect(auditAdd).toHaveBeenCalledWith(expect.objectContaining({ action: 'SSO_LAUNCH', actorEmail: 'admin@rep.test' }));
  });
});
