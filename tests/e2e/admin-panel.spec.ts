import { expect, test } from '@playwright/test';
import {
  completePasswordSetup,
  getAuthUser,
  HOME_URL,
  login,
  loginAndWait,
  resetEmulators,
  seedContent,
  seedStandardUsers,
} from './support/emulator';

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
  [/^1\. Agenda Budaya/, 'Kelola Agenda, Pentas Budaya & Kunjungan Homestay'],
  [/^2\. Whitelist Karyawan/, 'Manajemen Karyawan & Hak Akses Whitelist (RBAC)'],
  [/^3\. Permohonan Akses/, 'Otorisasi & Permohonan Pendaftaran Akun Staf'],
  [/^4\. Link Aplikasi/, 'Konfigurasi Link & Modul Sub-Aplikasi'],
  [/^5\. Info Yayasan/, 'Profil & Informasi Resmi Yayasan REP'],
  [/^6\. Audit Logs/, 'Audit Trail & Jejak Aktivitas Keamanan'],
];

test('keenam tab panel admin dapat dibuka', async ({ page }) => {
  for (const [tab, heading] of TABS) {
    await page.getByRole('tab', { name: tab }).click();
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  }
});

test('menambah karyawan ke whitelist & tidak bisa mengubah role akun sendiri', async ({ page }) => {
  await page.getByRole('tab', { name: /^2\. Whitelist Karyawan/ }).click();
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
  await page.getByRole('tab', { name: /^5\. Info Yayasan/ }).click();
  await expect(page.getByRole('heading', { name: 'Profil & Informasi Resmi Yayasan REP' })).toBeVisible();
  await expect(page.locator('input').first()).toHaveValue('Yayasan Rumah Etnik Papua');
});

test('inisialisasi data awal hanya mengisi koleksi kosong', async ({ page }) => {
  await page.getByRole('tab', { name: /^6\. Audit Logs/ }).click();
  await page.getByRole('button', { name: 'Jalankan' }).click();
  await expect(page.getByText('Modul aplikasi: dilewati (sudah berisi data)').first()).toBeVisible();
  await expect(page.getByText('Informasi yayasan: ditambahkan').first()).toBeVisible();
});

test('karyawan baru langsung mendapat akun login dan bisa masuk sendiri', async ({ page, browser }) => {
  const email = 'karyawan.baru@rep.test';
  const password = 'KataSandiKaryawan#2026';

  // Sebelum ditambahkan, belum ada akun login sama sekali.
  expect(await getAuthUser(email)).toBeNull();

  await page.getByRole('tab', { name: /^2\. Whitelist Karyawan/ }).click();
  await page.getByRole('button', { name: 'Tambah Karyawan Baru' }).click();
  await page.getByPlaceholder('Contoh: Samuel Burdam').fill('Karyawan Baru');
  await page.getByPlaceholder('samuel@gmail.com').fill(email);
  await page.getByRole('button', { name: 'Simpan Karyawan' }).click();

  // Portal membuat akun loginnya dan mengirim tautan pembuatan kata sandi.
  await expect(page.getByText(/Tautan pembuatan kata sandi sudah dikirim/)).toBeVisible();
  await expect.poll(() => getAuthUser(email)).toMatchObject({ emailVerified: true, disabled: false });

  // Karyawan membuka tautan dari emailnya, membuat kata sandi, lalu masuk sendiri.
  // Konteks terpisah: sesi Firebase milik admin tidak boleh ikut terbawa.
  await completePasswordSetup(email, password);
  const staffContext = await browser.newContext();
  const staffPage = await staffContext.newPage();
  await login(staffPage, email, { password });
  await staffPage.waitForURL(HOME_URL);
  await expect(staffPage.getByRole('heading', { name: 'Akses Terbatas' })).toHaveCount(0);
  await staffContext.close();
});

test('menonaktifkan karyawan ikut mengunci akun loginnya', async ({ page }) => {
  const email = 'karyawan.nonaktif@rep.test';
  await page.getByRole('tab', { name: /^2\. Whitelist Karyawan/ }).click();
  await page.getByRole('button', { name: 'Tambah Karyawan Baru' }).click();
  await page.getByPlaceholder('Contoh: Samuel Burdam').fill('Karyawan Nonaktif');
  await page.getByPlaceholder('samuel@gmail.com').fill(email);
  await page.getByRole('button', { name: 'Simpan Karyawan' }).click();
  await expect.poll(() => getAuthUser(email)).toMatchObject({ disabled: false });

  const row = page.getByRole('row').filter({ hasText: email });
  await row.getByRole('button', { name: 'Aktif' }).click();

  await expect(page.getByText(/dinonaktifkan/)).toBeVisible();
  await expect.poll(() => getAuthUser(email)).toMatchObject({ disabled: true });
});
