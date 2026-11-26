'use client';

import React, { useState } from 'react';
import { CalendarDays, CalendarPlus, Clock, Flag, MapPin, Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { addEvent, areEventsLoaded, deleteEvent, getEvents, isRemoteStore, SSR_EVENTS, updateEvent } from '@/lib/storage';
import { useStoreValue } from '@/lib/use-store';
import { todayWit, useWitClock } from '@/lib/use-wit-clock';
import { useHolidays } from '@/lib/holidays';
import type { CalendarEvent } from '@/lib/types';
import Navbar from '@/components/Navbar';
import PageHeader from '@/components/PageHeader';
import EventDetailModal, { getCategoryBadge } from '@/components/EventDetailModal';
import CreateEventModal from '@/components/CreateEventModal';
import AgendaCalendar, { monthTitle, type MonthRef } from '@/components/AgendaCalendar';
import { Bento, BentoCard, CARD_SURFACE } from '@/components/ui/Bento';

type View = 'UPCOMING' | 'PAST';

const longDate = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const dayLabel = (date: string, today: string) => (date === today ? 'Hari ini' : longDate(date));

/**
 * Agenda bersama: kalender bulanan dengan libur nasional, rincian per tanggal, dan daftar agenda.
 * Siapa saja boleh menambah, mengubah, dan menghapus agenda — tanpa login.
 */
export default function AgendaPage() {
  const { user } = useAuth();
  const events = useStoreValue('events', getEvents, SSR_EVENTS);
  const eventsLoaded = useStoreValue('eventsLoaded', areEventsLoaded, !isRemoteStore);
  const { dateLabel } = useWitClock();

  // Tanggal hari ini baru dihitung setelah jam klien siap (hindari beda server/klien).
  const today = dateLabel ? todayWit() : '';
  const todayMonth: MonthRef | null = today
    ? { year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) - 1 }
    : null;

  // Bulan & tanggal pilihan pengguna; sebelum memilih, mengikuti hari ini.
  const [monthChoice, setMonthChoice] = useState<MonthRef | null>(null);
  const [dateChoice, setDateChoice] = useState<string | null>(null);
  const visibleMonth = monthChoice ?? todayMonth;
  const selectedDate = dateChoice ?? today;

  const [view, setView] = useState<View>('UPCOMING');
  const [openedEvent, setOpenedEvent] = useState<CalendarEvent | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [formDate, setFormDate] = useState<string | undefined>(undefined);

  const { holidays, status: holidayStatus } = useHolidays(visibleMonth ? [visibleMonth.year] : []);
  const monthPrefix = visibleMonth
    ? `${visibleMonth.year}-${String(visibleMonth.month + 1).padStart(2, '0')}`
    : '';
  const monthHolidays = holidays.filter((h) => h.date.startsWith(monthPrefix));
  const dayHolidays = holidays.filter((h) => h.date === selectedDate);
  const dayEvents = events
    .filter((e) => e.date === selectedDate)
    .sort((a, b) => (a.timeStart || '').localeCompare(b.timeStart || ''));

  const key = (e: CalendarEvent) => `${e.date} ${e.timeStart || '00:00'}`;
  const list = today
    ? events
        .filter((e) => (view === 'UPCOMING' ? e.date >= today : e.date < today))
        .sort((a, b) => (view === 'UPCOMING' ? key(a).localeCompare(key(b)) : key(b).localeCompare(key(a))))
    : [];
  const groups: { date: string; items: CalendarEvent[] }[] = [];
  list.forEach((e) => {
    const last = groups[groups.length - 1];
    if (last?.date === e.date) last.items.push(e);
    else groups.push({ date: e.date, items: [e] });
  });

  // Dicatat sebagai pembuat agenda; pengunjung tanpa login tercatat sebagai "Pengunjung portal".
  const author = user?.displayName || 'Pengunjung portal';

  const openNewForm = (date?: string) => {
    setEditing(null);
    setFormDate(date);
    setFormOpen(true);
  };

  return (
    <div className="dock-safe min-h-screen bg-[#f6f4ee] dark:bg-[#07130f] text-stone-900 dark:text-slate-100">
      <Navbar />
      <main className="max-w-xl md:max-w-5xl mx-auto px-4 space-y-4 sm:space-y-5">
        <PageHeader
          title="Agenda"
          subtitle="Kalender kegiatan yayasan & libur nasional. Siapa saja bisa menambah atau mengubah agenda."
          action={
            <button
              type="button"
              onClick={() => openNewForm()}
              className="h-10 px-3 flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Tambah
            </button>
          }
        />

        <Bento>
          {/* Kalender */}
          <BentoCard as="section" span="twoThirds" aria-label="Kalender agenda">
            {visibleMonth ? (
              <AgendaCalendar
                visible={visibleMonth}
                onVisibleChange={setMonthChoice}
                today={today}
                selected={selectedDate}
                onSelect={setDateChoice}
                events={events}
                holidays={holidays}
                holidaysLoading={holidayStatus === 'loading'}
              />
            ) : (
              <div className="h-80 rounded-2xl bg-stone-100 dark:bg-white/5 animate-pulse" role="status" aria-label="Memuat kalender" />
            )}
            {holidayStatus === 'error' && (
              <p className="mt-3 text-xs text-stone-500 dark:text-slate-400">
                Data libur nasional belum dapat dimuat; kalender tetap menampilkan agenda.
              </p>
            )}
          </BentoCard>

          {/* Rincian tanggal terpilih */}
          <BentoCard as="section" span="thirdWide" aria-labelledby="judul-tanggal" className="flex flex-col gap-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                {selectedDate === today ? 'Hari ini' : 'Tanggal dipilih'}
              </p>
              <h2 id="judul-tanggal" className="text-base font-bold leading-snug">
                {selectedDate ? longDate(selectedDate) : 'Memuat…'}
              </h2>
            </div>

            {dayHolidays.map((h) => (
              <p
                key={h.name}
                className={`flex items-start gap-2 p-2.5 rounded-2xl text-xs font-semibold ${
                  h.type === 'CUTI_BERSAMA'
                    ? 'bg-orange-50 text-orange-800 dark:bg-orange-500/10 dark:text-orange-300'
                    : 'bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-300'
                }`}
              >
                <Flag className="w-4 h-4 shrink-0 mt-px" />
                <span>
                  {h.name}
                  <span className="block font-normal opacity-80">
                    {h.type === 'CUTI_BERSAMA' ? 'Cuti bersama' : 'Libur nasional'}
                  </span>
                </span>
              </p>
            ))}

            {dayEvents.length > 0 ? (
              <ul className="space-y-2">
                {dayEvents.map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => setOpenedEvent(e)}
                      className="w-full p-2.5 rounded-2xl bg-stone-50 dark:bg-white/5 hover:bg-stone-100 dark:hover:bg-white/10 text-left cursor-pointer transition-colors"
                    >
                      <span className="text-sm font-semibold leading-snug line-clamp-2">{e.title}</span>
                      <span className="mt-0.5 flex items-center gap-1 text-[11px] text-stone-500 dark:text-slate-400">
                        <Clock className="w-3 h-3 shrink-0" />
                        {e.timeStart}
                        {e.timeEnd ? `–${e.timeEnd}` : ''} WIT
                        {e.status === 'CANCELLED' && ' · dibatalkan'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              selectedDate && (
                <p className="text-sm text-stone-500 dark:text-slate-400">Belum ada agenda pada tanggal ini.</p>
              )
            )}

            {selectedDate && (
              <button
                type="button"
                onClick={() => openNewForm(selectedDate)}
                className="mt-auto h-10 flex items-center justify-center gap-2 rounded-xl border border-dashed border-amber-500/60 text-sm font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 cursor-pointer"
              >
                <CalendarPlus className="w-4 h-4" />
                Tambah agenda di tanggal ini
              </button>
            )}
          </BentoCard>

          {/* Libur nasional bulan ini */}
          <BentoCard as="section" span="full" aria-labelledby="judul-libur-bulan">
            <h2 id="judul-libur-bulan" className="flex items-center gap-2 text-sm font-bold">
              <Flag className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              Libur nasional {visibleMonth ? monthTitle(visibleMonth) : ''}
            </h2>
            {holidayStatus === 'ready' && monthHolidays.length === 0 && (
              <p className="mt-2 text-sm text-stone-500 dark:text-slate-400">Tidak ada libur nasional pada bulan ini.</p>
            )}
            {holidayStatus === 'loading' && (
              <p className="mt-2 text-sm text-stone-500 dark:text-slate-400">Memuat libur nasional…</p>
            )}
            {holidayStatus === 'error' && (
              <p className="mt-2 text-sm text-stone-500 dark:text-slate-400">Data libur nasional belum dapat dimuat.</p>
            )}
            {monthHolidays.length > 0 && (
              <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {monthHolidays.map((h) => (
                  <li key={`${h.date}-${h.name}`}>
                    <button
                      type="button"
                      onClick={() => setDateChoice(h.date)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-2xl bg-stone-50 dark:bg-white/5 hover:bg-stone-100 dark:hover:bg-white/10 text-left cursor-pointer transition-colors"
                    >
                      <span
                        className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-base font-black ${
                          h.type === 'CUTI_BERSAMA'
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
                        }`}
                      >
                        {Number(h.date.slice(8, 10))}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold leading-snug">{h.name}</span>
                        <span className="block text-[11px] text-stone-500 dark:text-slate-400">
                          {new Date(`${h.date}T12:00:00`).toLocaleDateString('id-ID', { weekday: 'long' })}
                          {h.type === 'CUTI_BERSAMA' ? ' · cuti bersama' : ''}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-[10px] text-stone-400 dark:text-slate-500">
              Sumber: kalender libur nasional Indonesia (Google), mengikuti SKB 3 Menteri.
            </p>
          </BentoCard>
        </Bento>

        {/* Daftar agenda */}
        <section aria-label="Daftar agenda" className="space-y-4">
          <div
            className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-stone-200/70 dark:bg-white/5 max-w-sm"
            role="tablist"
            aria-label="Pilih agenda"
          >
            {(['UPCOMING', 'PAST'] as View[]).map((v) => (
              <button
                key={v}
                id={`tab-${v}`}
                type="button"
                role="tab"
                aria-selected={view === v}
                aria-controls="panel-agenda"
                onClick={() => setView(v)}
                className={`h-10 rounded-xl text-sm font-semibold cursor-pointer transition-colors ${
                  view === v
                    ? 'bg-white dark:bg-[#0c241b] shadow-sm'
                    : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                {v === 'UPCOMING' ? 'Mendatang' : 'Sudah lewat'}
              </button>
            ))}
          </div>

          <div id="panel-agenda" role="tabpanel" aria-labelledby={`tab-${view}`} className="space-y-5">
            {groups.map((g) => (
              <section key={g.date} aria-label={dayLabel(g.date, today)}>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <CalendarDays className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{dayLabel(g.date, today)}</h3>
                </div>

                <Bento as="ul">
                  {g.items.map((e) => {
                    const badge = getCategoryBadge(e.category);
                    return (
                      <BentoCard key={e.id} as="li" span="half" surface={false} className={`${CARD_SURFACE} overflow-hidden`}>
                        <button
                          type="button"
                          onClick={() => setOpenedEvent(e)}
                          className="w-full h-full flex flex-col items-start gap-2 p-4 text-left cursor-pointer active:scale-[0.99] transition-transform"
                        >
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-slate-300">
                            {badge.label}
                          </span>
                          <span className="text-base font-bold leading-snug line-clamp-2">{e.title}</span>
                          <span className="mt-auto w-full flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-stone-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 shrink-0" />
                              {e.timeStart}
                              {e.timeEnd ? `–${e.timeEnd}` : ''} WIT
                            </span>
                            <span className="flex items-center gap-1 min-w-0">
                              <MapPin className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{e.location}</span>
                            </span>
                          </span>
                          {e.status === 'CANCELLED' && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                              Dibatalkan
                            </span>
                          )}
                        </button>
                      </BentoCard>
                    );
                  })}
                </Bento>
              </section>
            ))}

            {(!today || !eventsLoaded) && (
              <p className={`${CARD_SURFACE} p-8 text-center text-sm text-stone-500 dark:text-slate-400`}>
                Memuat agenda…
              </p>
            )}

            {today && eventsLoaded && groups.length === 0 && (
              <p className="p-8 text-center text-sm text-stone-600 dark:text-slate-300 rounded-3xl bg-white dark:bg-[#0c241b] border border-dashed border-stone-300 dark:border-white/15">
                {view === 'UPCOMING'
                  ? 'Belum ada agenda mendatang. Ketuk "Tambah" untuk membuat agenda baru.'
                  : 'Belum ada agenda yang sudah lewat.'}
              </p>
            )}
          </div>
        </section>
      </main>

      <EventDetailModal
        event={openedEvent}
        onClose={() => setOpenedEvent(null)}
        onEdit={(e) => {
          setOpenedEvent(null);
          setEditing(e);
          setFormOpen(true);
        }}
        onDelete={(id) => void deleteEvent(id)}
        canManage
      />
      <CreateEventModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={(data, id) => void (id ? updateEvent(id, data) : addEvent(data))}
        initialData={editing}
        defaultDate={formDate}
        currentUserDisplayName={author}
      />
    </div>
  );
}
