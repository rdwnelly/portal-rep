import { defineConfig } from '@playwright/test';

/**
 * Uji end-to-end terhadap Firebase Emulator (tidak menyentuh data produksi).
 * Jalankan: npm run test:e2e   (otomatis menyalakan emulator, portal, dan sub-aplikasi tiruan)
 * Lokal tanpa browser Playwright terpasang: PW_CHANNEL=chrome npm run test:e2e
 */
export const PORTAL_PORT = 3108;
export const MOCK_PORT = 3199;
export const MOCK_SECRET = 'e2e-secret-'.padEnd(64, 'x');

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /.*\.spec\.ts/,
  // Semua spesifikasi berbagi satu emulator → jalankan berurutan.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORTAL_PORT}`,
    channel: process.env.PW_CHANNEL || undefined,
    viewport: { width: 1280, height: 900 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: `node tests/e2e/support/mock-subapp.mjs`,
      port: MOCK_PORT,
      env: { MOCK_PORT: String(MOCK_PORT), PORTAL_INTEGRATION_SECRET: MOCK_SECRET },
      reuseExistingServer: false,
    },
    {
      // Build produksi di folder terpisah: mendekati kondisi deploy, mengaktifkan service worker,
      // dan tidak bentrok dengan `npm run dev` (Next 16 hanya mengizinkan satu dev server per proyek).
      command: `npx next build && npx next start -p ${PORTAL_PORT}`,
      port: PORTAL_PORT,
      timeout: 300_000,
      env: {
        NEXT_DIST_DIR: '.next-e2e',
        NEXT_PUBLIC_FIREBASE_EMULATOR: 'true',
        INTEGRATION_POS_URL: `http://localhost:${MOCK_PORT}`,
        INTEGRATION_POS_SECRET: MOCK_SECRET,
      },
      reuseExistingServer: false,
    },
  ],
});
