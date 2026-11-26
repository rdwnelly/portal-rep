'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  Droplets,
  Wind,
  RefreshCw,
  Sparkles,
  MapPin,
  X
} from 'lucide-react';
import { PapuanBorderCorner } from '@/components/PapuanMotif';
import { CARD_SURFACE } from '@/components/ui/Bento';

interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  conditionText: string;
  isDay: boolean;
  advisoryText: string;
  updatedAt: string;
}

interface DailyForecast {
  date: string;
  dayName: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  conditionText: string;
}

/** Kode cuaca WMO → teks, ikon & saran operasional (fungsi murni). */
const getWeatherInfo = (code: number, isDay = true) => {
  switch (code) {
    case 0:
      return {
        text: isDay ? 'Cerah Benderang' : 'Malam Cerah',
        icon: Sun,
        color: 'text-amber-400',
        advisory: 'Kondisi sangat cerah, ideal untuk pertunjukan seni terbuka dan pemotretan budaya.',
      };
    case 1:
    case 2:
    case 3:
      return {
        text: 'Cerah Berawan Tropis',
        icon: CloudSun,
        color: 'text-amber-300',
        advisory: 'Cuaca sejuk bersahabat, nyaman untuk jalan-jalan keliling kompleks homestay & cafe.',
      };
    case 45:
    case 48:
      return {
        text: 'Berkabut Tebal',
        icon: Cloud,
        color: 'text-slate-300',
        advisory: 'Jarak pandang terbatas pagi hari di Aimas Km. 21, tetap berhati-hati dalam berkendara.',
      };
    case 51:
    case 53:
    case 55:
    case 61:
    case 63:
    case 65:
      return {
        text: 'Hujan Ringan',
        icon: CloudRain,
        color: 'text-cyan-300',
        advisory: 'Gerimis berkala di Sorong, siapkan payung dan aktifkan area santai indoor cafe.',
      };
    case 80:
    case 81:
    case 82:
      return {
        text: 'Hujan Tropis Lokal',
        icon: CloudRain,
        color: 'text-blue-300',
        advisory: 'Potensi hujan lokal sore hari, pastikan perlengkapan homestay terlindung rapi.',
      };
    case 95:
    case 96:
    case 99:
      return {
        text: 'Hujan Petir Guntur',
        icon: CloudLightning,
        color: 'text-yellow-400',
        advisory: 'Hujan lebat disertai kilat, utamakan aktivitas di dalam pendopo utama yayasan.',
      };
    default:
      return {
        text: 'Berawan Tropis',
        icon: CloudSun,
        color: 'text-amber-300',
        advisory: 'Kondisi cuaca stabil untuk seluruh kegiatan operasional yayasan.',
      };
  }
};

/** Ambil cuaca terkini & prakiraan 3 hari untuk Sorong/Aimas (Open-Meteo). null bila gagal. */
async function fetchSorongWeather(): Promise<{ current: CurrentWeather; forecast: DailyForecast[] } | null> {
  try {
    // Open-Meteo API for Sorong / Aimas (Lat: -0.8653, Lon: 131.2514)
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=-0.8653&longitude=131.2514&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FJayapura'
    );

    if (res.ok) {
      const data = await res.json();
      const cur = data.current;
      const info = getWeatherInfo(cur.weather_code, cur.is_day === 1);

      const now = new Date();
      const timeStr = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jayapura',
        hour: '2-digit',
        minute: '2-digit',
      }).format(now);

      const current: CurrentWeather = {
        temperature: Math.round(cur.temperature_2m),
        feelsLike: Math.round(cur.apparent_temperature),
        humidity: Math.round(cur.relative_humidity_2m),
        windSpeed: Math.round(cur.wind_speed_10m),
        weatherCode: cur.weather_code,
        conditionText: info.text,
        isDay: cur.is_day === 1,
        advisoryText: info.advisory,
        updatedAt: `${timeStr} WIT`,
      };

      const newForecast: DailyForecast[] = [];
      if (data.daily && data.daily.time) {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        for (let i = 0; i < Math.min(3, data.daily.time.length); i++) {
          const dateObj = new Date(data.daily.time[i]);
          const dayName = days[dateObj.getDay()];
          const fInfo = getWeatherInfo(data.daily.weather_code[i], true);
          newForecast.push({
            date: i === 0 ? 'Hari Ini' : i === 1 ? 'Besok' : 'Lusa',
            dayName,
            weatherCode: data.daily.weather_code[i],
            tempMax: Math.round(data.daily.temperature_2m_max[i]),
            tempMin: Math.round(data.daily.temperature_2m_min[i]),
            conditionText: fInfo.text,
          });
        }
      }
      return { current, forecast: newForecast };
    }
  } catch (e) {
    console.log('Using offline weather fallback for Sorong:', e);
  }
  return null;
}

