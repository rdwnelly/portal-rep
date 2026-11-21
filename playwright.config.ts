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
        // Identitas proyek dipaku ke proyek emulator. Tanpa ini, `.env.local` milik pengembang
        // (berisi proyek Firebase sungguhan) ikut terbaca oleh `next build`, sehingga portal
        // membaca proyek produksi sementara uji menyemai data ke `demo-portal-rep` —
        // akibatnya whitelist tidak ditemukan dan semua uji login gagal.
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-portal-rep',
        NEXT_PUBLIC_FIREBASE_API_KEY: 'demo-api-key',
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'localhost',
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'demo-portal-rep.appspot.com',
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '0',
        NEXT_PUBLIC_FIREBASE_APP_ID: '1:0:web:demo',
        NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: '',
        NEXT_PUBLIC_FIREBASE_VAPID_KEY: '',
        INTEGRATION_POS_URL: `http://localhost:${MOCK_PORT}`,
        INTEGRATION_POS_SECRET: MOCK_SECRET,
      },
      reuseExistingServer: false,
    },
  ],
});
