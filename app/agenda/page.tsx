'use client';

import React, { useState } from 'react';
import { CalendarDays, Clock, MapPin, Plus } from 'lucide-react';
import { useAuth, isManagerRole } from '@/lib/auth-context';
import { addEvent, deleteEvent, getEvents, SSR_EVENTS, updateEvent } from '@/lib/storage';
import { useStoreValue } from '@/lib/use-store';
import { todayWit, useWitClock } from '@/lib/use-wit-clock';
import type { CalendarEvent } from '@/lib/types';
import Navbar from '@/components/Navbar';
import PageHeader from '@/components/PageHeader';
import EventDetailModal, { getCategoryBadge } from '@/components/EventDetailModal';
import CreateEventModal from '@/components/CreateEventModal';
import { Bento, BentoCard, CARD_SURFACE, Stat } from '@/components/ui/Bento';

type View = 'UPCOMING' | 'PAST';

const dayLabel = (date: string, today: string) => {
  if (date === today) return 'Hari ini';
  const d = new Date(`${date}T12:00:00`);
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

/** Agenda budaya & kegiatan yayasan sebagai kartu bento, dikelompokkan per tanggal. */
export default function AgendaPage() {
  const { user } = useAuth();
  const canManage = isManagerRole(user?.role);
  const events = useStoreValue('events', getEvents, SSR_EVENTS);
  const { dateLabel } = useWitClock();

  const [view, setView] = useState<View>('UPCOMING');
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);

  // Tanggal hari ini baru dihitung setelah jam klien siap (hindari beda server/klien).
  const today = dateLabel ? todayWit() : '';
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

  const author = user?.displayName || 'Admin Yayasan';
  const todayCount = today ? events.filter((e) => e.date === today && e.status !== 'CANCELLED').length : 0;
  const upcomingCount = today ? events.filter((e) => e.date >= today && e.status !== 'CANCELLED').length : 0;

  return (
    <div className="dock-safe min-h-screen bg-[#f6f4ee] dark:bg-[#07130f] text-stone-900 dark:text-slate-100">
      <Navbar />
      <main className="max-w-xl md:max-w-5xl mx-auto px-4 space-y-4 sm:space-y-5">
        <PageHeader
          title="Agenda"
          subtitle="Kegiatan budaya, kunjungan, dan rapat yayasan."
          action={
            canManage && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
                className="h-10 px-3 flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Tambah
              </button>
            )
          }
        />

        <Bento>
          <BentoCard span="third">
            <Stat label="Agenda hari ini" value={today ? todayCount : '—'} unit="kegiatan" />
          </BentoCard>
          <BentoCard span="third">
            <Stat label="Akan datang" value={today ? upcomingCount : '—'} unit="kegiatan" />
          </BentoCard>
          <BentoCard span="thirdWide">
            <div
              className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-stone-100 dark:bg-white/5"
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
          </BentoCard>
        </Bento>

        {/* Daftar di bawah adalah panel dari pengalih Mendatang/Sudah lewat di atas. */}
        <div id="panel-agenda" role="tabpanel" aria-labelledby={`tab-${view}`} className="space-y-5">
          {groups.map((g) => (
            <section key={g.date} aria-label={dayLabel(g.date, today)}>
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-4 h-4" />
                </span>
                <h2 className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{dayLabel(g.date, today)}</h2>
              </div>

              <Bento as="ul">
                {g.items.map((e) => {
                  const badge = getCategoryBadge(e.category);
                  return (
                    <BentoCard key={e.id} as="li" span="half" surface={false} className={`${CARD_SURFACE} overflow-hidden`}>
                      <button
                        type="button"
                        onClick={() => setSelected(e)}
                        className="w-full h-full flex flex-col items-start gap-2 p-4 text-left cursor-pointer active:scale-[0.99] transition-transform"
                      >
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-slate-300">
                          {badge.label}
                        </span>
                        <span className="text-[15px] font-bold leading-snug line-clamp-2">{e.title}</span>
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

          {!today && (
            <p className={`${CARD_SURFACE} p-8 text-center text-sm text-stone-500 dark:text-slate-400`}>
              Memuat agenda…
            </p>
          )}

          {today && groups.length === 0 && (
            <p className="p-8 text-center text-sm text-stone-600 dark:text-slate-300 rounded-3xl bg-white dark:bg-[#0c241b] border border-dashed border-stone-300 dark:border-white/15">
              {view === 'UPCOMING' ? 'Belum ada agenda mendatang.' : 'Belum ada agenda yang sudah lewat.'}
            </p>
          )}
        </div>
      </main>

      <EventDetailModal
        event={selected}
        onClose={() => setSelected(null)}
        onEdit={(e) => {
          setSelected(null);
          setEditing(e);
          setFormOpen(true);
        }}
        onDelete={(id) => deleteEvent(id, author)}
        canManage={canManage}
      />
      <CreateEventModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={(data, id) => (id ? updateEvent(id, data, author) : addEvent(data, author))}
        initialData={editing}
        currentUserDisplayName={author}
      />
    </div>
  );
}
