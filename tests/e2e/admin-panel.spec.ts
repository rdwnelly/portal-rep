import { expect, test } from '@playwright/test';
import { INITIAL_APPS } from '../../lib/seed-data';
import { countDocs, loginAndWait, readDoc, resetEmulators, seedContent, seedStandardUsers } from './support/emulator';

const POS = INITIAL_APPS.find((a) => a.id === 'app-pos')!;

test.describe('panel admin — kelola link aplikasi', () => {
  test.beforeAll(async () => {
    await resetEmulators();
    await seedStandardUsers();
    await seedContent();
  });

  test.beforeEach(async ({ page }) => {
    page.on('dialog', (d) => d.accept());
    await loginAndWait(page, 'admin@rep.test');
  });

  test('halaman hanya berisi satu panel: Link Aplikasi', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Link Aplikasi');
    await expect(page.getByRole('button', { name: 'Tambah Modul Aplikasi' })).toBeVisible();
    // Setiap aplikasi yang sudah ada punya tombol Edit.
    await expect(page.getByRole('button', { name: /^Edit / })).toHaveCount(5);
    await expect(page.getByRole('tablist')).toHaveCount(0);
    for (const removed of ['Whitelist', 'Audit', 'Permohonan', 'Info Yayasan', 'Denyut Operasional']) {
      await expect(page.getByText(removed)).toHaveCount(0);
    }
  });

  test('aplikasi baru langsung tampil di halaman Aplikasi publik', async ({ page, browser }) => {
    await page.getByRole('button', { name: 'Tambah Modul Aplikasi' }).click();
    await page.getByPlaceholder('Contoh: Sistem Informasi Keuangan').fill('Aplikasi Uji E2E');
    await page.getByPlaceholder('https://apk-reservasi-homestay-rep.vercel.app').fill('https://uji-e2e.vercel.app');
    await page.getByRole('button', { name: 'Tambah Modul Aplikasi' }).last().click();
    await expect(page.getByRole('heading', { name: 'Aplikasi Uji E2E' })).toBeVisible();

    // Pengunjung tanpa login melihatnya di halaman Aplikasi.
    const visitor = await browser.newContext();
    const appsPage = await visitor.newPage();
    await appsPage.goto('/apps');
    await expect(appsPage.getByText('Aplikasi Uji E2E')).toBeVisible();
    await visitor.close();
  });

  test('mengubah link aplikasi tersimpan di database', async ({ page }) => {
    await page.getByRole('button', { name: `Edit ${POS.title}` }).click();
    await page.getByPlaceholder('https://apk-reservasi-homestay-rep.vercel.app').fill('https://pos-baru.vercel.app');
    await page.getByRole('button', { name: 'Simpan Perubahan' }).click();
    await expect.poll(async () => (await readDoc(`apps/${POS.id}`))?.url).toBe('https://pos-baru.vercel.app');
  });

  test('link selain http/https ditolak sebelum disimpan', async ({ page }) => {
    await page.getByRole('button', { name: `Edit ${POS.title}` }).click();
    await page.getByPlaceholder('https://apk-reservasi-homestay-rep.vercel.app').fill('javascript:alert(1)');
    await page.getByRole('button', { name: 'Simpan Perubahan' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'http:// atau https://' })).toBeVisible();
  });

  test('menghapus aplikasi', async ({ page }) => {
    const zeey = INITIAL_APPS.find((a) => a.id === 'app-zeestudio')!;
    await page.getByRole('button', { name: `Hapus ${zeey.title}` }).click();
    await expect.poll(() => readDoc(`apps/${zeey.id}`)).toBeNull();
  });
});

test.describe('panel admin — database masih kosong', () => {
  test.beforeAll(async () => {
    await resetEmulators();
    await seedStandardUsers();
    // Sengaja tanpa seedContent: kondisi produksi pertama kali.
  });

  test('mengubah satu link bawaan menyimpan seluruh daftar bawaan, tidak ada yang hilang', async ({ page }) => {
    await loginAndWait(page, 'admin@rep.test');
    await expect(page.getByText('daftar bawaan')).toBeVisible();
    expect(await countDocs('apps')).toBe(0);

    await page.getByRole('button', { name: `Edit ${POS.title}` }).click();
    await page.getByPlaceholder('https://apk-reservasi-homestay-rep.vercel.app').fill('https://pos-baru.vercel.app');
    await page.getByRole('button', { name: 'Simpan Perubahan' }).click();

    await expect.poll(() => countDocs('apps')).toBe(INITIAL_APPS.length);
    await expect.poll(async () => (await readDoc(`apps/${POS.id}`))?.url).toBe('https://pos-baru.vercel.app');
    await expect(page.getByText('daftar bawaan')).toHaveCount(0);
  });
});
