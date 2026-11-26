'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudRainWind,
  CloudSnow,
  CloudSun,
  Droplets,
  MapPin,
  Moon,
  RefreshCw,
  Sun,
  Thermometer,
  Umbrella,
  Wind,
} from 'lucide-react';
import { describeWeather, fetchForecast, type Forecast, type WeatherKind } from '@/lib/weather';
import { CARD_SURFACE } from '@/components/ui/Bento';

type IconType = React.ComponentType<{ className?: string }>;

function WeatherIcon({ kind, isDay = true, className }: { kind: WeatherKind; isDay?: boolean; className?: string }) {
  switch (kind) {
    case 'clear':
      return isDay ? <Sun className={className} /> : <Moon className={className} />;
    case 'partly':
      return isDay ? <CloudSun className={className} /> : <CloudMoon className={className} />;
    case 'fog':
      return <CloudFog className={className} />;
    case 'drizzle':
      return <CloudDrizzle className={className} />;
    case 'rain':
      return <CloudRain className={className} />;
    case 'heavy-rain':
      return <CloudRainWind className={className} />;
    case 'storm':
      return <CloudLightning className={className} />;
    case 'snow':
      return <CloudSnow className={className} />;
    default:
      return <Cloud className={className} />;
  }
}

const dayName = (date: string, index: number) =>
  index === 0
    ? 'Hari ini'
    : index === 1
      ? 'Besok'
      : new Date(`${date}T12:00:00`).toLocaleDateString('id-ID', { weekday: 'short' });

const REFRESH_MS = 30 * 60_000;

/** Ramalan cuaca Sorong: kondisi sekarang + 7 hari ke depan. */
export default function WeatherForecast() {
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const load = useCallback(() => {
    return fetchForecast().then((result) => {
      if (result) {
        setForecast(result);
        setStatus('ready');
      } else {
        // Data lama (kalau ada) tetap ditampilkan; hanya tanpa data sama sekali yang dianggap gagal.
        setStatus((prev) => (prev === 'ready' ? 'ready' : 'error'));
      }
    });
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const retry = () => {
    setStatus('loading');
    void load();
  };

  return (
    <section aria-labelledby="judul-cuaca" className={`${CARD_SURFACE} h-full p-4 sm:p-6 flex flex-col gap-5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Ramalan cuaca
          </p>
          <h2 id="judul-cuaca" className="mt-0.5 flex items-center gap-1 text-base font-bold">
            <MapPin className="w-4 h-4 shrink-0 text-stone-400" />
            Sorong · Aimas
          </h2>
        </div>
        {forecast && (
          <span className="text-[11px] text-stone-500 dark:text-slate-400 shrink-0">
            Diperbarui {forecast.current.observedAt} WIT
          </span>
        )}
      </div>

      {status === 'loading' && !forecast && (
        <div className="space-y-4 animate-pulse" role="status" aria-label="Memuat ramalan cuaca">
          <div className="h-16 w-48 rounded-2xl bg-stone-100 dark:bg-white/5" />
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-stone-100 dark:bg-white/5" />
            ))}
          </div>
        </div>
      )}

      {status === 'error' && !forecast && (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-stone-600 dark:text-slate-300">
            Ramalan cuaca belum dapat dimuat. Periksa koneksi internet, lalu coba lagi.
          </p>
          <button
            type="button"
            onClick={retry}
            className="h-10 px-4 flex items-center gap-2 rounded-xl bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-sm font-semibold cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Coba lagi
          </button>
        </div>
      )}

      {forecast && <ForecastBody forecast={forecast} />}

      <p className="mt-auto text-[10px] text-stone-400 dark:text-slate-500">Sumber data: Open-Meteo</p>
    </section>
  );
}

function ForecastBody({ forecast }: { forecast: Forecast }) {
  const { current, daily } = forecast;
  const now = describeWeather(current.code);
  const today = daily[0];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <div className="flex items-center gap-4">
          <span className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-100 to-sky-100 dark:from-amber-500/15 dark:to-sky-500/15 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
            <WeatherIcon kind={now.kind} isDay={current.isDay} className="w-9 h-9" />
          </span>
          <div>
            <p className="text-5xl font-black tracking-tight tabular-nums leading-none">
              {current.temperature}°
            </p>
            <p className="mt-1.5 text-sm font-semibold">{now.label}</p>
          </div>
        </div>

        <dl className="grid grid-cols-3 gap-2 text-center flex-1 min-w-[15rem] max-w-sm">
          <Metric icon={Thermometer} label="Terasa" value={`${current.feelsLike}°`} />
          <Metric icon={Droplets} label="Lembap" value={`${current.humidity}%`} />
          <Metric icon={Wind} label="Angin" value={`${current.windSpeed} km/j`} />
        </dl>
      </div>

      {today?.rainChance != null && today.rainChance >= 60 && (
        <p className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 text-xs text-sky-800 dark:text-sky-200">
          <Umbrella className="w-4 h-4 shrink-0" />
          Peluang hujan hari ini {today.rainChance}% — siapkan payung dan rencana ruangan untuk kegiatan luar.
        </p>
      )}

      <ol className="grid grid-cols-7 gap-1.5 sm:gap-2" aria-label="Ramalan 7 hari">
        {daily.map((d, i) => {
          const info = describeWeather(d.code);
          return (
            <li
              key={d.date}
              title={`${info.label}, ${d.min}°–${d.max}°`}
              className={`flex flex-col items-center gap-1 py-2.5 px-0.5 rounded-2xl text-center ${
                i === 0
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 ring-1 ring-emerald-200 dark:ring-emerald-500/30'
                  : 'bg-stone-50 dark:bg-white/5'
              }`}
            >
              <span className="text-[10px] sm:text-[11px] font-bold text-stone-500 dark:text-slate-400 truncate max-w-full">
                {dayName(d.date, i)}
              </span>
              <WeatherIcon kind={info.kind} className="w-5 h-5 text-stone-600 dark:text-slate-300" />
              <span className="text-xs sm:text-sm font-bold tabular-nums">{d.max}°</span>
              <span className="text-[10px] sm:text-[11px] text-stone-400 dark:text-slate-500 tabular-nums">{d.min}°</span>
              {d.rainChance != null && (
                <span className="flex items-center gap-0.5 text-[9px] sm:text-[10px] font-semibold text-sky-600 dark:text-sky-400 tabular-nums">
                  <Droplets className="w-2.5 h-2.5" />
                  {d.rainChance}%
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </>
  );
}

function Metric({ icon: Icon, label, value }: { icon: IconType; label: string; value: string }) {
  return (
    <div className="py-2 px-1 rounded-2xl bg-stone-50 dark:bg-white/5">
      <dt className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase text-stone-500 dark:text-slate-400">
        <Icon className="w-3 h-3" />
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-bold tabular-nums">{value}</dd>
    </div>
  );
}
