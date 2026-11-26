import { expect, test, type Page } from '@playwright/test';

/**
 * Notifikasi "Pasang PORTAL REP di HP". Browser uji tidak memunculkan event pasang secara
 * alami, jadi event `beforeinstallprompt` ditiru — persis bentuk yang dikirim Chrome.
 */
const fireInstallEvent = (page: Page, outcome: 'accepted' | 'dismissed' = 'accepted') =>
  page.evaluate((result) => {
    const e = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: string }>;
    };
    e.prompt = async () => {
      (window as unknown as { __diminta: number }).__diminta =
        ((window as unknown as { __diminta?: number }).__diminta ?? 0) + 1;
    };
    e.userChoice = Promise.resolve({ outcome: result });
    window.dispatchEvent(e);
  }, outcome);

const banner = (page: Page) => page.getByRole('dialog', { name: 'Pasang PORTAL REP di HP' });

test.describe('HP Android', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('muncul setelah jeda, tombol Pasang membuka dialog pemasangan browser', async ({ page }) => {
    await page.goto('/');
    await fireInstallEvent(page);
    await expect(banner(page)).toBeVisible();
    await banner(page).getByRole('button', { name: 'Pasang', exact: true }).click();
    await expect.poll(() => page.evaluate(() => (window as unknown as { __diminta?: number }).__diminta)).toBe(1);
    await expect(banner(page)).toHaveCount(0);
  });

  test('"Nanti" menyembunyikannya, dan tidak muncul lagi saat halaman dimuat ulang', async ({ page }) => {
    await page.goto('/');
    await fireInstallEvent(page);
    await banner(page).getByRole('button', { name: 'Nanti' }).click();
    await expect(banner(page)).toHaveCount(0);

    await page.reload();
    await fireInstallEvent(page);
    await page.waitForTimeout(3500);
    await expect(banner(page)).toHaveCount(0);
  });

  test('menu "Pasang di HP" memakai event yang sama — tidak berebut dengan notifikasi', async ({ page }) => {
    await page.goto('/');
    await fireInstallEvent(page);
    await page.getByRole('button', { name: 'Lainnya' }).click();
    await page.getByRole('button', { name: 'Pasang di HP' }).click();
    await page.getByRole('button', { name: 'Instal Sekarang' }).click();
    await expect.poll(() => page.evaluate(() => (window as unknown as { __diminta?: number }).__diminta)).toBe(1);
  });
});

test.describe('iPhone (Safari)', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  });

  test('menampilkan petunjuk Bagikan → Tambah ke Layar Utama, tanpa tombol Pasang', async ({ page }) => {
    await page.goto('/');
    await expect(banner(page)).toBeVisible();
    await expect(banner(page).getByText('Tambah ke Layar Utama')).toBeVisible();
    await expect(banner(page).getByRole('button', { name: 'Pasang', exact: true })).toHaveCount(0);
    await banner(page).getByRole('button', { name: 'Mengerti' }).click();
    await expect(banner(page)).toHaveCount(0);
  });
});

test('tidak muncul di komputer meskipun browser siap memasang', async ({ page }) => {
  await page.goto('/');
  await fireInstallEvent(page);
  await page.waitForTimeout(3500);
  await expect(banner(page)).toHaveCount(0);
});
