import { expect, test } from '@playwright/test';
import { INITIAL_APPS } from '../../lib/seed-data';
import { putDoc, resetEmulators, seedContent } from './support/emulator';

const RESERVASI = INITIAL_APPS.find((a) => a.id === 'app-reservasi')!;
const ZEEY = INITIAL_APPS.find((a) => a.id === 'app-zeestudio')!;

test.beforeAll(async () => {
  await resetEmulators();
  await seedContent();
  // Satu aplikasi dinonaktifkan admin.
  const { id, ...rest } = ZEEY;
  await putDoc(`apps/${id}`, { ...rest, status: 'OFFLINE' });
});

test('mengetuk aplikasi menampilkan informasinya, bukan langsung membuka tab baru', async ({ page, context }) => {
  await page.goto('/apps');
  let opened = false;
  context.on('page', () => (opened = true));

  await page.getByRole('button', { name: new RegExp(RESERVASI.title) }).click();
  const dialog = page.getByRole('dialog', { name: RESERVASI.title });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(RESERVASI.description)).toBeVisible();
  await expect(dialog.getByText('apk-reservasi-homestay-rep.vercel.app')).toBeVisible();
  expect(opened).toBe(false);
});

test('"Buka aplikasi" membuka aplikasi yang benar di tab baru', async ({ page, context }) => {
  await context.route(`${RESERVASI.url}/**`, (route) => route.fulfill({ body: 'APLIKASI RESERVASI' }));
  await page.goto('/apps');
  await page.getByRole('button', { name: new RegExp(RESERVASI.title) }).click();

  const [tab] = await Promise.all([
    context.waitForEvent('page'),
    page.getByRole('dialog').getByRole('button', { name: 'Buka aplikasi' }).click(),
  ]);
  await tab.waitForURL(`${RESERVASI.url}/**`);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('aplikasi tidak aktif bisa dilihat informasinya tetapi tidak bisa dibuka', async ({ page }) => {
  await page.goto('/apps');
  const tile = page.getByRole('button', { name: new RegExp(ZEEY.title.replace(/[()]/g, '\\$&')) });
  await expect(tile).toContainText('Tidak aktif');
  await tile.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('sedang tidak aktif')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Buka aplikasi' })).toBeDisabled();
});

test('Escape menutup informasi dan fokus kembali ke ubin aplikasi', async ({ page }) => {
  await page.goto('/apps');
  const tile = page.getByRole('button', { name: new RegExp(RESERVASI.title) });
  await tile.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(tile).toBeFocused();
});

test('pencarian & filter kategori menyaring daftar aplikasi', async ({ page }) => {
  await page.goto('/apps');
  const tiles = page.locator('[id^="ubin-"]');
  await expect(tiles).toHaveCount(INITIAL_APPS.length);

  await page.getByRole('searchbox', { name: 'Cari aplikasi' }).fill('kasir');
  await expect(tiles).toHaveCount(1);
  await expect(tiles.first()).toContainText('Aplikasi Kasir (POS)');

  await page.getByRole('searchbox', { name: 'Cari aplikasi' }).fill('tidak-ada-xyz');
  await expect(page.getByText('Tidak ada aplikasi yang cocok dengan “tidak-ada-xyz”.')).toBeVisible();

  await page.getByRole('button', { name: 'Hapus pencarian' }).click();
  await page.getByRole('button', { name: /^Keuangan/ }).click();
  await expect(tiles).toHaveCount(1);
  await expect(tiles.first()).toContainText('SIK-REP');
});
