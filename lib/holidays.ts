'use client';

import { useEffect, useState } from 'react';
import type { Holiday } from './holidays-ics';

export type { Holiday, HolidayType } from './holidays-ics';

export interface HolidaysState {
  holidays: Holiday[];
  status: 'loading' | 'ready' | 'error';
}

/** Cache per tahun selama halaman terbuka — berpindah bulan tidak memuat ulang data. */
const cache = new Map<number, Promise<HolidaysState>>();

function loadYear(year: number): Promise<HolidaysState> {
  let pending = cache.get(year);
  if (!pending) {
    pending = fetch(`/api/libur?year=${year}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = (await res.json()) as { holidays: Holiday[] };
        return { holidays: body.holidays, status: 'ready' as const };
      })
      .catch(() => {
        cache.delete(year); // boleh dicoba lagi pada kunjungan berikutnya
        return { holidays: [], status: 'error' as const };
      });
    cache.set(year, pending);
  }
  return pending;
}

/** Hari libur nasional & cuti bersama untuk satu atau beberapa tahun. */
export function useHolidays(years: number[]): HolidaysState {
  const key = [...new Set(years)].sort().join(',');
  const [state, setState] = useState<{ key: string; value: HolidaysState }>({
    key: '',
    value: { holidays: [], status: 'loading' },
  });

  useEffect(() => {
    let alive = true;
    Promise.all(key.split(',').filter(Boolean).map((y) => loadYear(Number(y)))).then((parts) => {
      if (!alive) return;
      setState({
        key,
        value: {
          holidays: parts.flatMap((p) => p.holidays),
          status: parts.some((p) => p.status === 'error') ? 'error' : 'ready',
        },
      });
    });
    return () => {
      alive = false;
    };
  }, [key]);

  // Selama tahun yang diminta berubah dan belum termuat, laporkan "memuat" — bukan data tahun lama.
  return state.key === key ? state.value : { holidays: [], status: 'loading' };
}

/** "dalam 3 hari", "besok", "hari ini". */
export function daysUntilLabel(fromDate: string, toDate: string): string {
  const diff = Math.round(
    (new Date(`${toDate}T00:00:00Z`).getTime() - new Date(`${fromDate}T00:00:00Z`).getTime()) / 86_400_000
  );
  if (diff <= 0) return 'hari ini';
  if (diff === 1) return 'besok';
  return `${diff} hari lagi`;
}
