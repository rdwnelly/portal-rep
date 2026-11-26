import { describe, expect, it } from 'vitest';
import { describeWeather, parseForecast } from '@/lib/weather';

describe('describeWeather (kode WMO → label Indonesia)', () => {
  it.each([
    [0, 'Cerah'],
    [2, 'Berawan sebagian'],
    // Widget lama menulis kode 3 sebagai "Cerah Berawan" dan 65 sebagai "Hujan Ringan".
    [3, 'Mendung'],
    [65, 'Hujan lebat'],
    [61, 'Hujan ringan'],
    [63, 'Hujan sedang'],
    [82, 'Hujan lebat'],
    [53, 'Gerimis'],
    [45, 'Berkabut'],
    [95, 'Badai petir'],
    [99, 'Badai petir & es'],
  ])('kode %i → %s', (code, label) => {
    expect(describeWeather(code).label).toBe(label);
  });

  it('kode tak dikenal tidak melempar error', () => {
    expect(describeWeather(1234).label).toBe('Berawan');
  });
});

describe('parseForecast', () => {
  const sample = {
    current: {
      time: '2026-11-27T14:15',
      temperature_2m: 30.6,
      relative_humidity_2m: 78.2,
      apparent_temperature: 35.4,
      is_day: 1,
      weather_code: 80,
      wind_speed_10m: 9.6,
    },
    daily: {
      time: ['2026-11-27', '2026-11-28'],
      weather_code: [80, 3],
      temperature_2m_max: [31.4, 30.5],
      temperature_2m_min: [24.4, 24.6],
      precipitation_probability_max: [96, null],
    },
  };

  it('membulatkan angka & menulis jam pengamatan dalam format WIT', () => {
    const f = parseForecast(sample);
    expect(f.current).toEqual({
      temperature: 31,
      feelsLike: 35,
      humidity: 78,
      windSpeed: 10,
      code: 80,
      isDay: true,
      observedAt: '14.15',
    });
  });

  it('ramalan harian; peluang hujan kosong tetap null (tidak diisi 0)', () => {
    expect(parseForecast(sample).daily).toEqual([
      { date: '2026-11-27', code: 80, max: 31, min: 24, rainChance: 96 },
      { date: '2026-11-28', code: 3, max: 31, min: 25, rainChance: null },
    ]);
  });
});
