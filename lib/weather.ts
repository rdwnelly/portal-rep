/**
 * Ramalan cuaca Sorong / Aimas dari Open-Meteo (gratis, tanpa kunci API, boleh dipanggil dari browser).
 * Koordinat: Rumah Etnik Papua, Jl. Aimas–Klamono Km. 21.
 */

const FORECAST_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=-0.8653&longitude=131.2514' +
  '&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m' +
  '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
  '&forecast_days=7&timezone=Asia%2FJayapura';

export type WeatherKind = 'clear' | 'partly' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'heavy-rain' | 'storm' | 'snow';

export interface WeatherCondition {
  label: string;
  kind: WeatherKind;
}

/** Kode cuaca WMO → label Indonesia. Mengikuti tabel resmi Open-Meteo. */
export function describeWeather(code: number): WeatherCondition {
  if (code === 0) return { label: 'Cerah', kind: 'clear' };
  if (code === 1) return { label: 'Cerah berawan', kind: 'partly' };
  if (code === 2) return { label: 'Berawan sebagian', kind: 'partly' };
  if (code === 3) return { label: 'Mendung', kind: 'cloudy' };
  if (code === 45 || code === 48) return { label: 'Berkabut', kind: 'fog' };
  if (code >= 51 && code <= 57) return { label: 'Gerimis', kind: 'drizzle' };
  if (code === 61 || code === 80) return { label: 'Hujan ringan', kind: 'rain' };
  if (code === 63 || code === 81) return { label: 'Hujan sedang', kind: 'rain' };
  if (code === 65 || code === 82 || code === 66 || code === 67) return { label: 'Hujan lebat', kind: 'heavy-rain' };
  if (code >= 71 && code <= 77) return { label: 'Salju', kind: 'snow' };
  if (code === 85 || code === 86) return { label: 'Hujan salju', kind: 'snow' };
  if (code === 95) return { label: 'Badai petir', kind: 'storm' };
  if (code === 96 || code === 99) return { label: 'Badai petir & es', kind: 'storm' };
  return { label: 'Berawan', kind: 'cloudy' };
}

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  code: number;
  isDay: boolean;
  /** "HH.mm" WIT saat data diambil. */
  observedAt: string;
}

export interface DailyWeather {
  /** YYYY-MM-DD */
  date: string;
  code: number;
  max: number;
  min: number;
  /** Peluang hujan maksimum hari itu, 0–100. */
  rainChance: number | null;
}

export interface Forecast {
  current: CurrentWeather;
  daily: DailyWeather[];
}

interface OpenMeteoResponse {
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    is_day: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: (number | null)[];
  };
}

/** Ubah respons Open-Meteo menjadi bentuk yang dipakai UI (fungsi murni, mudah diuji). */
export function parseForecast(data: OpenMeteoResponse): Forecast {
  const c = data.current;
  return {
    current: {
      temperature: Math.round(c.temperature_2m),
      feelsLike: Math.round(c.apparent_temperature),
      humidity: Math.round(c.relative_humidity_2m),
      windSpeed: Math.round(c.wind_speed_10m),
      code: c.weather_code,
      isDay: c.is_day === 1,
      observedAt: c.time.slice(11, 16).replace(':', '.'),
    },
    daily: data.daily.time.map((date, i) => ({
      date,
      code: data.daily.weather_code[i],
      max: Math.round(data.daily.temperature_2m_max[i]),
      min: Math.round(data.daily.temperature_2m_min[i]),
      rainChance: data.daily.precipitation_probability_max[i] ?? null,
    })),
  };
}

/** Ambil ramalan; null bila layanan tidak terjangkau (UI menampilkan "tidak tersedia", bukan angka palsu). */
export async function fetchForecast(signal?: AbortSignal): Promise<Forecast | null> {
  try {
    const res = await fetch(FORECAST_URL, { signal });
    if (!res.ok) return null;
    return parseForecast((await res.json()) as OpenMeteoResponse);
  } catch {
    return null;
  }
}
