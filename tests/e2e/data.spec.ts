import { expect, test } from '@playwright/test';
import { resetEmulators, seedContent, seedStandardUsers } from './support/emulator';

test.beforeAll(async () => {
  await resetEmulators();
  await seedStandardUsers();
  await seedContent();
});

test('daftar aplikasi dimuat dari Firestore di halaman Aplikasi — tidak di beranda', async ({ page }) => {
  await page.goto('/apps');
  await expect(page.getByText('Sistem Manajemen Reservasi').first()).toBeVisible();

  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Buka aplikasi kerja' })).toBeVisible();
  await expect(page.getByText('Sistem Manajemen Reservasi')).toHaveCount(0);
  await expect(page.getByText('Denyut Operasional')).toHaveCount(0);
});

test('beranda menampilkan ramalan cuaca 7 hari', async ({ page }) => {
  const days = ['2026-11-27', '2026-11-28', '2026-11-29', '2026-11-30', '2026-12-01', '2026-12-02', '2026-12-03'];
  await page.route('https://api.open-meteo.com/**', (route) =>
    route.fulfill({
      json: {
        current: {
          time: '2026-11-27T14:15',
          temperature_2m: 30.6,
          relative_humidity_2m: 78,
          apparent_temperature: 35.4,
          is_day: 1,
          weather_code: 65,
          wind_speed_10m: 9.6,
        },
        daily: {
          time: days,
          weather_code: [65, 3, 0, 61, 95, 2, 80],
          temperature_2m_max: [31, 30, 32, 31, 30, 31, 31],
          temperature_2m_min: [24, 24, 25, 24, 24, 24, 24],
          precipitation_probability_max: [96, 40, 10, 70, 90, 30, 60],
        },
      },
    })
  );
  await page.goto('/');
  const weather = page.getByRole('region', { name: /Sorong/ });
  await expect(weather.getByText('31°').first()).toBeVisible();
  await expect(weather.getByText('Hujan lebat')).toBeVisible();
  await expect(weather.getByText('Diperbarui 14.15 WIT')).toBeVisible();
  await expect(weather.getByRole('listitem')).toHaveCount(7);
  // Peluang hujan tinggi memunculkan saran payung.
  await expect(weather.getByText(/Peluang hujan hari ini 96%/)).toBeVisible();
});

test('bila layanan cuaca gagal, beranda menulis "belum dapat dimuat" — bukan angka palsu', async ({ page }) => {
  await page.route('https://api.open-meteo.com/**', (route) => route.abort());
  await page.goto('/');
  await expect(page.getByText('Ramalan cuaca belum dapat dimuat')).toBeVisible();
});

