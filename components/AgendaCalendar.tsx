'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CalendarEvent } from '@/lib/types';
import type { Holiday } from '@/lib/holidays';

export interface MonthRef {
  year: number;
  /** 0 = Januari */
  month: number;
}

const WEEKDAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const pad = (n: number) => String(n).padStart(2, '0');
export const toIso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

export function shiftMonth({ year, month }: MonthRef, delta: number): MonthRef {
  const total = year * 12 + month + delta;
  return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 };
}

export const monthTitle = ({ year, month }: MonthRef) =>
  new Date(year, month, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

interface Props {
  visible: MonthRef;
  onVisibleChange: (m: MonthRef) => void;
  /** YYYY-MM-DD */
  today: string;
  selected: string;
  onSelect: (date: string) => void;
  events: CalendarEvent[];
  holidays: Holiday[];
  holidaysLoading?: boolean;
}

/** Kalender bulanan: libur nasional (merah), cuti bersama (jingga), dan titik untuk agenda. */
export default function AgendaCalendar({
  visible,
  onVisibleChange,
  today,
  selected,
  onSelect,
  events,
  holidays,
  holidaysLoading,
}: Props) {
  const { year, month } = visible;
  const firstWeekday = new Date(year, month, 1).getDay(); // 0 = Minggu
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7) cells.push(null);

  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    if (e.status === 'CANCELLED') continue;
    eventsByDate.set(e.date, [...(eventsByDate.get(e.date) ?? []), e]);
  }
  const holidaysByDate = new Map<string, Holiday[]>();
  for (const h of holidays) holidaysByDate.set(h.date, [...(holidaysByDate.get(h.date) ?? []), h]);

  const isCurrentMonth = today.startsWith(`${year}-${pad(month + 1)}`);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold capitalize" aria-live="polite">
          {monthTitle(visible)}
        </h2>
        <div className="flex items-center gap-1">
          {!isCurrentMonth && (
            <button
              type="button"
              onClick={() => {
                onVisibleChange({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) - 1 });
                onSelect(today);
              }}
              className="h-9 px-3 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 cursor-pointer"
            >
              Hari ini
            </button>
          )}
          <button
            type="button"
            onClick={() => onVisibleChange(shiftMonth(visible, -1))}
            aria-label="Bulan sebelumnya"
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-stone-100 dark:hover:bg-white/10 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => onVisibleChange(shiftMonth(visible, 1))}
            aria-label="Bulan berikutnya"
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-stone-100 dark:hover:bg-white/10 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div role="grid" aria-label={`Kalender ${monthTitle(visible)}`} className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            role="columnheader"
            className={`pb-1 text-center text-[11px] font-bold uppercase ${
              i === 0 ? 'text-rose-600 dark:text-rose-400' : 'text-stone-500 dark:text-slate-400'
            }`}
          >
            {w}
          </div>
        ))}

        {cells.map((day, i) => {
          if (day === null) return <div key={`kosong-${i}`} role="gridcell" aria-hidden />;
          const date = toIso(year, month, day);
          const dayEvents = eventsByDate.get(date) ?? [];
          const dayHolidays = holidaysByDate.get(date) ?? [];
          const national = dayHolidays.some((h) => h.type === 'LIBUR_NASIONAL');
          const cuti = !national && dayHolidays.length > 0;
          const sunday = i % 7 === 0;
          const isToday = date === today;
          const isSelected = date === selected;

          const label = [
            new Date(year, month, day).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }),
            ...dayHolidays.map((h) => (h.type === 'CUTI_BERSAMA' ? `cuti bersama: ${h.name}` : `libur: ${h.name}`)),
            dayEvents.length ? `${dayEvents.length} agenda` : '',
            isToday ? 'hari ini' : '',
          ]
            .filter(Boolean)
            .join(', ');

          const numberTone = isSelected
            ? 'text-white'
            : national || sunday
              ? 'text-rose-600 dark:text-rose-400'
              : cuti
                ? 'text-orange-600 dark:text-orange-400'
                : '';

          return (
            <div key={date} role="gridcell">
              <button
                type="button"
                onClick={() => onSelect(date)}
                aria-label={label}
                aria-pressed={isSelected}
                title={dayHolidays.map((h) => h.name).join(', ') || undefined}
                className={`w-full aspect-square sm:aspect-[1.15] flex flex-col items-center justify-center gap-1 rounded-xl text-sm font-semibold tabular-nums transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 shadow-sm'
                    : national
                      ? 'bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20'
                      : cuti
                        ? 'bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-100 dark:hover:bg-orange-500/20'
                        : 'hover:bg-stone-100 dark:hover:bg-white/10'
                } ${isToday && !isSelected ? 'ring-2 ring-emerald-500 ring-inset' : ''}`}
              >
                <span className={numberTone}>{day}</span>
                <span className="flex h-1.5 items-center gap-0.5" aria-hidden>
                  {dayEvents.slice(0, 3).map((e) => (
                    <span
                      key={e.id}
                      className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-600 dark:bg-emerald-400'}`}
                    />
                  ))}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1 text-[11px] text-stone-500 dark:text-slate-400">
        <li className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-rose-100 dark:bg-rose-500/20 ring-1 ring-rose-300 dark:ring-rose-500/40" />
          Libur nasional
        </li>
        <li className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-orange-100 dark:bg-orange-500/20 ring-1 ring-orange-300 dark:ring-orange-500/40" />
          Cuti bersama
        </li>
        <li className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
          Agenda
        </li>
        {holidaysLoading && <li className="italic">Memuat libur nasional…</li>}
      </ul>
    </div>
  );
}
