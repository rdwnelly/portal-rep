'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, CalendarDays, Clock, KeyRound, LayoutGrid, LogIn, MapPin } from 'lucide-react';
import { getAppsList, getEvents, SSR_APPS, SSR_EVENTS } from '@/lib/storage';
import { useStoreValue } from '@/lib/use-store';
import { todayWit, useWitClock } from '@/lib/use-wit-clock';
import { useAuth, isManagerRole } from '@/lib/auth-context';
import type { CalendarEvent } from '@/lib/types';
import Navbar from '@/components/Navbar';
import AppList from '@/components/AppList';
import EventDetailModal from '@/components/EventDetailModal';
import RequestAccessModal from '@/components/RequestAccessModal';
import ExecutiveOverviewWidget from '@/components/ExecutiveOverviewWidget';
import WeatherWidget from '@/components/WeatherWidget';
import { Bento, BentoCard, CardTitle } from '@/components/ui/Bento';

/** Beranda: sapaan, aplikasi kerja, agenda terdekat, dan cuaca — semuanya sebagai kartu bento. */
export default function HomePage() {
  const { user, isInitialized } = useAuth();
  const { greeting, dateLabel } = useWitClock();
  const apps = useStoreValue('apps', getAppsList, SSR_APPS);
  const events = useStoreValue('events', getEvents, SSR_EVENTS);

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);

  // Agenda terdekat dihitung setelah jam klien tersedia (hindari beda server/klien).
  const today = dateLabel ? todayWit() : '';
  const upcoming = today
    ? events
        .filter((e) => e.date >= today && e.status !== 'CANCELLED')
        .sort((a, b) => `${a.date}${a.timeStart}`.localeCompare(`${b.date}${b.timeStart}`))[0]
    : undefined;
  const firstName = user?.displayName.split(' ')[0];
  const activeApps = apps.filter((a) => a.status !== 'OFFLINE').length;

  return (
    <div className="dock-safe min-h-screen bg-[#f6f4ee] dark:bg-[#07130f] text-stone-900 dark:text-slate-100">
      <Navbar />

      <section className="bg-gradient-to-b from-[#123a2b] to-[#0d2a1f] text-white px-4 pt-6 pb-16">
        <div className="max-w-xl md:max-w-5xl mx-auto">
          <p className="text-xs font-semibold tracking-wide text-emerald-200/90">
            PORTAL REP · Yayasan Rumah Etnik Papua
          </p>
          <h1 className="mt-3 text-[26px] md:text-3xl leading-tight font-bold">
            {greeting || 'Selamat datang'}
            {firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-emerald-100/80 min-h-5">
            {dateLabel && <Clock className="w-3.5 h-3.5 shrink-0" />}
            {dateLabel}
          </p>
        </div>
      </section>

      <main className="max-w-xl md:max-w-5xl mx-auto px-4 -mt-11 space-y-4 sm:space-y-5">
        <Bento>
          {isInitialized && !user && (
            <BentoCard as="section" span="full" tone="amber" aria-labelledby="judul-masuk">
              <CardTitle
                id="judul-masuk"
                icon={KeyRound}
                iconTone="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                eyebrow="Khusus staf"
                title="Masuk sebagai staf"
                action={
                  <Link
                    href="/masuk"
                    className="h-10 px-4 flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold"
                  >
                    <LogIn className="w-4 h-4" />
                    Masuk
                  </Link>
                }
              />
              <p className="mt-3 text-xs text-stone-600 dark:text-slate-300 leading-relaxed">
                Setelah masuk, aplikasi kerja yang sudah terhubung bisa dibuka tanpa mengisi kata sandi lagi.
              </p>
            </BentoCard>
          )}

          {isManagerRole(user?.role) && (
            <BentoCard span="full" surface={false}>
              <ExecutiveOverviewWidget />
            </BentoCard>
          )}

          <BentoCard as="section" span="half" aria-labelledby="judul-agenda">
            <CardTitle
              id="judul-agenda"
              icon={CalendarDays}
              eyebrow="Agenda terdekat"
              title={upcoming ? upcoming.title : today ? 'Belum ada agenda mendatang' : 'Memuat agenda…'}
              action={
                <Link
                  href="/agenda"
                  aria-label="Lihat semua agenda"
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-stone-100 dark:bg-white/5 text-stone-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              }
            />
            {upcoming && (
              <button
                type="button"
                onClick={() => setSelectedEvent(upcoming)}
                className="mt-3 w-full p-3 rounded-2xl bg-stone-50 dark:bg-white/5 border border-stone-200/80 dark:border-white/10 text-left cursor-pointer active:scale-[0.99] transition-transform"
              >
                <span className="block text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  {new Date(`${upcoming.date}T12:00:00`).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}{' '}
                  · {upcoming.timeStart} WIT
                </span>
                <span className="mt-1 flex items-center gap-1 text-xs text-stone-500 dark:text-slate-400">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{upcoming.location}</span>
                </span>
                <span className="mt-2 block text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                  Lihat rincian agenda
                </span>
              </button>
            )}
          </BentoCard>

          <BentoCard as="section" span="half" surface={false} aria-label="Cuaca Sorong">
            <WeatherWidget />
          </BentoCard>
        </Bento>

        <section aria-labelledby="judul-aplikasi" className="space-y-3 sm:space-y-4">
          <div className="flex items-end justify-between gap-3 px-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <LayoutGrid className="w-4.5 h-4.5" />
              </span>
              <h2 id="judul-aplikasi" className="text-lg font-bold">
                Aplikasi kerja
              </h2>
            </div>
            <span className="text-xs text-stone-500 dark:text-slate-400 shrink-0" suppressHydrationWarning>
              {activeApps} aplikasi aktif
            </span>
          </div>

          <AppList apps={apps} />

          <button
            type="button"
            onClick={() => setRequestOpen(true)}
            className="w-full h-12 rounded-2xl border border-dashed border-amber-500/50 text-sm font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 cursor-pointer"
          >
            Belum punya akun aplikasi? Ajukan akses
          </button>
        </section>
      </main>

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          canManage={isManagerRole(user?.role)}
        />
      )}
      <RequestAccessModal isOpen={requestOpen} availableApps={apps} onClose={() => setRequestOpen(false)} />
    </div>
  );
}
