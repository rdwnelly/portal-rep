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

export default function WeatherWidget({ isCompact = false }: { isCompact?: boolean }) {
  const [weather, setWeather] = useState<CurrentWeather>({
    temperature: 30,
    feelsLike: 33,
    humidity: 78,
    windSpeed: 11,
    weatherCode: 2,
    conditionText: 'Cerah Berawan Tropis',
    isDay: true,
    advisoryText: 'Cuaca bersahabat untuk tur budaya, pertunjukan tari, dan aktivitas homestay.',
    updatedAt: '09:00 WIT',
  });

  const [forecast, setForecast] = useState<DailyForecast[]>([
    {
      date: 'Hari ini',
      dayName: 'Minggu',
      weatherCode: 2,
      tempMax: 32,
      tempMin: 25,
      conditionText: 'Cerah Berawan',
    },
    {
      date: 'Besok',
      dayName: 'Senin',
      weatherCode: 80,
      tempMax: 31,
      tempMin: 24,
      conditionText: 'Hujan Lokal Sore',
    },
    {
      date: 'Lusa',
      dayName: 'Selasa',
      weatherCode: 1,
      tempMax: 33,
      tempMin: 25,
      conditionText: 'Cerah Hangat',
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Weather Code to Indonesian text & icon
  // Isi state hanya di callback .then → tidak ada setState sinkron di dalam effect.
  const loadWeather = useCallback(() => {
    return fetchSorongWeather().then((result) => {
      if (result) {
        setWeather(result.current);
        if (result.forecast.length) setForecast(result.forecast);
      }
      setIsLoading(false);
    });
  }, []);

  /** Tombol refresh manual: tampilkan indikator memuat lalu ambil ulang. */
  const fetchLiveWeather = () => {
    setIsLoading(true);
    void loadWeather();
  };

  useEffect(() => {
    void loadWeather();
    const interval = setInterval(loadWeather, 300000); // 5 menit
    return () => clearInterval(interval);
  }, [loadWeather]);

  const WeatherIconComp = getWeatherInfo(weather.weatherCode, weather.isDay).icon;

  // COMPACT PILL BUTTON (In the Hero Header)
  if (isCompact) {
    return (
      <>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0a2319]/90 hover:bg-[#0e2f22] border border-emerald-500/30 hover:border-amber-400 text-emerald-200 text-xs transition-all shadow-md active:scale-95 cursor-pointer group"
          title="Prakiraan Cuaca Real-Time Sorong (Klik untuk Rincian)"
        >
          <WeatherIconComp className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
          <span className="font-bold text-white font-mono">{weather.temperature}°C</span>
          <span className="text-[11px] text-emerald-300 hidden sm:inline truncate max-w-[120px]">
            {weather.conditionText}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </button>

        {/* Detailed Weather Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 text-slate-100">
            <div
              className="relative w-full max-w-md rounded-3xl bg-[#091f17] border-2 border-emerald-500/40 shadow-2xl p-6 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <PapuanBorderCorner position="top-right" />
              <PapuanBorderCorner position="bottom-left" />

              <div className="flex items-start justify-between pb-3 border-b border-emerald-500/20 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                    <WeatherIconComp className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white font-serif">
                      Cuaca Sorong & Aimas
                    </h3>
                    <p className="text-[10px] text-emerald-300 flex items-center gap-1 font-mono">
                      <MapPin className="w-3 h-3 text-amber-400" />
                      Km. 21, Papua Barat Daya • {weather.updatedAt}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={fetchLiveWeather}
                    className={`p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-all border border-slate-700 cursor-pointer ${
                      isLoading ? 'animate-spin text-amber-400' : ''
                    }`}
                    title="Perbarui Cuaca"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-all border border-slate-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Main Temp & Condition */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0d2a1f] to-[#06140e] border border-emerald-500/30 text-center mb-4 shadow-inner">
                <p className="text-4xl font-serif font-black text-white tracking-tight">
                  {weather.temperature}°C
                </p>
                <p className="text-sm font-bold text-amber-300 mt-0.5">
                  {weather.conditionText}
                </p>
                <p className="text-[11px] text-emerald-200/80 mt-0.5">
                  Suhu Terasa: {weather.feelsLike}°C
                </p>
              </div>

              {/* Weather Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-2xl bg-[#081a13] border border-emerald-500/20 flex items-center gap-2.5">
                  <Droplets className="w-5 h-5 text-cyan-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Kelembapan</p>
                    <p className="text-xs font-black text-white">{weather.humidity}% RH</p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#081a13] border border-emerald-500/20 flex items-center gap-2.5">
                  <Wind className="w-5 h-5 text-teal-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Kecepatan Angin</p>
                    <p className="text-xs font-black text-white">{weather.windSpeed} km/jam</p>
                  </div>
                </div>
              </div>

              {/* Cultural & Operational Advisory */}
              <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 mb-4">
                <div className="flex items-start gap-2 text-xs">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-300 block mb-0.5">Rekomendasi Operasional REP:</strong>
                    <span className="text-slate-300 text-[11px] leading-relaxed">
                      {weather.advisoryText}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3 Days Forecast */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Prakiraan 3 Hari ke Depan (Sorong)
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {forecast.map((f, i) => {
                    const FIcon = getWeatherInfo(f.weatherCode).icon;
                    return (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl bg-[#081a13] border border-emerald-500/20 text-center"
                      >
                        <p className="text-[10px] font-bold text-emerald-300">{f.date}</p>
                        <FIcon className="w-4 h-4 text-amber-400 mx-auto my-1" />
                        <p className="text-xs font-black text-white">{f.tempMax}° / {f.tempMin}°</p>
                        <p className="text-[9px] text-slate-400 truncate mt-0.5">{f.conditionText}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // FULL CARD VIEW
  return (
    <div className="rounded-2xl bg-white dark:bg-[#0c241b] border border-stone-200/90 dark:border-emerald-500/30 p-4 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <WeatherIconComp className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold uppercase text-emerald-700 dark:text-emerald-400 tracking-wide">
                CUACA SORONG (WIT)
              </span>
              <span className="text-[10px] font-mono text-stone-400 dark:text-slate-400">
                • {weather.updatedAt}
              </span>
            </div>
            <p className="text-sm font-black text-stone-900 dark:text-white">
              {weather.temperature}°C — {weather.conditionText}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-xs font-bold hover:bg-emerald-100 transition-all cursor-pointer shrink-0"
        >
          Rincian
        </button>
      </div>
    </div>
  );
}
