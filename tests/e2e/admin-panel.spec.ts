import { expect, test } from '@playwright/test';
import { loginAndWait, resetEmulators, seedContent, seedStandardUsers } from './support/emulator';

test.beforeAll(async () => {
  await resetEmulators();
  await seedStandardUsers();
  await seedContent();
});

test.beforeEach(async ({ page }) => {
  page.on('dialog', (d) => d.accept());
  await loginAndWait(page, 'admin@rep.test');
});

const TABS: [RegExp, string][] = [
  [/^1\. Notifikasi/, 'Kelola Notifikasi & Pengumuman Internal Staf'],
  [/^2\. Agenda Budaya/, 'Kelola Agenda, Pentas Budaya & Kunjungan Homestay'],
  [/^3\. Dokumen & SOP/, 'Kelola Dokumen, SOP & Arsip Google Drive'],
  [/^4\. Whitelist Karyawan/, 'Manajemen Karyawan & Hak Akses Whitelist (RBAC)'],
  [/^5\. Permohonan Akses/, 'Otorisasi & Permohonan Pendaftaran Akun Staf'],
  [/^6\. Link Aplikasi/, 'Konfigurasi Link & Modul Sub-Aplikasi'],
  [/^7\. Info Yayasan/, 'Profil & Informasi Resmi Yayasan REP'],
  [/^8\. Audit Logs/, 'Audit Trail & Jejak Aktivitas Keamanan'],
];

test('kedelapan tab panel admin dapat dibuka', async ({ page }) => {
  for (const [tab, heading] of TABS) {
    await page.getByRole('button', { name: tab }).click();
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  }
});

test('membuat pengumuman dari panel → tampil di papan pengumuman publik', async ({ page, browser }) => {
  await page.getByRole('button', { name: 'Buat Pengumuman Baru' }).click();
  await page.getByPlaceholder('Contoh: Jadwal Pentas Seni Budaya & Rapat Pleno').fill('Rapat Pleno E2E');
  await page.getByPlaceholder('Tuliskan instruksi, detail agenda, atau pengumuman resmi...').fill('Isi rapat.');
  await page.getByRole('button', { name: 'Terbitkan Pengumuman' }).click();
  await expect(page.getByText('Rapat Pleno E2E').first()).toBeVisible();

  const visitor = await browser.newPage();
  await visitor.goto('/dashboard/notices');
  await expect(visitor.getByText('Rapat Pleno E2E').first()).toBeVisible();
  await visitor.close();
});

test('menambah karyawan ke whitelist & tidak bisa mengubah role akun sendiri', async ({ page }) => {
  await page.getByRole('button', { name: /^4\. Whitelist Karyawan/ }).click();
  await page.getByRole('button', { name: 'Tambah Karyawan Baru' }).click();
  await page.getByPlaceholder('Contoh: Samuel Burdam').fill('Samuel E2E');
  await page.getByPlaceholder('samuel@gmail.com').fill('samuel.e2e@rep.test');
  await page.getByRole('button', { name: 'Simpan Karyawan' }).click();
  await expect(page.getByText('samuel.e2e@rep.test')).toBeVisible();

  const ownRow = page.getByRole('row').filter({ hasText: 'admin@rep.test' });
  await expect(ownRow.getByRole('combobox')).toBeDisabled();
  await expect(ownRow.getByRole('button', { name: 'Hapus dari Whitelist' }).or(ownRow.getByTitle('Anda tidak dapat menghapus akun sendiri'))).toBeDisabled();
});

test('tab Info Yayasan menampilkan data tersimpan, bukan nilai default', async ({ page }) => {
  await page.getByRole('button', { name: /^7\. Info Yayasan/ }).click();
  await expect(page.getByRole('heading', { name: 'Profil & Informasi Resmi Yayasan REP' })).toBeVisible();
  await expect(page.locator('input').first()).toHaveValue('Yayasan Rumah Etnik Papua');
});

test('inisialisasi data awal hanya mengisi koleksi kosong', async ({ page }) => {
  await page.getByRole('button', { name: /^8\. Audit Logs/ }).click();
  await page.getByRole('button', { name: 'Jalankan' }).click();
  await expect(page.getByText('Modul aplikasi: dilewati (sudah berisi data)').first()).toBeVisible();
  await expect(page.getByText('Informasi yayasan: ditambahkan').first()).toBeVisible();
});
