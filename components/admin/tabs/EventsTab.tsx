'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { addEvent, updateEvent, deleteEvent } from '@/lib/storage';
import { CalendarEvent } from '@/lib/types';
import CreateEventModal from '@/components/CreateEventModal';
import EventDetailModal, { getCategoryBadge } from '@/components/EventDetailModal';
import { Trash2, Edit2, Plus, ExternalLink, CalendarDays } from 'lucide-react';

/** Kelola agenda budaya & kalender yayasan. */
export default function EventsTab({ events, currentAdminName }: { events: CalendarEvent[]; currentAdminName: string }) {
  // Form States: Kelola Agenda
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<CalendarEvent | null>(null);

  // ================= EVENTS HANDLERS =================
  const handleOpenNewEvent = () => {
    setEditingEvent(null);
    setShowEventModal(true);
  };

  const handleOpenEditEvent = (ev: CalendarEvent) => {
    setEditingEvent(ev);
    setShowEventModal(true);
  };

  const handleSaveEvent = (
    eventData: Omit<CalendarEvent, 'id' | 'createdAt'>,
    eventId?: string
  ) => {
    if (eventId) {
      updateEvent(eventId, eventData, currentAdminName);
    } else {
      addEvent(eventData, currentAdminName);
    }
    setShowEventModal(false);
  };

  const handleDeleteEvent = (id: string, title: string) => {
    if (confirm(`Hapus agenda "${title}"?`)) {
      deleteEvent(id, currentAdminName);
    }
  };

  return (
    <>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-stone-900 dark:text-white flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <span>Kelola Agenda, Pentas Budaya & Kunjungan Homestay</span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-slate-400">
                Jadwalkan pentas seni tari, workshop noken, reservasi homestay, dan rapat pimpinan yayasan.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/agenda"
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#091e16] hover:bg-stone-100 dark:hover:bg-white/10 border border-stone-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Lihat Kalender Publik</span>
              </Link>
              <button
                onClick={handleOpenNewEvent}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold shadow-lg shadow-amber-950/60 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Agenda Baru</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((ev) => {
              const catBadge = getCategoryBadge(ev.category);
              return (
                <div
                  key={ev.id}
                  className="p-5 rounded-2xl bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-amber-500/25 shadow-xl flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${catBadge.bgColor}`}>
                        {catBadge.label}
                      </span>
                      <span className="text-[10px] font-mono text-amber-700 dark:text-amber-300 font-bold bg-stone-50 dark:bg-white/5 px-2 py-0.5 rounded border border-stone-200 dark:border-amber-500/30">
                        {ev.date} • {ev.timeStart} WIT
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-stone-900 dark:text-white leading-snug">{ev.title}</h3>
                    <p className="text-xs text-stone-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">{ev.description}</p>
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-2 font-medium">📍 {ev.location}</p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-stone-200 dark:border-slate-800/80">
                    <span className="text-[10px] text-stone-500 dark:text-slate-400">Penyelenggara: {ev.organizer}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedEventForDetail(ev)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-200 dark:hover:bg-emerald-900 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-all"
                      >
                        Detail & WA
                      </button>
                      <button
                        onClick={() => handleOpenEditEvent(ev)}
                        className="p-1.5 rounded-lg bg-stone-200 dark:bg-slate-800 hover:bg-amber-200/60 dark:hover:bg-amber-950/60 border border-stone-200 dark:border-slate-700 text-amber-700 dark:text-amber-300 transition-all"
                        title="Edit Agenda"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(ev.id, ev.title)}
                        className="p-1.5 rounded-lg bg-stone-200 dark:bg-slate-800 hover:bg-rose-200/60 dark:hover:bg-red-950/60 border border-stone-200 dark:border-slate-700 text-rose-600 dark:text-red-400 transition-all"
                        title="Hapus Agenda"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Agenda CRUD */}
        <CreateEventModal
          isOpen={showEventModal}
          onClose={() => {
            setShowEventModal(false);
            setEditingEvent(null);
          }}
          onSave={handleSaveEvent}
          initialData={editingEvent}
          currentUserDisplayName={currentAdminName}
        />

        <EventDetailModal
          event={selectedEventForDetail}
          onClose={() => setSelectedEventForDetail(null)}
          onEdit={(ev) => {
            setSelectedEventForDetail(null);
            handleOpenEditEvent(ev);
          }}
          onDelete={(id) => {
            deleteEvent(id, currentAdminName);
          }}
          canManage={true}
        />

    </>
  );
}
