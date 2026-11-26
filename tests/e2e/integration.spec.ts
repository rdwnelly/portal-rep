import { expect, test } from '@playwright/test';
import { HOME_URL, idToken, loginAndWait, resetEmulators, seedContent, seedStandardUsers } from './support/emulator';

test.beforeAll(async () => {
  await resetEmulators();
  await seedStandardUsers();
  await seedContent();
});

test.describe('API portal', () => {
  test('/api/metrics menolak anonim (401) & staf biasa (403)', async ({ request }) => {
    expect((await request.get('/api/metrics')).status()).toBe(401);
    const res = await request.get('/api/metrics', { headers: { Authorization: `Bearer ${await idToken('staf@rep.test')}` } });
    expect(res.status()).toBe(403);
  });

  test('/api/metrics: POS LIVE dari sub-aplikasi, lainnya belum terhubung', async ({ request }) => {
    const res = await request.get('/api/metrics?period=TODAY', {
      headers: { Authorization: `Bearer ${await idToken('ketua@rep.test')}` },
    });
    const body = await res.json();
    expect(res.status()).toBe(200);
    expect(body.sections.posGudang).toMatchObject({ status: 'LIVE', data: { dailySalesVolume: 123456 } });
    expect(body.sections.reservasi.status).toBe('NOT_CONFIGURED');
    expect(body.sections.reservasi.data).toBeUndefined();
    expect(body.operasional.activeStaffOnDuty).toBe(3);
    expect(body.operasional.systemHealthScore).toBe(100);
  });
});

test('dasbor eksekutif: kartu POS live, kartu lain tertutup "belum terhubung"', async ({ page }) => {
  await loginAndWait(page, 'ketua@rep.test');
  await page.goto('/eksekutif');
  await expect(page.getByText('Kopi Papua E2E (5x)').first()).toBeVisible();
  await expect(page.getByText(/Rp\s?123\.456/).first()).toBeVisible();
  for (const name of ['Reservasi Homestay', 'SIK-REP Keuangan', 'Zeey Studio']) {
    await expect(page.getByText(`${name} belum terhubung`)).toBeVisible();
  }
});

test('SSO: staf berakun langsung masuk ke sub-aplikasi', async ({ page, context }) => {
  await loginAndWait(page, 'admin@rep.test');
  await page.goto('/');
  const [tab] = await Promise.all([
    context.waitForEvent('page'),
    page.getByText(/Aplikasi Kasir \(POS\)|POS Kasir & OMG/).first().click(),
  ]);
  await tab.waitForURL(/localhost:3199\/sso\?ticket=[a-f0-9]{64}/);
  await expect(tab.getByText('SSO MOCK OK')).toBeVisible();
});

test('SSO: staf tanpa akun di sub-aplikasi diberi tahu & dibuka halaman biasa', async ({ page, context }) => {
  // Arahkan URL publik POS (dari data contoh) ke sub-aplikasi tiruan.
  await context.route('https://rep-pos-app.vercel.app/**', (route) => route.fulfill({ body: 'LOGIN POS BIASA' }));
  await loginAndWait(page, 'staf@rep.test', HOME_URL);
  await page.goto('/');
  const [tab] = await Promise.all([
    context.waitForEvent('page'),
    page.getByText(/Aplikasi Kasir \(POS\)|POS Kasir & OMG/).first().click(),
  ]);
  await expect(page.getByText('belum memiliki akun di aplikasi tiruan')).toBeVisible();
  await tab.waitForURL('https://rep-pos-app.vercel.app/**');
});
