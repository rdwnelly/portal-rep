import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { loginAndWait, resetEmulators, seedContent, seedStandardUsers } from './support/emulator';

/**
 * Tampilan di layar HP staf: tidak ada geser horizontal, menu bawah tidak menutupi konten,
 * dan tidak ada header menu di atas. SCREENSHOT_DIR=<folder> untuk menyimpan tangkapan layar.
 */
const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR;
if (SCREENSHOT_DIR) mkdirSync(SCREENSHOT_DIR, { recursive: true });

const PHONES = [
  { name: 'android-kecil', width: 360, height: 740 },
  { name: 'iphone', width: 390, height: 844 },
];

const PUBLIC_PAGES = ['/', '/apps', '/dashboard/notices', '/dokumen', '/agenda', '/dashboard/admin/login'];

test.beforeAll(async () => {
  await resetEmulators();
  await seedStandardUsers();
  await seedContent();
});

/** Firestore real-time menjaga koneksi tetap terbuka → jangan menunggu 'networkidle'. */
async function settle(page: Page) {
  await page.waitForLoadState('load');
  await page.waitForTimeout(1200);
}

async function capture(page: Page, label: string) {
  if (SCREENSHOT_DIR) await page.screenshot({ path: `${SCREENSHOT_DIR}/${label}.png`, fullPage: true });
}

/** Tidak boleh ada elemen yang membuat halaman bisa digeser ke samping. */
async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, 'halaman melebar melebihi layar').toBeLessThanOrEqual(1);
}

/** Setelah digulir ke dasar, konten terakhir harus berada di atas menu bawah. */
async function expectDockDoesNotCoverContent(page: Page) {
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(150);
  const result = await page.evaluate(() => {
    const dock = document.querySelector('[data-bottom-dock]');
    if (!dock) return { ok: false, reason: 'menu bawah tidak ditemukan' };
    const dockTop = dock.getBoundingClientRect().top;
    const main = document.querySelector('main');
    if (!main) return { ok: true, reason: '' };
    // Elemen konten terdalam yang terlihat & paling bawah.
    let lowest = 0;
    main.querySelectorAll('*').forEach((el) => {
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      // Hanya elemen yang benar-benar dilihat/dipakai pengguna (abaikan ornamen kosong seperti glow dekoratif).
      const meaningful = Boolean(el.textContent?.trim()) || el.matches('input, select, textarea, button, a, img, svg');
      if (meaningful && r.height > 0 && r.width > 0 && style.visibility !== 'hidden' && style.position !== 'fixed' && el.children.length === 0) {
        lowest = Math.max(lowest, r.bottom);
      }
    });
    return { ok: lowest <= dockTop + 1, reason: `konten terbawah ${Math.round(lowest)}px, menu bawah mulai ${Math.round(dockTop)}px` };
  });
  expect(result.ok, result.reason).toBe(true);
}

for (const phone of PHONES) {
  test.describe(`layar ${phone.name} (${phone.width}px)`, () => {
    test.use({ viewport: { width: phone.width, height: phone.height }, isMobile: true, hasTouch: true });

    for (const path of PUBLIC_PAGES) {
      test(`pengunjung ${path}`, async ({ page }) => {
        await page.goto(path);
        await settle(page);
        await capture(page, `${phone.name}-anon${path.replace(/\//g, '_') || '_home'}`);
        await expect(page.locator('header')).toHaveCount(0);
        await expectNoHorizontalScroll(page);
        await expectDockDoesNotCoverContent(page);
      });
    }

    test('staf login: beranda, pengumuman & menu Lainnya', async ({ page }) => {
      await loginAndWait(page, 'staf@rep.test', '**/dashboard/admin');
      for (const path of ['/', '/dashboard/notices']) {
        await page.goto(path);
        await settle(page);
        await capture(page, `${phone.name}-staf${path.replace(/\//g, '_')}`);
        await expectNoHorizontalScroll(page);
        await expectDockDoesNotCoverContent(page);
      }
      await page.getByRole('button', { name: 'Lainnya' }).click();
      await capture(page, `${phone.name}-staf-menu-lainnya`);
      await expect(page.getByRole('button', { name: 'Keluar' })).toBeVisible();

      // Tombol tema benar-benar mengubah tampilan (varian dark: mengikuti kelas di <html>).
      const pageBg = () => page.evaluate(() => getComputedStyle(document.querySelector('.dock-safe')!).backgroundColor);
      const darkBg = await pageBg();
      await page.getByRole('button', { name: 'Tampilan Terang' }).click();
      await expect.poll(pageBg).not.toBe(darkBg);
      await page.keyboard.press('Escape');
      await capture(page, `${phone.name}-staf-tema-terang`);
    });

    test('pimpinan: panel admin & dasbor eksekutif', async ({ page }) => {
      await loginAndWait(page, 'ketua@rep.test');
      await capture(page, `${phone.name}-ketua_dashboard_admin`);
      await expectNoHorizontalScroll(page);
      await page.goto('/eksekutif');
      await settle(page);
      await capture(page, `${phone.name}-ketua_eksekutif`);
      await expectNoHorizontalScroll(page);
    });
  });
}
