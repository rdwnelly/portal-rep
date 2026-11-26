import { expect, test } from '@playwright/test';
import { createUser, HOME_URL, login, loginAndWait, resetEmulators, seedStandardUsers, whitelist } from './support/emulator';

test.beforeAll(async () => {
  await resetEmulators();
  await seedStandardUsers();
  await createUser('palsu.admin@rep.test', false); // belum verifikasi email
  await whitelist('palsu.admin@rep.test', 'IT_ADMIN');
  await createUser('luar@rep.test'); // terverifikasi, tidak di whitelist
  await createUser('superadmin@luar.test', true, 'admin2026'); // pola jalur pintas lama
});

test.describe('penjaga halaman', () => {
  test('pengunjung anonim tidak bisa membuka panel admin', async ({ page }) => {
    await page.goto('/dashboard/admin');
    await expect(page.getByRole('heading', { name: 'Akses Terbatas' })).toBeVisible();
  });

  test('dasbor eksekutif sudah dihapus', async ({ page }) => {
    const res = await page.goto('/eksekutif');
    expect(res?.status()).toBe(404);
  });

  test('akun terdaftar yang bukan IT_ADMIN ditolak dari panel admin', async ({ page }) => {
    await loginAndWait(page, 'staf@rep.test', HOME_URL);
    await page.goto('/dashboard/admin');
    await expect(page.getByText('tidak memiliki izin')).toBeVisible();
  });
});

test.describe('login', () => {
  test('jalur pintas lama (email berisi "admin" + password admin2026) tidak memberi akses', async ({ page }) => {
    await login(page, 'superadmin@luar.test', { password: 'admin2026' });
    await expect(page.getByText('tidak terdaftar sebagai admin portal')).toBeVisible();
  });

  test('akun ber-email admin yang belum diverifikasi ditolak', async ({ page }) => {
    await login(page, 'palsu.admin@rep.test');
    await expect(page.getByText('belum diverifikasi')).toBeVisible();
  });

  test('akun di luar whitelist ditolak', async ({ page }) => {
    await login(page, 'luar@rep.test');
    await expect(page.getByText('tidak terdaftar sebagai admin portal')).toBeVisible();
  });

  test('IT_ADMIN masuk ke panel dengan role dari Firestore', async ({ page }) => {
    await loginAndWait(page, 'admin@rep.test');
    await expect(page.getByRole('heading', { name: 'Link Aplikasi' })).toBeVisible();
  });

  test('parameter next mengembalikan ke halaman asal', async ({ page }) => {
    await login(page, 'admin@rep.test', { next: '/agenda' });
    await page.waitForURL('**/agenda');
  });

  test('parameter next ke domain luar diabaikan', async ({ page }) => {
    await login(page, 'admin@rep.test', { next: '//evil.example.com' });
    await page.waitForURL('**/dashboard/admin');
  });

  test('akun bukan admin mendarat di beranda, bukan layar akses terbatas', async ({ page }) => {
    await loginAndWait(page, 'staf@rep.test', HOME_URL);
    await expect(page.getByRole('heading', { name: 'Akses Terbatas' })).toHaveCount(0);
  });

  test('alamat login lama /dashboard/admin/login diarahkan ke /masuk', async ({ page }) => {
    await page.goto('/dashboard/admin/login?next=%2Fagenda');
    await page.waitForURL(/\/masuk\?next=%2Fagenda/);
    await expect(page.getByRole('heading', { name: 'Masuk Admin' })).toBeVisible();
  });

  test('pengguna yang sudah login tidak melihat formulir login lagi', async ({ page }) => {
    await loginAndWait(page, 'admin@rep.test');
    await page.goto('/masuk');
    await page.waitForURL('**/dashboard/admin');
  });

  test('lupa kata sandi tidak membocorkan apakah email terdaftar', async ({ page }) => {
    await page.goto('/masuk');
    await page.fill('input[type=email]', 'tidak.ada@rep.test');
    await page.click('button:has-text("Lupa kata sandi")');
    await expect(page.getByText('Jika tidak.ada@rep.test terdaftar')).toBeVisible();
  });
});
