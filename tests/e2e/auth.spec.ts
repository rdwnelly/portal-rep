import { expect, test } from '@playwright/test';
import { createUser, login, loginAndWait, resetEmulators, seedStandardUsers, whitelist } from './support/emulator';

test.beforeAll(async () => {
  await resetEmulators();
  await seedStandardUsers();
  await createUser('palsu.ketua@rep.test', false); // belum verifikasi email
  await whitelist('palsu.ketua@rep.test', 'EXECUTIVE');
  await createUser('luar@rep.test'); // terverifikasi, tidak di whitelist
  await createUser('superadmin@luar.test', true, 'admin2026'); // pola jalur pintas lama
});

test.describe('penjaga halaman', () => {
  for (const path of ['/dashboard/admin', '/eksekutif']) {
    test(`pengunjung anonim tidak bisa membuka ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { name: 'Akses Terbatas' })).toBeVisible();
    });
  }

  test('staf operasional ditolak dari panel admin berdasarkan role', async ({ page }) => {
    await loginAndWait(page, 'staf@rep.test');
    await expect(page.getByText('tidak memiliki izin')).toBeVisible();
  });
});

test.describe('login', () => {
  test('jalur pintas lama (email berisi "admin" + password admin2026) tidak memberi akses', async ({ page }) => {
    await login(page, 'superadmin@luar.test', { password: 'admin2026' });
    await expect(page.getByText('belum terdaftar sebagai staf aktif')).toBeVisible();
  });

  test('akun berEmail pimpinan yang belum diverifikasi ditolak', async ({ page }) => {
    await login(page, 'palsu.ketua@rep.test');
    await expect(page.getByText('belum diverifikasi')).toBeVisible();
  });

  test('akun di luar whitelist ditolak', async ({ page }) => {
    await login(page, 'luar@rep.test');
    await expect(page.getByText('belum terdaftar sebagai staf aktif')).toBeVisible();
  });

  test('IT_ADMIN masuk ke panel dengan role dari Firestore', async ({ page }) => {
    await loginAndWait(page, 'admin@rep.test');
    await expect(page.getByRole('heading', { name: 'Panel Admin' })).toBeVisible();
    await expect(page.getByText('admin · IT Superadmin')).toBeVisible();
  });

  test('parameter next mengembalikan ke halaman asal', async ({ page }) => {
    await login(page, 'ketua@rep.test', { next: '/eksekutif' });
    await page.waitForURL('**/eksekutif');
    await expect(page.getByRole('heading', { name: 'Akses Terbatas' })).toHaveCount(0);
  });

  test('parameter next ke domain luar diabaikan', async ({ page }) => {
    await login(page, 'admin@rep.test', { next: '//evil.example.com' });
    await page.waitForURL('**/dashboard/admin');
  });

  test('lupa kata sandi tidak membocorkan apakah email terdaftar', async ({ page }) => {
    await page.goto('/dashboard/admin/login');
    await page.fill('input[type=email]', 'tidak.ada@rep.test');
    await page.click('button:has-text("Lupa kata sandi")');
    await expect(page.getByText('Jika tidak.ada@rep.test terdaftar')).toBeVisible();
  });
});
