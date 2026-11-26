import { expect, test } from '@playwright/test';
import { countDocs, resetEmulators, seedContent } from './support/emulator';

/** Semua uji di sini berjalan sebagai pengunjung TANPA login. */
test.beforeAll(async () => {
  await resetEmulators();
  await seedContent();
});

test.beforeEach(({ page }) => {
  page.on('dialog', (d) => d.accept());
});

test('database kosong tidak menampilkan agenda contoh palsu', async ({ page }) => {
  await page.goto('/agenda');
  await expect(page.getByText(/Belum ada agenda mendatang/)).toBeVisible();
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Belum ada agenda mendatang' })).toBeVisible();
});

test('pengunjung tanpa login bisa menambah, mengubah, lalu menghapus agenda', async ({ page }) => {
  await page.goto('/agenda');

  // Tambah
  await page.getByRole('button', { name: 'Tambah', exact: true }).click();
  await page.getByPlaceholder('Contoh: Pentas Tari Tradisional Sambutan Tamu Wisata').fill('Latihan Tari Yospan E2E');
  await page.locator('input[type=date]').fill('2099-01-15');
  await page.getByRole('button', { name: 'Terbitkan Agenda' }).click();
  await expect(page.getByText('Latihan Tari Yospan E2E')).toBeVisible();
  await expect.poll(() => countDocs('events')).toBe(1);

  // Tampil di beranda sebagai agenda mendatang
  await page.goto('/');
  await expect(page.getByText('Latihan Tari Yospan E2E')).toBeVisible();

  // Ubah
  await page.goto('/agenda');
  await page.getByText('Latihan Tari Yospan E2E').click();
  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByPlaceholder('Contoh: Pentas Tari Tradisional Sambutan Tamu Wisata').fill('Gladi Resik Tari Yospan E2E');
  await page.getByRole('button', { name: 'Simpan Perubahan' }).click();
  await expect(page.getByText('Gladi Resik Tari Yospan E2E')).toBeVisible();
  await expect(page.getByText('Latihan Tari Yospan E2E')).toHaveCount(0);

  // Hapus
  await page.getByText('Gladi Resik Tari Yospan E2E').click();
  await page.getByRole('button', { name: 'Hapus' }).click();
  await expect(page.getByText('Gladi Resik Tari Yospan E2E')).toHaveCount(0);
  await expect.poll(() => countDocs('events')).toBe(0);
});

/** Tanggal di bulan berjalan (zona WIT) untuk data libur palsu yang pasti tampil di kalender. */
const thisMonthDay = (day: number) => {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jayapura' }).format(new Date());
  return `${today.slice(0, 8)}${String(day).padStart(2, '0')}`;
};

test('kalender menandai libur nasional & cuti bersama, dan menampilkannya per bulan', async ({ page }) => {
  const year = Number(thisMonthDay(1).slice(0, 4));
  await page.route('**/api/libur?year=*', (route) =>
    route.fulfill({
      json: {
        year,
        holidays: [
          { date: thisMonthDay(10), name: 'Libur Uji Nasional', type: 'LIBUR_NASIONAL' },
          { date: thisMonthDay(11), name: 'Cuti Bersama Uji', type: 'CUTI_BERSAMA' },
        ],
      },
    })
  );
  await page.goto('/agenda');

  // Daftar libur bulan ini
  const monthly = page.getByRole('region', { name: /Libur nasional/ });
  await expect(monthly.getByText('Libur Uji Nasional')).toBeVisible();
  await expect(monthly.getByText('Cuti Bersama Uji')).toBeVisible();

  // Sel kalender membawa nama libur (untuk pembaca layar)
  const grid = page.getByRole('grid');
  await expect(grid.getByRole('button', { name: /libur: Libur Uji Nasional/ })).toBeVisible();
  await expect(grid.getByRole('button', { name: /cuti bersama: Cuti Bersama Uji/ })).toBeVisible();

  // Memilih tanggal libur menampilkan rinciannya
  await grid.getByRole('button', { name: /libur: Libur Uji Nasional/ }).click();
  const detail = page.getByRole('region', { name: /^\w+, 10 / });
  await expect(detail.getByText('Libur Uji Nasional')).toBeVisible();
  await expect(detail.getByText('Libur nasional', { exact: true })).toBeVisible();
});

test('"Tambah agenda di tanggal ini" mengisi tanggal yang dipilih di kalender', async ({ page }) => {
  await page.route('**/api/libur?year=*', (route) => route.fulfill({ json: { holidays: [] } }));
  await page.goto('/agenda');
  await page.getByRole('grid').getByRole('button', { name: new RegExp(`^\\w+, 20 `) }).click();
  await page.getByRole('button', { name: 'Tambah agenda di tanggal ini' }).click();
  await expect(page.locator('input[type=date]')).toHaveValue(thisMonthDay(20));
});

test('bila data libur gagal dimuat, kalender tetap tampil dengan keterangan jujur', async ({ page }) => {
  await page.route('**/api/libur?year=*', (route) => route.fulfill({ status: 502, json: { holidays: [] } }));
  await page.goto('/agenda');
  await expect(page.getByRole('grid')).toBeVisible();
  await expect(page.getByText('Data libur nasional belum dapat dimuat').first()).toBeVisible();
});
