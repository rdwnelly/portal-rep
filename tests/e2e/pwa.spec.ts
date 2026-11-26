import { expect, test } from '@playwright/test';

/** Service worker hanya aktif di build produksi — suite e2e memang berjalan di `next start`. */
test('PWA: halaman yang pernah dibuka tetap tampil offline; halaman baru → halaman offline', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  // Muat ulang agar halaman dikendalikan service worker, lalu kunjungi halaman yang akan di-cache.
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await page.goto('/apps');
  await expect(page.getByRole('heading', { name: 'Semua aplikasi yayasan' })).toBeVisible();

  await context.setOffline(true);
  try {
    await page.goto('/apps');
    await expect(page.getByRole('heading', { name: 'Semua aplikasi yayasan' })).toBeVisible();
    await expect(page.getByText('Anda sedang offline')).toHaveCount(0);

    await page.goto('/agenda');
    await expect(page.getByRole('heading', { name: 'Anda sedang offline' })).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});

test('PWA: service worker mengendalikan navigasi & halaman offline sudah di-precache', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  const res = await page.reload();
  expect(res?.status()).toBe(200);
  expect(res?.fromServiceWorker()).toBe(true);
  const cached = await page.evaluate(async () => {
    const keys = await caches.keys();
    return keys.some((k) => k.startsWith('portal-rep-precache'));
  });
  expect(cached).toBe(true);
});
