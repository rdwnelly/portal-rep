import { beforeEach, describe, expect, it, vi } from 'vitest';

const verifyIdToken = vi.fn();
const whitelistGet = vi.fn();

vi.mock('@/lib/server/firebase-admin', () => ({
  AdminNotConfiguredError: class AdminNotConfiguredError extends Error {},
  adminAuth: () => ({ verifyIdToken }),
  adminDb: () => ({ doc: (path: string) => ({ get: () => whitelistGet(path) }) }),
}));

const { requireStaff, HttpError, errorResponse } = await import('@/lib/server/auth');

const req = (token?: string) =>
  new Request('http://localhost/api/x', token ? { headers: { Authorization: `Bearer ${token}` } } : {});

const staffDoc = (data: Record<string, unknown> | null) => ({ exists: data !== null, data: () => data ?? undefined });

beforeEach(() => {
  verifyIdToken.mockReset();
  whitelistGet.mockReset();
});

describe('requireStaff (verifikasi pemanggil API portal)', () => {
  it('401 tanpa header Authorization', async () => {
    await expect(requireStaff(req())).rejects.toMatchObject({ status: 401 });
    expect(verifyIdToken).not.toHaveBeenCalled();
  });

  it('401 bila ID token tidak valid', async () => {
    verifyIdToken.mockRejectedValue(new Error('bad token'));
    await expect(requireStaff(req('palsu'))).rejects.toMatchObject({ status: 401 });
  });

  it('403 bila email belum terverifikasi (cegah akun palsu berEmail pimpinan)', async () => {
    verifyIdToken.mockResolvedValue({ uid: 'u', email: 'ketua@rep.test', email_verified: false });
    await expect(requireStaff(req('t'))).rejects.toMatchObject({ status: 403 });
    expect(whitelistGet).not.toHaveBeenCalled();
  });

  it('403 bila tidak terdaftar atau dinonaktifkan di whitelist', async () => {
    verifyIdToken.mockResolvedValue({ uid: 'u', email: 'x@rep.test', email_verified: true });
    whitelistGet.mockResolvedValueOnce(staffDoc(null));
    await expect(requireStaff(req('t'))).rejects.toMatchObject({ status: 403 });
    whitelistGet.mockResolvedValueOnce(staffDoc({ role: 'IT_ADMIN', active: false, name: 'X' }));
    await expect(requireStaff(req('t'))).rejects.toMatchObject({ status: 403 });
  });

  it('membaca role dari whitelist/{email huruf kecil}', async () => {
    verifyIdToken.mockResolvedValue({ uid: 'u1', email: 'Ketua@REP.test', email_verified: true });
    whitelistGet.mockResolvedValue(staffDoc({ role: 'EXECUTIVE', active: true, name: 'Ketua' }));
    await expect(requireStaff(req('t'), ['EXECUTIVE', 'IT_ADMIN'])).resolves.toEqual({
      uid: 'u1',
      email: 'ketua@rep.test',
      name: 'Ketua',
      role: 'EXECUTIVE',
    });
    expect(whitelistGet).toHaveBeenCalledWith('whitelist/ketua@rep.test');
  });

  it('403 bila role tidak termasuk yang diizinkan', async () => {
    verifyIdToken.mockResolvedValue({ uid: 'u', email: 'staf@rep.test', email_verified: true });
    whitelistGet.mockResolvedValue(staffDoc({ role: 'OPERATIONAL', active: true, name: 'Staf' }));
    await expect(requireStaff(req('t'), ['IT_ADMIN'])).rejects.toMatchObject({ status: 403 });
  });
});

describe('errorResponse', () => {
  it('meneruskan status & pesan HttpError', async () => {
    const res = errorResponse(new HttpError(403, 'Ditolak'));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'Ditolak' });
  });

  it('menyembunyikan detail error tak terduga di produksi', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = errorResponse(new Error('stack rahasia: koneksi db gagal'));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Terjadi kesalahan server.' });
  });
});