export default function WeatherWidget() {
  // Tidak ada angka contoh: sebelum data asli tiba, widget menampilkan status memuat/gagal.
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<DailyForecast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const loadWeather = useCallback(() => {
    return fetchSorongWeather().then((result) => {
      if (result) {
        setWeather(result.current);
        setForecast(result.forecast);
        setFailed(false);
      } else {
        setFailed(true);
      }
      setIsLoading(false);
    });
  }, []);

  /** Tombol muat ulang manual. */
  const fetchLiveWeather = () => {
    setIsLoading(true);
    void loadWeather();
  };

  useEffect(() => {
    void loadWeather();
    const interval = setInterval(loadWeather, 300000); // 5 menit
    return () => clearInterval(interval);
  }, [loadWeather]);

  // Tutup rincian dengan tombol Escape.
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setModalOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalOpen]);

  const info = weather ? getWeatherInfo(weather.weatherCode, weather.isDay) : null;
  const WeatherIconComp = info?.icon ?? CloudSun;

  return (
    <>
      <div className={`${CARD_SURFACE} h-full p-4 sm:p-5 flex flex-col justify-between gap-3`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <WeatherIconComp className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase text-emerald-700 dark:text-emerald-400 tracking-wide">
                  Cuaca Sorong (WIT)
                </span>
                {weather && (
                  <span className="text-[10px] font-mono text-stone-400 dark:text-slate-400">• {weather.updatedAt}</span>
                )}
              </div>
              <p className="text-sm font-bold text-stone-900 dark:text-white truncate">
                {weather
                  ? `${weather.temperature}°C — ${weather.conditionText}`
                  : isLoading
                    ? 'Memuat data cuaca…'
                    : 'Data cuaca belum tersedia'}
              </p>
            </div>
          </div>

          {weather ? (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="px-3 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-xs font-bold cursor-pointer shrink-0"
            >
              Rincian
            </button>
          ) : (
            <button
              type="button"
              onClick={fetchLiveWeather}
              disabled={isLoading}
              aria-label="Muat ulang cuaca"
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-stone-100 dark:bg-white/5 text-stone-500 dark:text-slate-400 border border-stone-200 dark:border-white/10 cursor-pointer disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
        {failed && !isLoading && (
          <p className="mt-2 text-[11px] text-stone-500 dark:text-slate-400">
            Gagal menghubungi layanan cuaca. Periksa koneksi, lalu coba muat ulang.
          </p>
        )}
      </div>

      {modalOpen && weather && info && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Rincian cuaca Sorong">
          <button
            type="button"
            aria-label="Tutup rincian cuaca"
            onClick={() => setModalOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-default"
          />
          <div className="relative w-full max-w-md max-h-[85dvh] overflow-y-auto rounded-3xl bg-white dark:bg-[#091f17] border border-stone-200 dark:border-emerald-500/40 shadow-2xl p-6 text-stone-900 dark:text-slate-100">
            <PapuanBorderCorner position="top-right" />
            <PapuanBorderCorner position="bottom-left" />

            <div className="flex items-start justify-between gap-2 pb-3 border-b border-stone-200 dark:border-emerald-500/20 mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <WeatherIconComp className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-base font-bold font-serif">Cuaca Sorong &amp; Aimas</h2>
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-300 flex items-center gap-1 font-mono">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">Km. 21, Papua Barat Daya • {weather.updatedAt}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={fetchLiveWeather}
                  aria-label="Perbarui cuaca"
                  className="w-10 h-10 flex items-center justify-center rounded-xl text-stone-500 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-white/10 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-500' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  aria-label="Tutup"
                  className="w-10 h-10 flex items-center justify-center rounded-xl text-stone-500 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-gradient-to-r dark:from-[#0d2a1f] dark:to-[#06140e] border border-stone-200 dark:border-emerald-500/30 text-center mb-4">
              <p className="text-4xl font-serif font-black tracking-tight">{weather.temperature}°C</p>
              <p className="text-sm font-bold text-amber-700 dark:text-amber-300 mt-0.5">{weather.conditionText}</p>
              <p className="text-[11px] text-stone-500 dark:text-emerald-200/80 mt-0.5">Suhu terasa: {weather.feelsLike}°C</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-[#081a13] border border-stone-200 dark:border-emerald-500/20 flex items-center gap-2.5">
                <Droplets className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-stone-500 dark:text-slate-400 font-bold uppercase">Kelembapan</p>
                  <p className="text-xs font-bold">{weather.humidity}% RH</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-[#081a13] border border-stone-200 dark:border-emerald-500/20 flex items-center gap-2.5">
                <Wind className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-stone-500 dark:text-slate-400 font-bold uppercase">Angin</p>
                  <p className="text-xs font-bold">{weather.windSpeed} km/jam</p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 mb-4">
              <div className="flex items-start gap-2 text-xs">
                <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-800 dark:text-amber-300 block mb-0.5">Saran operasional REP:</strong>
                  <span className="text-stone-700 dark:text-slate-300 text-[11px] leading-relaxed">{weather.advisoryText}</span>
                </div>
              </div>
            </div>

            {forecast.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                  Prakiraan {forecast.length} hari ke depan
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {forecast.map((f) => {
                    const FIcon = getWeatherInfo(f.weatherCode).icon;
                    return (
                      <div
                        key={f.date}
                        className="p-2.5 rounded-xl bg-stone-50 dark:bg-[#081a13] border border-stone-200 dark:border-emerald-500/20 text-center"
                      >
                        <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">{f.date}</p>
                        <FIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 mx-auto my-1" />
                        <p className="text-xs font-bold">
                          {f.tempMax}° / {f.tempMin}°
                        </p>
                        <p className="text-[9px] text-stone-500 dark:text-slate-400 truncate mt-0.5">{f.conditionText}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
