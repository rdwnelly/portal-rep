'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getEvents, addEvent, updateEvent, deleteEvent } from '@/lib/storage';
import { INITIAL_EVENTS } from '@/lib/seed-data';
import { CalendarEvent, EventCategory } from '@/lib/types';
import Navbar from '@/components/Navbar';
import PWAInstallModal from '@/components/PWAInstallModal';
import PWAInstallBanner from '@/components/PWAInstallBanner';
import EventDetailModal, { getCategoryBadge } from '@/components/EventDetailModal';
import CreateEventModal from '@/components/CreateEventModal';
import { PapuanBorderCorner } from '@/components/PapuanMotif';
import confetti from 'canvas-confetti';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Filter,
  Clock,
  MapPin,
  Sparkles,
  Users,
  CalendarPlus,
  Share2,
  ListFilter,
  Grid3X3,
  CalendarDays,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

let cachedEvents: CalendarEvent[] = INITIAL_EVENTS;

function subscribeStorage(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  cachedEvents = getEvents();

  const handler = () => {
    cachedEvents = getEvents();
    callback();
  };

  window.addEventListener('portal_rep_storage_update', handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('portal_rep_storage_update', handler);
    window.removeEventListener('storage', handler);
  };
}

export default function AgendaCalendarPage() {
  const { user } = useAuth();

  const events = useSyncExternalStore(
    subscribeStorage,
    () => (typeof window !== 'undefined' ? cachedEvents : INITIAL_EVENTS),
    () => INITIAL_EVENTS
  );

  // View Mode: 'CALENDAR' or 'LIST'
  const [viewMode, setViewMode] = useState<'CALENDAR' | 'LIST'>('CALENDAR');

  // Active Month & Year in WIT
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 7, 30)); // Aug 30, 2026

  // Selected Date Filter (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-30');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modals state
  const [pwaModalOpen, setPwaModalOpen] = useState(false);
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<CalendarEvent | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const canManage = user?.role === 'EXECUTIVE' || user?.role === 'IT_ADMIN' || !user;

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
    'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
  ];

  const daysOfWeek = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  // Days in month
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const totalDaysInPrevMonth = new Date(year, month, 0).getDate();

  // Handle Month Navigation
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleTodayClick = () => {
    const today = new Date();
    setCurrentDate(today);
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
  };

  // Filtered Events
  const currentEvents = events.length > 0 ? events : getEvents();

  const filteredEvents = currentEvents.filter((ev) => {
    const matchesSearch =
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.organizer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'ALL' || ev.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Events for selected date
  const eventsOnSelectedDate = filteredEvents.filter((ev) => ev.date === selectedDate);

  // Check how many events on a particular day
  const getEventsForDay = (dayNumber: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(dayNumber).padStart(2, '0');
    const dateStr = `${year}-${mm}-${dd}`;
    return filteredEvents.filter((ev) => ev.date === dateStr);
  };

  // Category counts
  const countCulture = currentEvents.filter((e) => e.category === 'CULTURE_EVENT').length;
  const countHomestay = currentEvents.filter((e) => e.category === 'HOMESTAY_TOUR').length;
  const countMeeting = currentEvents.filter((e) => e.category === 'EXECUTIVE_MEETING').length;
  const countWorkshop = currentEvents.filter((e) => e.category === 'COMMUNITY_WORKSHOP').length;

  const handleSaveEvent = (
    eventData: Omit<CalendarEvent, 'id' | 'createdAt'>,
    eventId?: string
  ) => {
    const authorName = user?.displayName || 'Admin Yayasan';
    if (eventId) {
      updateEvent(eventId, eventData, authorName);
    } else {
      addEvent(eventData, authorName);
      if (typeof window !== 'undefined') {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#e5a93c', '#10b981', '#6366f1'],
        });
      }
    }
  };

  const handleDeleteEvent = (id: string) => {
    const authorName = user?.displayName || 'Admin Yayasan';
    deleteEvent(id, authorName);
  };

  const handleOpenEdit = (ev: CalendarEvent) => {
    setSelectedEventForDetail(null);
    setEditingEvent(ev);
    setCreateModalOpen(true);
  };

  const formatHeaderDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date(y, m - 1, d));
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-[#f6f4ee] dark:bg-[#07130f] text-stone-900 dark:text-slate-100 selection:bg-amber-500 selection:text-black">
      {/* Top Navbar */}
      <Navbar onOpenPwaModal={() => setPwaModalOpen(true)} hideHeaderOnHome={false} />

      {/* Header Banner Budaya Papua */}
      <div className="relative w-full bg-gradient-to-b from-[#113527] via-[#103325] to-[#0d2a1f] text-white pt-8 pb-12 px-4 sm:px-6 lg:px-8 border-b border-amber-500/20 shadow-xl overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#e5a93c_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <PapuanBorderCorner position="top-right" />
        <PapuanBorderCorner position="bottom-left" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold tracking-wide">
              <CalendarDays className="w-3.5 h-3.5 text-amber-400" />
              <span>MASTER EVENT & AGENDA BUDAYA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-serif text-white tracking-tight leading-tight">
              Kalender Terpadu Yayasan REP
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Pusat sinkronisasi jadwal pentas seni budaya Papua, kunjungan rombongan homestay, agenda pimpinan yayasan, serta pemeliharaan sistem terpadu di Sorong, Papua Barat Daya.
            </p>
          </div>

          {/* Action Header: Add Event Button */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setEditingEvent(null);
                setCreateModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs sm:text-sm font-extrabold transition-all shadow-lg shadow-amber-950/60 active:scale-95 cursor-pointer border border-amber-400/40"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              <span>Tambah Agenda Baru</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="max-w-7xl mx-auto mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
          <div className="p-3 rounded-2xl bg-[#0a241b]/80 border border-amber-500/20 backdrop-blur-sm">
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">🎭 Seni & Budaya</p>
            <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{countCulture} <span className="text-xs font-normal text-slate-300">Agenda</span></p>
          </div>
          <div className="p-3 rounded-2xl bg-[#0a241b]/80 border border-emerald-500/20 backdrop-blur-sm">
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">🏡 Homestay & Tamu</p>
            <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{countHomestay} <span className="text-xs font-normal text-slate-300">Jadwal</span></p>
          </div>
          <div className="p-3 rounded-2xl bg-[#0a241b]/80 border border-indigo-500/20 backdrop-blur-sm">
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">👔 Rapat Pimpinan</p>
            <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{countMeeting} <span className="text-xs font-normal text-slate-300">Pertemuan</span></p>
          </div>
          <div className="p-3 rounded-2xl bg-[#0a241b]/80 border border-teal-500/20 backdrop-blur-sm">
            <p className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">🪵 Workshop Budaya</p>
            <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{countWorkshop} <span className="text-xs font-normal text-slate-300">Kelas</span></p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 mb-safe-bottom">
        {/* Filter Bar & View Toggle */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-amber-500/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari acara, lokasi, atau pimpinan..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-[#0c261e] border border-amber-500/20 dark:border-amber-500/30 text-xs sm:text-sm text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-sm"
            />
          </div>

          {/* Category Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 custom-scrollbar">
            {[
              { id: 'ALL', label: 'Semua' },
              { id: 'CULTURE_EVENT', label: '🎭 Seni' },
              { id: 'HOMESTAY_TOUR', label: '🏡 Homestay' },
              { id: 'EXECUTIVE_MEETING', label: '👔 Pimpinan' },
              { id: 'COMMUNITY_WORKSHOP', label: '🪵 Workshop' },
              { id: 'SYSTEM_MAINTENANCE', label: '⚡ IT' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40'
                    : 'bg-stone-200 dark:bg-[#0c261e] text-stone-600 dark:text-slate-300 hover:bg-amber-500/10'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle: Grid vs List */}
          <div className="flex items-center p-1 rounded-2xl bg-stone-200 dark:bg-[#0c261e] border border-amber-500/20 shrink-0">
            <button
              onClick={() => setViewMode('CALENDAR')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'CALENDAR'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-600 dark:text-slate-400 hover:text-white'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Kalender</span>
            </button>
            <button
              onClick={() => setViewMode('LIST')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'LIST'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-600 dark:text-slate-400 hover:text-white'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Daftar Agenda</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* VIEW 1: MONTHLY CALENDAR GRID VIEW                       */}
        {/* ======================================================== */}
        {viewMode === 'CALENDAR' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Monthly Interactive Calendar (7 Cols on desktop) */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-4">
              <div className="rounded-3xl bg-white dark:bg-[#091f17] border-2 border-amber-500/30 shadow-xl p-5 sm:p-6 overflow-hidden">
                {/* Month Navigator Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold">
                      <CalendarIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white font-serif tracking-tight">
                        {monthNames[month]} {year}
                      </h2>
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                        Waktu Indonesia Timur (Sorong WIT / UTC+9)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleTodayClick}
                      className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-amber-500/15 hover:bg-amber-500/30 text-amber-600 dark:text-amber-300 border border-amber-500/30 transition-all cursor-pointer"
                    >
                      Hari Ini
                    </button>
                    <button
                      onClick={handlePrevMonth}
                      className="p-2 rounded-xl bg-stone-100 dark:bg-[#0c281e] hover:bg-amber-500/20 text-stone-700 dark:text-slate-300 transition-all border border-amber-500/20 cursor-pointer"
                      title="Bulan Sebelumnya"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNextMonth}
                      className="p-2 rounded-xl bg-stone-100 dark:bg-[#0c281e] hover:bg-amber-500/20 text-stone-700 dark:text-slate-300 transition-all border border-amber-500/20 cursor-pointer"
                      title="Bulan Berikutnya"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Day Headers (Min, Sen, Sel, ...) */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
                  {daysOfWeek.map((day, idx) => (
                    <div
                      key={day}
                      className={`text-[11px] font-extrabold uppercase py-1 ${
                        idx === 0
                          ? 'text-rose-500'
                          : 'text-stone-500 dark:text-slate-400'
                      }`}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {/* Empty slots for days from previous month */}
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => {
                    const prevDateNum = totalDaysInPrevMonth - firstDayOfMonth + i + 1;
                    return (
                      <div
                        key={`prev-${i}`}
                        className="h-16 sm:h-20 p-1.5 rounded-2xl bg-stone-50/50 dark:bg-[#061610]/40 border border-stone-200/50 dark:border-amber-900/10 text-stone-300 dark:text-slate-600 text-xs font-medium flex flex-col justify-between opacity-40 select-none"
                      >
                        <span>{prevDateNum}</span>
                      </div>
                    );
                  })}

                  {/* Active Month Days */}
                  {Array.from({ length: totalDaysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const mm = String(month + 1).padStart(2, '0');
                    const dd = String(dayNum).padStart(2, '0');
                    const dateStr = `${year}-${mm}-${dd}`;
                    const dayEvents = getEventsForDay(dayNum);
                    const isSelected = selectedDate === dateStr;
                    const isToday =
                      new Date().getFullYear() === year &&
                      new Date().getMonth() === month &&
                      new Date().getDate() === dayNum;

                    return (
                      <button
                        key={`curr-${dayNum}`}
                        type="button"
                        onClick={() => setSelectedDate(dateStr)}
                        className={`h-16 sm:h-20 p-1.5 rounded-2xl text-left transition-all relative flex flex-col justify-between border cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/20 dark:bg-amber-950/70 border-amber-500 shadow-md shadow-amber-950/40 scale-[1.02] z-10 ring-2 ring-amber-500/50'
                            : isToday
                            ? 'bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-500/50 hover:border-amber-400'
                            : 'bg-stone-50 dark:bg-[#0c281e] border-stone-200 dark:border-amber-500/15 hover:border-amber-400/50'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={`text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center ${
                              isToday
                                ? 'bg-emerald-600 text-white font-extrabold'
                                : isSelected
                                ? 'bg-amber-500 text-stone-950 font-black'
                                : 'text-stone-800 dark:text-slate-200'
                            }`}
                          >
                            {dayNum}
                          </span>

                          {dayEvents.length > 0 && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-amber-500/25 text-amber-600 dark:text-amber-300">
                              {dayEvents.length}
                            </span>
                          )}
                        </div>

                        {/* Event Category Dots / Mini Bar */}
                        <div className="flex items-center gap-1 flex-wrap mt-auto">
                          {dayEvents.slice(0, 3).map((ev) => {
                            const badge = getCategoryBadge(ev.category);
                            return (
                              <span
                                key={ev.id}
                                className={`w-2 h-2 rounded-full ${badge.dotColor} shadow-sm`}
                                title={ev.title}
                              />
                            );
                          })}
                          {dayEvents.length > 3 && (
                            <span className="text-[8px] font-bold text-slate-400">
                              +{dayEvents.length - 3}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Selected Date Agenda Details (5 Cols on desktop) */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-4">
              <div className="rounded-3xl bg-white dark:bg-[#091f17] border-2 border-amber-500/30 shadow-xl p-5 sm:p-6 flex flex-col h-full">
                <div className="flex items-center justify-between pb-3 border-b border-amber-500/20 mb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      AGENDA TERPILIH
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-white font-serif">
                      {formatHeaderDate(selectedDate)}
                    </h3>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                    {eventsOnSelectedDate.length} Agenda
                  </span>
                </div>

                {/* Events list on selected date */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[480px] custom-scrollbar pr-1">
                  {eventsOnSelectedDate.length > 0 ? (
                    eventsOnSelectedDate.map((ev) => {
                      const categoryInfo = getCategoryBadge(ev.category);
                      return (
                        <div
                          key={ev.id}
                          onClick={() => setSelectedEventForDetail(ev)}
                          className="p-4 rounded-2xl bg-stone-50 dark:bg-[#0c281e] border border-stone-200 dark:border-amber-500/20 hover:border-amber-400/60 transition-all cursor-pointer group shadow-sm hover:shadow-md"
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span
                              className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${categoryInfo.bgColor}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${categoryInfo.dotColor}`} />
                              {categoryInfo.label}
                            </span>
                            {ev.isHighlight && (
                              <span className="text-[9px] font-bold text-amber-500 flex items-center gap-0.5">
                                <Sparkles className="w-3 h-3" />
                                Unggulan
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-black text-stone-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-300 transition-colors leading-snug">
                            {ev.title}
                          </h4>

                          <p className="text-xs text-stone-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                            {ev.description}
                          </p>

                          <div className="mt-3 pt-2.5 border-t border-stone-200 dark:border-amber-500/15 flex items-center justify-between text-[11px] text-stone-500 dark:text-slate-400">
                            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-mono font-bold">
                              <Clock className="w-3.5 h-3.5" />
                              {ev.timeStart} WIT
                            </span>
                            <span className="flex items-center gap-1 truncate max-w-[150px]">
                              <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                              {ev.location}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center rounded-2xl bg-stone-50 dark:bg-[#0c281e]/50 border border-dashed border-stone-300 dark:border-amber-500/20 text-stone-500 dark:text-slate-400 space-y-3">
                      <CalendarDays className="w-10 h-10 text-amber-500/40 mx-auto" />
                      <p className="text-xs font-semibold">
                        Tidak ada agenda khusus pada tanggal {formatHeaderDate(selectedDate)}.
                      </p>
                      <button
                        onClick={() => {
                          setEditingEvent(null);
                          setCreateModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-600 dark:text-amber-300 text-xs font-bold border border-amber-500/30 transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Tambah Agenda Pada Tanggal Ini
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: MASTER AGENDA FEED / LIST VIEW                   */}
        {/* ======================================================== */}
        {viewMode === 'LIST' && (
          <div className="space-y-4">
            {filteredEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEvents.map((ev) => {
                  const categoryInfo = getCategoryBadge(ev.category);
                  return (
                    <div
                      key={ev.id}
                      onClick={() => setSelectedEventForDetail(ev)}
                      className="p-5 rounded-3xl bg-white dark:bg-[#091f17] border-2 border-amber-500/25 hover:border-amber-400/60 shadow-lg hover:shadow-2xl transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden"
                    >
                      <PapuanBorderCorner position="top-right" />

                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${categoryInfo.bgColor}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${categoryInfo.dotColor}`} />
                            {categoryInfo.label}
                          </span>
                          {ev.isHighlight && (
                            <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              Unggulan
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-black text-stone-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-300 transition-colors leading-snug font-serif">
                          {ev.title}
                        </h3>

                        <p className="text-xs text-stone-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                          {ev.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-stone-200 dark:border-amber-500/20 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-stone-700 dark:text-slate-200">
                          <span className="font-bold flex items-center gap-1.5">
                            <CalendarDays className="w-3.5 h-3.5 text-amber-500" />
                            {formatHeaderDate(ev.date)}
                          </span>
                          <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                            {ev.timeStart} WIT
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-stone-500 dark:text-slate-400 text-[11px] truncate">
                          <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate">{ev.location}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#091f17] border-2 border-dashed border-amber-500/30 text-stone-500 dark:text-slate-400 space-y-3">
                <CalendarDays className="w-12 h-12 text-amber-500/40 mx-auto" />
                <p className="text-base font-bold text-stone-800 dark:text-slate-200">
                  Tidak ada agenda yang cocok dengan pencarian atau filter.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('ALL');
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-stone-950 text-xs font-bold transition-all"
                >
                  Reset Filter
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal Detail Agenda */}
      <EventDetailModal
        event={selectedEventForDetail}
        onClose={() => setSelectedEventForDetail(null)}
        onEdit={handleOpenEdit}
        onDelete={handleDeleteEvent}
        canManage={canManage}
      />

      {/* Modal Tambah / Edit Agenda */}
      <CreateEventModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setEditingEvent(null);
        }}
        onSave={handleSaveEvent}
        initialData={editingEvent}
        currentUserDisplayName={user?.displayName || 'Admin Yayasan REP'}
      />

      {/* PWA Modal & Banner */}
      <PWAInstallModal isOpen={pwaModalOpen} onClose={() => setPwaModalOpen(false)} />
      <PWAInstallBanner onOpenModal={() => setPwaModalOpen(true)} />
    </div>
  );
}
