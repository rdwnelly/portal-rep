import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------- mock lapisan server ----------
const requireStaff = vi.fn();
const getUserByEmail = vi.fn();
const createUser = vi.fn();
const updateUser = vi.fn();
const auditAdd = vi.fn().mockResolvedValue(undefined);
let whitelistDoc: { exists: boolean; data: () => unknown } = { exists: false, data: () => undefined };

vi.mock('@/lib/server/auth', async () => {
  const actual = await vi.importActual<typeof import('@/lib/server/auth')>('@/lib/server/auth');
  return { ...actual, requireStaff: (...args: unknown[]) => requireStaff(...args) };
});
vi.mock('@/lib/server/firebase-admin', () => ({
  AdminNotConfiguredError: class extends Error {},
  adminAuth: () => ({ getUserByEmail, createUser, updateUser }),
  adminDb: () => ({
    doc: () => ({ get: async () => whitelistDoc }),
    collection: () => ({ add: auditAdd }),
  }),
}));

const { POST, PATCH } = await import('@/app/api/staff/route');
const { HttpError } = await import('@/lib/server/auth');

const ADMIN = { uid: 'u1', email: 'admin@rep.test', name: 'Admin IT', role: 'IT_ADMIN' };

/** Error Firebase Admin saat akun belum ada. */
const notFound = Object.assign(new Error('no user'), { code: 'auth/user-not-found' });

const post = (body: unknown) =>
  POST(new Request('http://localhost/api/staff', { method: 'POST', body: JSON.stringify(body) }));
const patch = (body: unknown) =>
  PATCH(new Request('http://localhost/api/staff', { method: 'PATCH', body: JSON.stringify(body) }));

const whitelisted = (data: Record<string, unknown>) => {
  whitelistDoc = { exists: true, data: () => data };
};

beforeEach(() => {
  requireStaff.mockReset().mockResolvedValue(ADMIN);
  getUserByEmail.mockReset();
  createUser.mockReset().mockResolvedValue({ uid: 'baru' });
  updateUser.mockReset().mockResolvedValue(undefined);
  auditAdd.mockClear();
  whitelistDoc = { exists: false, data: () => undefined };
});

describe('POST /api/staff (menyiapkan akun login staf)', () => {
  it('hanya untuk IT Admin', async () => {
    requireStaff.mockRejectedValue(new HttpError(403, 'Role Anda tidak memiliki izin untuk aksi ini.'));
    expect((await post({ email: 'staf@rep.test' })).status).toBe(403);
    expect(requireStaff.mock.calls[0][1]).toEqual(['IT_ADMIN']);
  });

  it('menolak email tidak valid', async () => {
    expect((await post({ email: 'bukan-email' })).status).toBe(400);
  });

  it('menolak email yang belum ada di whitelist — route ini tidak memberi akses baru', async () => {
    getUserByEmail.mockRejectedValue(notFound);
    const res = await post({ email: 'orang.luar@rep.test' });
    expect(res.status).toBe(404);
    expect(createUser).not.toHaveBeenCalled();
  });

  it('membuat akun terverifikasi dengan kata sandi acak bila belum ada', async () => {
    whitelisted({ name: 'Samuel', active: true });
    getUserByEmail.mockRejectedValue(notFound);

    const res = await post({ email: 'Samuel@Rep.Test' });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ email: 'samuel@rep.test', created: true, emailVerified: true });

    const arg = createUser.mock.calls[0][0];
    expect(arg).toMatchObject({ email: 'samuel@rep.test', displayName: 'Samuel', emailVerified: true, disabled: false });
    // Kata sandi acak tidak pernah ditampilkan; panjang & tidak dapat ditebak.
    expect(String(arg.password).length).toBeGreaterThanOrEqual(24);
    expect(createUser.mock.calls[0][0].password).not.toBe(createUser.mock.calls[0][0].email);
  });

  it('akun karyawan nonaktif dibuat dalam keadaan terkunci', async () => {
    whitelisted({ name: 'Nonaktif', active: false });
    getUserByEmail.mockRejectedValue(notFound);
    await post({ email: 'nonaktif@rep.test' });
    expect(createUser.mock.calls[0][0].disabled).toBe(true);
  });

  it('TIDAK memverifikasi paksa akun yang sudah ada (bisa jadi didaftarkan orang lain)', async () => {
    whitelisted({ name: 'Ketua', active: true });
    getUserByEmail.mockResolvedValue({ uid: 'lama', emailVerified: false, disabled: false });

    const res = await post({ email: 'ketua@rep.test' });
    expect(await res.json()).toMatchObject({ created: false, emailVerified: false });
    expect(updateUser).not.toHaveBeenCalled();
    expect(createUser).not.toHaveBeenCalled();
  });

  it('mengaktifkan kembali akun yang terkunci bila whitelist-nya aktif', async () => {
    whitelisted({ name: 'Kembali', active: true });
    getUserByEmail.mockResolvedValue({ uid: 'lama', emailVerified: true, disabled: true });

    const res = await post({ email: 'kembali@rep.test' });
    expect(await res.json()).toMatchObject({ created: false, reactivated: true });
    expect(updateUser).toHaveBeenCalledWith('lama', { disabled: false });
  });
});

describe('PATCH /api/staff (menyelaraskan status aktif)', () => {
  it('menonaktifkan akun login', async () => {
    getUserByEmail.mockResolvedValue({ uid: 'x', disabled: false });
    const res = await patch({ email: 'staf@rep.test', active: false });
    expect(await res.json()).toMatchObject({ changed: true, active: false });
    expect(updateUser).toHaveBeenCalledWith('x', { disabled: true });
  });

  it('administrator tidak dapat mengunci akunnya sendiri', async () => {
    const res = await patch({ email: ADMIN.email, active: false });
    expect(res.status).toBe(400);
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('field active wajib boolean', async () => {
    expect((await patch({ email: 'staf@rep.test' })).status).toBe(400);
  });

  it('tidak melakukan apa-apa bila staf belum punya akun login', async () => {
    getUserByEmail.mockRejectedValue(notFound);
    const res = await patch({ email: 'belum@rep.test', active: false });
    expect(await res.json()).toMatchObject({ missing: true, changed: false });
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('tidak menulis ulang bila status sudah sesuai', async () => {
    getUserByEmail.mockResolvedValue({ uid: 'x', disabled: true });
    const res = await patch({ email: 'staf@rep.test', active: false });
    expect(await res.json()).toMatchObject({ changed: false });
    expect(updateUser).not.toHaveBeenCalled();
  });
});
