import { expect, test } from '@playwright/test';
import { loginAndWait, putDoc, resetEmulators, seedContent, seedStandardUsers, whitelist } from './support/emulator';

const CONFIDENTIAL = 'Salinan Akta Pendirian';
const PUBLIC_DOC = 'SOP Pelayanan Tamu';

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

test('pengunjung anonim hanya melihat dokumen non-rahasia', async ({ page }) => {
  await page.goto('/dokumen');
  await expect(page.getByText(PUBLIC_DOC).first()).toBeVisible();
  await expect(page.getByText(CONFIDENTIAL)).toHaveCount(0);
});

test('pengumuman baru muncul real-time tanpa reload', async ({ page }) => {
  await page.goto('/dashboard/notices');
  await expect(page.getByText('Integrasi Single Sign-On').first()).toBeVisible();
  await putDoc('notices/realtime-e2e', {
    title: 'UJI REALTIME E2E',
    content: 'isi',
    category: 'ANNOUNCEMENT',
    priority: 'HIGH',
    authorName: 'Ketua',
    authorRole: 'Ketua',
    createdAt: new Date().toISOString(),
    isPinned: false,
  });
  await expect(page.getByText('UJI REALTIME E2E').first()).toBeVisible();
});

test('staf melihat dokumen rahasia & kehilangannya seketika saat dinonaktifkan', async ({ page }) => {
  await loginAndWait(page, 'staf@rep.test');
  await page.goto('/dokumen');
  await expect(page.getByText(CONFIDENTIAL).first()).toBeVisible();
  await whitelist('staf@rep.test', 'OPERATIONAL', false);
  await expect(page.getByText(CONFIDENTIAL)).toHaveCount(0);
  await expect(page.getByText(PUBLIC_DOC).first()).toBeVisible();
  await whitelist('staf@rep.test', 'OPERATIONAL', true);
});
