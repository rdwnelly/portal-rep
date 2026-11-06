import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchSectionSummary, getIntegration } from '@/lib/server/integrations';
import { EMPTY_SECTIONS } from '@/lib/integration-contract';

const SECRET = 'x'.repeat(64);

function configurePos() {
  vi.stubEnv('INTEGRATION_POS_URL', 'https://pos.example.com/');
  vi.stubEnv('INTEGRATION_POS_SECRET', SECRET);
}

const okResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const validBody = {
  contractVersion: 1,
  period: 'TODAY',
  generatedAt: '2026-11-06T00:00:00.000Z',
  data: { ...EMPTY_SECTIONS.posGudang, dailySalesVolume: 90000 },
};

afterEach(() => vi.unstubAllEnvs());

describe('getIntegration', () => {
  it('null bila URL atau secret belum diisi', () => {
    vi.stubEnv('INTEGRATION_POS_URL', 'https://pos.example.com');
    vi.stubEnv('INTEGRATION_POS_SECRET', '');
    expect(getIntegration('posGudang')).toBeNull();
  });

  it('membuang garis miring di akhir URL', () => {
    configurePos();
    expect(getIntegration('posGudang')?.baseUrl).toBe('https://pos.example.com');
  });
});

describe('fetchSectionSummary', () => {
  it('NOT_CONFIGURED tanpa memanggil jaringan bila integrasi belum disiapkan', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const result = await fetchSectionSummary('reservasi', 'TODAY');
    expect(result.status).toBe('NOT_CONFIGURED');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('LIVE: memanggil endpoint kontrak dengan secret dan mengembalikan data', async () => {
    configurePos();
    const fetchSpy = vi.fn().mockResolvedValue(okResponse(validBody));
    vi.stubGlobal('fetch', fetchSpy);

    const result = await fetchSectionSummary('posGudang', 'THIS_WEEK');

    expect(result.status).toBe('LIVE');
    expect(result.data?.dailySalesVolume).toBe(90000);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://pos.example.com/api/portal/summary?period=THIS_WEEK');
    expect(init.headers.Authorization).toBe(`Bearer ${SECRET}`);
    expect(init.cache).toBe('no-store');
  });

  it('ERROR bila sub-aplikasi membalas HTTP gagal', async () => {
    configurePos();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse({ error: 'x' }, 401)));
    const result = await fetchSectionSummary('posGudang', 'TODAY');
    expect(result).toMatchObject({ status: 'ERROR', message: expect.stringContaining('401') });
    expect(result.data).toBeUndefined();
  });

  it('ERROR bila versi kontrak berbeda', async () => {
    configurePos();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse({ ...validBody, contractVersion: 2 })));
    expect((await fetchSectionSummary('posGudang', 'TODAY')).status).toBe('ERROR');
  });

  it('ERROR (bukan angka karangan) bila format data tidak sesuai kontrak', async () => {
    configurePos();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse({ ...validBody, data: { dailySalesVolume: 'banyak' } })));
    const result = await fetchSectionSummary('posGudang', 'TODAY');
    expect(result.status).toBe('ERROR');
    expect(result.data).toBeUndefined();
  });

  it('ERROR dengan pesan batas waktu bila sub-aplikasi lambat', async () => {
    configurePos();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(Object.assign(new Error('t'), { name: 'TimeoutError' })));
    const result = await fetchSectionSummary('posGudang', 'TODAY');
    expect(result).toMatchObject({ status: 'ERROR', message: expect.stringContaining('8 detik') });
  });
});
