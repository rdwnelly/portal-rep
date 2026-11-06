'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bell, CalendarDays, ChevronRight, MapPin } from 'lucide-react';
import { getAppsList, getEvents, getNotices, SSR_APPS, SSR_EVENTS, SSR_NOTICES } from '@/lib/storage';
import { useStoreValue } from '@/lib/use-store';
import { todayWit, useWitClock } from '@/lib/use-wit-clock';
import { useAuth, isManagerRole } from '@/lib/auth-context';
import type { CalendarEvent, NoticeItem } from '@/lib/types';
import Navbar from '@/components/Navbar';
import AppList from '@/components/AppList';
import NoticeDetailModal from '@/components/NoticeDetailModal';
import EventDetailModal from '@/components/EventDetailModal';
import RequestAccessModal from '@/components/RequestAccessModal';
import ExecutiveOverviewWidget from '@/components/ExecutiveOverviewWidget';

/** Beranda: sapaan, pengumuman terbaru, aplikasi kerja, dan agenda terdekat. */
export default function HomePage() {
  const { user } = useAuth();
  const { greeting, dateLabel } = useWitClock();
  const apps = useStoreValue('apps', getAppsList, SSR_APPS);
  const notices = useStoreValue('notices', getNotices, SSR_NOTICES);
  const events = useStoreValue('events', getEvents, SSR_EVENTS);

  const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);

  const latestNotice = notices.find((n) => n.isPinned) ?? notices[0];
  // Agenda terdekat dihitung setelah jam klien tersedia (hindari beda server/klien).
  const today = dateLabel ? todayWit() : '';
  const upcoming = today
    ? events
        .filter((e) => e.date >= today && e.status !== 'CANCELLED')
        .sort((a, b) => `${a.date}${a.timeStart}`.localeCompare(`${b.date}${b.timeStart}`))[0]
    : undefined;
  const firstName = user?.displayName.split(' ')[0];

  return (
    <div className="dock-safe min-h-screen bg-[#f6f4ee] dark:bg-[#07130f] text-stone-900 dark:text-slate-100">
      <Navbar />

      <section className="bg-gradient-to-b from-[#123a2b] to-[#0d2a1f] text-white px-4 pt-6 pb-14">
        <div className="max-w-xl mx-auto">
          <p className="text-xs font-semibold tracking-wide text-emerald-200/90">PORTAL REP · Yayasan Rumah Etnik Papua</p>
          <h1 className="mt-3 text-[26px] leading-tight font-bold">
            {greeting || 'Selamat datang'}
            {firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="mt-1 text-sm text-emerald-100/80 min-h-5">{dateLabel}</p>
        </div>
      </section>

      <main className="max-w-xl mx-auto px-4 -mt-9 space-y-7">
        {latestNotice && (
          <button
            type="button"
            onClick={() => setSelectedNotice(latestNotice)}
            className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-[#0c241b] border border-stone-200 dark:border-white/10 shadow-lg text-left cursor-pointer"
          >
            <span className="w-11 h-11 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-xs font-semibold text-amber-700 dark:text-amber-400">Pengumuman terbaru</span>
              <span className="mt-0.5 text-[15px] font-semibold leading-snug line-clamp-2">{latestNotice.title}</span>
            </span>
            <ChevronRight className="w-5 h-5 text-stone-400 shrink-0" />
          </button>
        )}

        {isManagerRole(user?.role) && <ExecutiveOverviewWidget />}

        <section aria-labelledby="judul-aplikasi">
          <div className="flex items-baseline justify-between mb-3">
            <h2 id="judul-aplikasi" className="text-lg font-bold">
              Aplikasi kerja
            </h2>
            <span className="text-xs text-stone-500 dark:text-slate-400">Ketuk untuk membuka</span>
          </div>
          <AppList apps={apps} />
          <button
            type="button"
            onClick={() => setRequestOpen(true)}
            className="mt-3 w-full h-11 text-sm font-semibold text-amber-700 dark:text-amber-400 cursor-pointer"
          >
            Belum punya akun aplikasi? Ajukan akses
          </button>
        </section>

        {upcoming && (
          <section aria-labelledby="judul-agenda">
            <div className="flex items-baseline justify-between mb-3">
              <h2 id="judul-agenda" className="text-lg font-bold">
                Agenda terdekat
              </h2>
              <Link href="/agenda" className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                Lihat semua
              </Link>
            </div>
            <button
              type="button"
              onClick={() => setSelectedEvent(upcoming)}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-[#0c241b] border border-stone-200 dark:border-white/10 text-left cursor-pointer"
            >
              <span className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <CalendarDays className="w-5 h-5" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  {new Date(`${upcoming.date}T12:00:00`).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })} ·{' '}
                  {upcoming.timeStart} WIT
                </span>
                <span className="mt-0.5 text-[15px] font-semibold leading-snug line-clamp-2">{upcoming.title}</span>
                <span className="mt-0.5 flex items-center gap-1 text-xs text-stone-500 dark:text-slate-400">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{upcoming.location}</span>
                </span>
              </span>
              <ChevronRight className="w-5 h-5 text-stone-400 shrink-0" />
            </button>
          </section>
        )}
      </main>

      {selectedNotice && <NoticeDetailModal notice={selectedNotice} onClose={() => setSelectedNotice(null)} />}
      {selectedEvent && (
        <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} canManage={isManagerRole(user?.role)} />
      )}
      <RequestAccessModal isOpen={requestOpen} availableApps={apps} onClose={() => setRequestOpen(false)} />
    </div>
  );
}
