'use client';

import { useSyncExternalStore } from 'react';

const TZ = 'Asia/Jayapura';

// Snapshot = menit saat ini (angka) → stabil selama satu menit, aman untuk useSyncExternalStore.
const getMinute = () => Math.floor(Date.now() / 60_000);
function subscribe(callback: () => void) {
  const timer = setInterval(callback, 15_000);
  return () => clearInterval(timer);
}

export interface WitClock {
  /** "Selamat pagi" / "Selamat siang" / … ; kosong saat render server. */
  greeting: string;
  /** "Sabtu, 7 November 2026"; kosong saat render server. */
  dateLabel: string;
}

/** Sapaan & tanggal zona WIT (Sorong) yang diperbarui otomatis tanpa hydration mismatch. */
export function useWitClock(): WitClock {
  const minute = useSyncExternalStore(subscribe, getMinute, () => 0);
  if (!minute) return { greeting: '', dateLabel: '' };

  const now = new Date(minute * 60_000);
  const hour = Number(new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', hour12: false }).format(now)) % 24;
  const greeting =
    hour >= 4 && hour < 11 ? 'Selamat pagi' : hour < 15 && hour >= 11 ? 'Selamat siang' : hour >= 15 && hour < 18 ? 'Selamat sore' : 'Selamat malam';
  const dateLabel = new Intl.DateTimeFormat('id-ID', {
    timeZone: TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now);
  return { greeting, dateLabel };
}

/** Tanggal hari ini (YYYY-MM-DD) di zona WIT. */
export function todayWit(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}
