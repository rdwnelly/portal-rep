'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, Flag, LayoutGrid, MapPin } from 'lucide-react';
import { getAppsList, getEvents, SSR_APPS, SSR_EVENTS } from '@/lib/storage';
import { useStoreValue } from '@/lib/use-store';
import { todayWit, useWitClock } from '@/lib/use-wit-clock';
import { daysUntilLabel, useHolidays } from '@/lib/holidays';
import type { CalendarEvent } from '@/lib/types';
import Navbar from '@/components/Navbar';
import EventDetailModal from '@/components/EventDetailModal';
import WeatherForecast from '@/components/WeatherForecast';
import { PapuanBorderCorner } from '@/components/PapuanMotif';
import { Bento, BentoCard, CardTitle } from '@/components/ui/Bento';

const shortDate = (date: string) => {
  const d = new Date(`${date}T12:00:00`);
  return {
    day: d.toLocaleDateString('id-ID', { day: 'numeric' }),
    month: d.toLocaleDateString('id-ID', { month: 'short' }),
    weekday: d.toLocaleDateString('id-ID', { weekday: 'long' }),
  };
};

/** Beranda: sapaan & jam WIT, cuaca, agenda mendatang, dan libur nasional berikutnya. */
export default function HomePage() {
  const { greeting, dateLabel, timeLabel } = useWitClock();
  const apps = useStoreValue('apps', getAppsList, SSR_APPS);
  const events = useStoreValue('events', getEvents, SSR_EVENTS);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Dihitung setelah jam klien tersedia (hindari beda server/klien).
  const today = dateLabel ? todayWit() : '';
  const year = today ? Number(today.slice(0, 4)) : 0;
  // Tahun ini + tahun depan, agar di akhir Desember libur berikutnya tetap terlihat.
  const { holidays, status: holidayStatus } = useHolidays(year ? [year, year + 1] : []);

  const upcomingEvents = today
    ? events
        .filter((e) => e.date >= today && e.status !== 'CANCELLED')
        .sort((a, b) => `${a.date}${a.timeStart}`.localeCompare(`${b.date}${b.timeStart}`))
        .slice(0, 3)
    : [];
  const nextHolidays = today ? holidays.filter((h) => h.date >= today).slice(0, 3) : [];
  const activeApps = apps.filter((a) => a.status !== 'OFFLINE').length;

  return (
    <div className="dock-safe min-h-screen bg-[#f6f4ee] dark:bg-[#07130f] text-stone-900 dark:text-slate-100">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#123a2b] via-[#0f3324] to-[#0a2219] text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(#e5a93c_1px,transparent_1px)] [background-size:18px_18px]"
        />
        <div aria-hidden className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl" />
        <PapuanBorderCorner position="top-right" />

        <div className="relative max-w-xl md:max-w-5xl mx-auto px-4 pt-8 pb-20 md:pb-24">
          <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-emerald-200/80">
            Yayasan Rumah Etnik Papua · Sorong
          </p>

          <div className="mt-4 flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{greeting || 'Selamat datang'}</h1>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-emerald-50/75">
                Portal kerja yayasan — aplikasi, agenda, dan informasi harian di satu tempat.
              </p>
            </div>

            <div className="md:text-right min-h-[3.75rem]" aria-live="off">
              {timeLabel && (
                <>
                  <p className="text-4xl md:text-5xl font-light tabular-nums tracking-tight leading-none">
                    {timeLabel}
                    <span className="ml-1.5 text-base font-semibold text-amber-300">WIT</span>
                  </p>
                  <p className="mt-1.5 text-sm text-emerald-50/75">{dateLabel}</p>
                </>
              )}
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-2.5">
            <Link
              href="/apps"
              className="h-11 px-5 inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-sm font-bold transition-colors"
            >
              <LayoutGrid className="w-4 h-4" />
              Buka aplikasi kerja
            </Link>
            <Link
              href="/agenda"
              className="h-11 px-5 inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-sm font-semibold transition-colors"
            >
              <CalendarDays className="w-4 h-4" />
              Lihat agenda
            </Link>
          </div>
        </div>
      </section>

      <main className="max-w-xl md:max-w-5xl mx-auto px-4 -mt-12 md:-mt-14 relative">
        <Bento>
          <BentoCard span="twoThirds" surface={false}>
            <WeatherForecast />
          </BentoCard>

          {/* Libur nasional berikutnya */}
          <BentoCard as="section" span="thirdWide" aria-labelledby="judul-libur" className="flex flex-col gap-4">
            <CardTitle
              id="judul-libur"
              icon={Flag}
              iconTone="bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
              eyebrow="Libur nasional"
              title="Libur berikutnya"
            />

            {holidayStatus === 'loading' && (
              <div className="space-y-2 animate-pulse" role="status" aria-label="Memuat libur nasional">
                <div className="h-14 rounded-2xl bg-stone-100 dark:bg-white/5" />
                <div className="h-10 rounded-2xl bg-stone-100 dark:bg-white/5" />
              </div>
            )}

            {holidayStatus === 'error' && (
              <p className="text-sm text-stone-600 dark:text-slate-300">Data libur nasional belum dapat dimuat.</p>
            )}

            {holidayStatus === 'ready' && nextHolidays.length === 0 && (
              <p className="text-sm text-stone-600 dark:text-slate-300">Belum ada data libur untuk sisa tahun ini.</p>
            )}

            {nextHolidays.length > 0 && (
              <ul className="space-y-2">
                {nextHolidays.map((h, i) => {
                  const d = shortDate(h.date);
                  return (
                    <li
                      key={`${h.date}-${h.name}`}
                      className={`flex items-center gap-3 p-2.5 rounded-2xl ${
                        i === 0 ? 'bg-rose-50 dark:bg-rose-500/10' : 'bg-stone-50 dark:bg-white/5'
                      }`}
                    >
                      <span className="w-11 shrink-0 text-center">
                        <span className="block text-lg font-black leading-none text-rose-600 dark:text-rose-400">
                          {d.day}
                        </span>
                        <span className="block text-[10px] font-bold uppercase text-stone-500 dark:text-slate-400">
                          {d.month}
                        </span>
                      </span>
                      <span className="min-w-0">
                        <span className="text-sm font-semibold leading-snug line-clamp-2">{h.name}</span>
                        <span className="block text-[11px] text-stone-500 dark:text-slate-400">
                          {h.type === 'CUTI_BERSAMA' ? 'Cuti bersama · ' : ''}
                          {daysUntilLabel(today, h.date)}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}

            <Link
              href="/agenda"
              className="mt-auto inline-flex items-center gap-1 text-xs font-bold text-rose-700 dark:text-rose-400 hover:underline"
            >
              Lihat di kalender <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </BentoCard>

          {/* Agenda mendatang */}
          <BentoCard as="section" span="half" aria-labelledby="judul-agenda" className="flex flex-col gap-4">
            <CardTitle
              id="judul-agenda"
              icon={CalendarDays}
              eyebrow="Agenda"
              title={
                !today ? 'Memuat agenda…' : upcomingEvents.length ? 'Agenda mendatang' : 'Belum ada agenda mendatang'
              }
              action={
                <Link
                  href="/agenda"
                  className="h-9 px-3 flex items-center gap-1 rounded-xl bg-stone-100 dark:bg-white/5 text-xs font-bold text-stone-600 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-400"
                >
                  Semua <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              }
            />
            {upcomingEvents.length > 0 ? (
              <ul className="space-y-2">
                {upcomingEvents.map((e) => {
                  const d = shortDate(e.date);
                  return (
                    <li key={e.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedEvent(e)}
                        className="w-full flex items-center gap-3 p-2.5 rounded-2xl bg-stone-50 dark:bg-white/5 hover:bg-stone-100 dark:hover:bg-white/10 text-left cursor-pointer transition-colors"
                      >
                        <span className="w-11 shrink-0 text-center">
                          <span className="block text-lg font-black leading-none text-emerald-700 dark:text-emerald-400">
                            {d.day}
                          </span>
                          <span className="block text-[10px] font-bold uppercase text-stone-500 dark:text-slate-400">
                            {d.month}
                          </span>
                        </span>
                        <span className="min-w-0">
                          <span className="text-sm font-semibold leading-snug line-clamp-1">{e.title}</span>
                          <span className="flex items-center gap-1 text-[11px] text-stone-500 dark:text-slate-400">
                            {e.timeStart} WIT ·
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{e.location}</span>
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              today && (
                <p className="text-sm text-stone-600 dark:text-slate-300">
                  Siapa saja bisa menambahkan agenda dari halaman Agenda.
                </p>
              )
            )}
          </BentoCard>

          {/* Pintasan ke halaman aplikasi — tanpa menampilkan daftarnya di sini */}
          <BentoCard as="section" span="half" tone="forest" aria-labelledby="judul-aplikasi" className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 rounded-2xl bg-white/10 text-amber-300 flex items-center justify-center shrink-0">
                <LayoutGrid className="w-5 h-5" />
              </span>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300">Aplikasi kerja</p>
                <h2 id="judul-aplikasi" className="text-base font-bold">
                  Reservasi, keuangan, kasir, gudang & media
                </h2>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-emerald-50/75" suppressHydrationWarning>
              {activeApps} aplikasi kerja yayasan siap dibuka. Setiap aplikasi terbuka di tab baru dengan login
              masing-masing.
            </p>
            <Link
              href="/apps"
              className="mt-auto h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-sm font-bold transition-colors"
            >
              Buka halaman aplikasi <ArrowRight className="w-4 h-4" />
            </Link>
          </BentoCard>
        </Bento>
      </main>

      {selectedEvent && <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
    </div>
  );
}
