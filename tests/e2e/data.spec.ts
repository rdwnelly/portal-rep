import { expect, test } from '@playwright/test';
import { resetEmulators, seedContent, seedStandardUsers } from './support/emulator';

test.beforeAll(async () => {
  await resetEmulators();
  await seedStandardUsers();
  await seedContent();
});

test('beranda publik memuat modul dari Firestore tanpa metrik keuangan', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Sistem Manajemen Reservasi').first()).toBeVisible();
  await expect(page.getByText('Denyut Operasional')).toHaveCount(0);
});

