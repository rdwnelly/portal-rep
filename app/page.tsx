'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Landmark,
  ExternalLink,
  Sparkles,
  Check,
  Copy,
  KeyRound,
  Bell,
  ChevronRight,
  CalendarDays,
  Wallet,
  Store,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getAppsList, getNotices } from '@/lib/storage';
import { AppItem, NoticeItem } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import PWAInstallModal from '@/components/PWAInstallModal';
import PWAInstallBanner from '@/components/PWAInstallBanner';
import NoticeDetailModal from '@/components/NoticeDetailModal';
import RequestAccessModal from '@/components/RequestAccessModal';

export default function OpenPortalHomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [apps, setApps] = useState<AppItem[]>(() => (typeof window !== 'undefined' ? getAppsList() : []));
  const [notices, setNotices] = useState<NoticeItem[]>(() => (typeof window !== 'undefined' ? getNotices() : []));

  // Modals state
  const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);
  const [pwaModalOpen, setPwaModalOpen] = useState(false);
  const [requestAccessModalOpen, setRequestAccessModalOpen] = useState(false);
  const [selectedAppForRequest, setSelectedAppForRequest] = useState<AppItem | null>(null);
  const [copiedAppId, setCopiedAppId] = useState<string | null>(null);

  // Selected App detail modal / action sheet
  const [activeAppDrawer, setActiveAppDrawer] = useState<AppItem | null>(null);

  // Live WIT Date & Time State
  const [dateHeader, setDateHeader] = useState('KAMIS, 27 AGUSTUS 2026');
  const [dayNumber, setDayNumber] = useState('27');
  const [monthYear, setMonthYear] = useState({ month: 'AGU', year: '2026' });
  const [timeWIT, setTimeWIT] = useState('08.42');
  const [greetingText, setGreetingText] = useState('Selamat pagi,');

  useEffect(() => {
    const handleStorageUpdate = () => {
      setApps(getAppsList());
      setNotices(getNotices());
    };

    window.addEventListener('portal_rep_storage_update', handleStorageUpdate);
    return () => window.removeEventListener('portal_rep_storage_update', handleStorageUpdate);
  }, []);

  // Update Live WIT Time and Date
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      // Time in WIT (UTC+9)
      const optionsTime: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Jayapura',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      };
      const formattedTime = new Intl.DateTimeFormat('id-ID', optionsTime).format(now).replace(':', '.');
      setTimeWIT(formattedTime);

      // Hour in WIT for greeting
      const hourWIT = parseInt(
        new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jayapura', hour: 'numeric', hour12: false }).format(now),
        10
      );

      if (hourWIT >= 4 && hourWIT < 11) {
        setGreetingText('Selamat pagi,');
      } else if (hourWIT >= 11 && hourWIT < 15) {
        setGreetingText('Selamat siang,');
      } else if (hourWIT >= 15 && hourWIT < 18) {
        setGreetingText('Selamat sore,');
      } else {
        setGreetingText('Selamat malam,');
      }

      // Date Header (e.g. KAMIS, 27 AGUSTUS 2026)
      const optionsDateFull: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Jayapura',
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      };
      const formattedDateFull = new Intl.DateTimeFormat('id-ID', optionsDateFull).format(now).toUpperCase();
      setDateHeader(formattedDateFull);

      // Day Number (e.g. 27)
      const optionsDay: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Jayapura',
        day: 'numeric',
      };
      setDayNumber(new Intl.DateTimeFormat('id-ID', optionsDay).format(now));

      // Month & Year (e.g. AGU / 2026)
      const optionsMonth: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Jayapura',
        month: 'short',
      };
      const optionsYear: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Jayapura',
        year: 'numeric',
      };
      const monthStr = new Intl.DateTimeFormat('id-ID', optionsMonth).format(now).toUpperCase();
      const yearStr = new Intl.DateTimeFormat('id-ID', optionsYear).format(now);
      setMonthYear({ month: monthStr, year: yearStr });
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const currentApps = apps.length > 0 ? apps : getAppsList();
  const currentNotices = notices.length > 0 ? notices : getNotices();

  const handleLaunchClick = (url: string) => {
    if (typeof window !== 'undefined') {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#e5a93c', '#11382b', '#c28844', '#10b981'],
      });
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCopyLink = (e: React.MouseEvent, appId: string, url: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedAppId(appId);
      setTimeout(() => setCopiedAppId(null), 2000);
    }
  };

  // User first name or display name for greeting
  const userGreetingName = user
    ? user.displayName.split(' ')[0] + '.'
    : 'Elly.';

  // Latest notice for floating announcement card
  const latestNotice = currentNotices.find((n) => n.isPinned) || currentNotices[0] || {
    id: 'default-notice',
    title: 'Briefing operasional hari ini',
    content: '09.00 WIT · Ruang Serbaguna Yayasan Rumah Etnik Papua',
    category: 'AGENDA',
    authorName: 'Ketua Yayasan',
    createdAt: new Date().toISOString(),
    isPinned: true
  };

  // Helper metadata styling for numbered vertical items
  const getItemMetadata = (index: number, app: AppItem) => {
    const num = (index + 1).toString().padStart(2, '0');
    switch (app.id) {
      case 'app-reservasi-homestay':
        return {
          num,
          title: 'Reservasi Homestay',
          subtitle: '& tiket',
          icon: CalendarDays,
          badgeColor: 'bg-[#feebe7] dark:bg-rose-950/60 text-[#c24127] dark:text-rose-300 border border-[#fbd3cb] dark:border-rose-800/40',
        };
      case 'app-sik-rep':
        return {
          num,
          title: 'SIK-REP Keuangan',
          subtitle: '& pembukuan',
          icon: Wallet,
          badgeColor: 'bg-[#fef3d6] dark:bg-amber-950/60 text-[#b45309] dark:text-amber-300 border border-[#fde4a0] dark:border-amber-800/40',
        };
      case 'app-pos-omg':
        return {
          num,
          title: 'POS Yaswar Kasir',
          subtitle: '& stok',
          icon: Store,
          badgeColor: 'bg-[#e2f7f1] dark:bg-teal-950/60 text-[#0d745e] dark:text-teal-300 border border-[#bbf0e1] dark:border-teal-800/40',
        };
      case 'app-zeestudio':
        return {
          num,
          title: 'Zeestudio Kreatif',
          subtitle: '& media',
          icon: Sparkles,
          badgeColor: 'bg-[#f4eafc] dark:bg-purple-950/60 text-[#7e22ce] dark:text-purple-300 border border-[#e8d1f9] dark:border-purple-800/40',
        };
      default:
        return {
          num,
          title: app.title,
          subtitle: app.badgeText || '& modul sistem',
          icon: Landmark,
          badgeColor: 'bg-[#e7f1eb] dark:bg-emerald-950/60 text-[#11382b] dark:text-emerald-300 border border-[#cde2d6] dark:border-emerald-800/40',
        };
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-[#f6f4ee] dark:bg-[#07130f] text-stone-900 dark:text-slate-100 selection:bg-amber-500 selection:text-black">
      {/* Top Navbar Component with hidden sticky header on home so the botanical hero is dominant */}
      <Navbar onOpenPwaModal={() => setPwaModalOpen(true)} hideHeaderOnHome={true} />

      {/* ========================================================================= */}
      {/* 1. BOTANICAL DARK FOREST GREEN HEADER (MATCHING SCREENSHOT)               */}
      {/* ========================================================================= */}
      <header className="relative w-full bg-gradient-to-b from-[#113527] via-[#103325] to-[#0d2a1f] text-white pt-6 sm:pt-8 pb-14 sm:pb-16 px-4 sm:px-6 lg:px-8 shadow-xl overflow-hidden">
        {/* Subtle Papuan Decorative Glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-2xl mx-auto relative z-10">
          {/* Top Brand Bar */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <Link href="/" className="flex items-center gap-3 group">
              {/* Circular Emblem Monogram "R" */}
              <div className="w-11 h-11 rounded-full border-2 border-amber-200/40 bg-[#0a2319] flex items-center justify-center shadow-lg shadow-black/40 group-hover:border-amber-300 transition-all shrink-0">
                <span className="font-serif font-black text-amber-200 text-xl leading-none select-none">R</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-200/80 leading-none">
                  YAYASAN RUMAH ETNIK PAPUA
                </span>
                <span className="text-lg sm:text-xl font-serif font-black text-white tracking-tight leading-tight mt-0.5 group-hover:text-amber-200 transition-colors">
                  Portal REP
                </span>
              </div>
            </Link>

            {/* Notification Bell Button */}
            <Link
              href="/dashboard/notices"
              className="relative p-2.5 rounded-full bg-[#0a2319]/80 border border-emerald-500/30 hover:border-amber-400 text-amber-200 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
              title="Papan Pengumuman"
            >
              <Bell className="w-5 h-5" />
              {currentNotices.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-[#113527] animate-pulse" />
              )}
            </Link>
          </div>

          {/* Date Tag & Greeting with Compact Calendar Widget */}
          <div className="flex items-end justify-between gap-4 pt-1">
            {/* Left Greeting Text */}
            <div className="space-y-1">
              <p className="text-[11px] font-bold tracking-wider text-emerald-200/90 uppercase font-mono">
                {dateHeader}
              </p>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight leading-tight">
                {greetingText}{' '}
                <span className="font-serif italic font-normal text-[#e5a93c] drop-shadow-sm">
                  {userGreetingName}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/80 font-medium">
                Ringkasan operasionalmu hari ini.
              </p>
            </div>

            {/* Right Compact Calendar Widget */}
            <div className="flex items-center gap-3 border-l border-emerald-600/40 pl-4 sm:pl-6 shrink-0 pb-1">
              <span className="text-4xl sm:text-5xl font-serif font-black text-white leading-none tracking-tight">
                {dayNumber}
              </span>
              <div className="flex flex-col text-[11px] font-extrabold leading-tight text-emerald-200 uppercase">
                <span className="tracking-wider">{monthYear.month}</span>
                <span className="font-mono text-emerald-300/80">{monthYear.year}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. FLOATING ANNOUNCEMENT PANEL (MATCHING SCREENSHOT)                       */}
      {/* ========================================================================= */}
      <section className="relative -mt-7 mx-4 sm:mx-6 max-w-2xl sm:mx-auto z-20 w-[calc(100%-2rem)] sm:w-full">
        <div
          onClick={() => {
            if (latestNotice.id !== 'default-notice') {
              setSelectedNotice(latestNotice);
            } else {
              router.push('/dashboard/notices');
            }
          }}
          className="rounded-2xl bg-white dark:bg-[#0c241b] border border-stone-200/90 dark:border-amber-500/30 shadow-xl hover:shadow-2xl transition-all p-3.5 sm:p-4 flex items-center justify-between gap-3.5 cursor-pointer group"
        >
          {/* Bell Icon in Warm Terracotta Circle Badge */}
          <div className="w-11 h-11 rounded-full bg-[#fbeee4] dark:bg-amber-950/60 text-[#b45309] dark:text-amber-300 flex items-center justify-center shrink-0 shadow-inner">
            <Bell className="w-5 h-5" />
          </div>

          {/* Announcement Text Info */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#b45309] dark:text-amber-400">
                PENGUMUMAN TERBARU
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-black text-stone-900 dark:text-white line-clamp-1 group-hover:text-[#11382b] dark:group-hover:text-amber-300 transition-colors mt-0.5">
              {latestNotice.title}
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-300 line-clamp-1 mt-0.5">
              {latestNotice.id === 'default-notice'
                ? latestNotice.content
                : `${new Date(latestNotice.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIT · ${latestNotice.category}`}
            </p>
          </div>

          {/* Right Chevron */}
          <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-300 group-hover:text-[#11382b] dark:group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all shrink-0" />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. PUSAT APLIKASI - NUMBERED VERTICAL LIST (MATCHING SCREENSHOT)          */}
      {/* ========================================================================= */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 w-full flex-1 pt-7 pb-36" id="pusat-aplikasi">
        {/* Section Header Row */}
        <div className="flex items-end justify-between gap-3 mb-4">
          <div>
            <span className="text-[10px] sm:text-[11px] font-extrabold tracking-widest text-stone-500 dark:text-stone-400 uppercase">
              PUSAT APLIKASI
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#11382b] dark:text-amber-400 tracking-tight leading-tight mt-0.5">
              Pilih layanan
            </h2>
          </div>

          {/* Action: Lihat semua -> Buka Halaman Grid 2 Kolom /apps */}
          <Link
            href="/apps"
            className="text-xs sm:text-sm font-bold text-[#b45309] dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Lihat semua</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Numbered Vertical Cards List */}
        <div className="space-y-3">
          {currentApps.map((app, index) => {
            const meta = getItemMetadata(index, app);
            const IconComp = meta.icon;

            return (
              <div
                key={app.id}
                onClick={() => handleLaunchClick(app.url)}
                className="group relative rounded-2xl bg-white dark:bg-[#0c241b] hover:bg-[#fafaf8] dark:hover:bg-[#103024] border border-stone-200/80 dark:border-amber-500/25 p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-3.5 cursor-pointer active:scale-[0.99]"
              >
                {/* 1. Number (01, 02, 03, 04...) */}
                <span className="font-mono font-bold text-sm text-stone-400 dark:text-stone-500 w-6 shrink-0 text-center select-none">
                  {meta.num}
                </span>

                {/* 2. Category Color Icon Badge */}
                <div
                  className={`w-11 h-11 rounded-2xl ${meta.badgeColor} flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform duration-200`}
                >
                  <IconComp className="w-5 h-5" />
                </div>

                {/* 3. Title & Subtitle */}
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white group-hover:text-[#11382b] dark:group-hover:text-amber-300 transition-colors leading-tight truncate">
                    {meta.title}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 truncate mt-0.5">
                    {meta.subtitle}
                  </p>
                </div>

                {/* 4. Quick Action Button (Options Trigger / Chevron) */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveAppDrawer(app);
                    }}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-emerald-950/60 transition-all cursor-pointer"
                    title="Opsi Aplikasi"
                  >
                    <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </button>
                  <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-400 group-hover:text-[#11382b] dark:group-hover:text-amber-300 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Operational Status Bar at the Bottom of List */}
        <div className="mt-4 p-3 rounded-2xl bg-stone-100/80 dark:bg-[#0a1e16] border border-stone-200/60 dark:border-amber-500/20 flex items-center justify-between text-xs text-stone-600 dark:text-slate-300">
          <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-400">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
            </span>
            <span>Sistem berjalan normal</span>
          </div>

          <span className="text-[11px] text-stone-500 dark:text-stone-400 font-mono">
            Terakhir diperbarui {timeWIT} WIT
          </span>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 4. MODALS & ACTION DRAWERS                                                */}
      {/* ========================================================================= */}
      
      {/* Quick App Action Drawer Modal */}
      {activeAppDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl glass-panel bg-white dark:bg-[#091f17] border-2 border-amber-500/40 shadow-2xl p-6 overflow-hidden">
            <button
              onClick={() => setActiveAppDrawer(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-stone-100 dark:bg-slate-900 text-stone-500 dark:text-slate-300 hover:text-stone-900 transition-all border border-stone-200 dark:border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500 shrink-0">
                <Landmark className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">{activeAppDrawer.shortCode}</span>
                <h3 className="text-base font-extrabold text-stone-900 dark:text-white truncate">{activeAppDrawer.title}</h3>
                <p className="text-xs text-stone-500 dark:text-slate-300 truncate">{activeAppDrawer.badgeText}</p>
              </div>
            </div>

            <p className="text-xs text-stone-600 dark:text-slate-300 leading-relaxed mb-5">
              {activeAppDrawer.description}
            </p>

            <div className="space-y-2.5">
              {/* Buka Sistem */}
              <button
                type="button"
                onClick={() => {
                  handleLaunchClick(activeAppDrawer.url);
                  setActiveAppDrawer(null);
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#113527] to-[#164a39] hover:from-[#0d2a1f] hover:to-[#113527] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all active:scale-95 cursor-pointer"
              >
                <span>Buka Sistem Langsung</span>
                <ExternalLink className="w-4 h-4" />
              </button>

              {/* Salin Tautan */}
              <button
                type="button"
                onClick={(e) => handleCopyLink(e, activeAppDrawer.id, activeAppDrawer.url)}
                className="w-full py-2.5 px-4 rounded-xl bg-stone-100 dark:bg-[#0c241b] hover:bg-stone-200 text-stone-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-stone-200 dark:border-amber-500/20 transition-all cursor-pointer"
              >
                {copiedAppId === activeAppDrawer.id ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-600">Tautan Berhasil Disalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-stone-500 dark:text-amber-400" />
                    <span>Salin Tautan URL</span>
                  </>
                )}
              </button>

              {/* Minta Akses Akun */}
              <button
                type="button"
                onClick={() => {
                  setSelectedAppForRequest(activeAppDrawer);
                  setRequestAccessModalOpen(true);
                  setActiveAppDrawer(null);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-900 dark:text-amber-300 font-bold text-xs flex items-center justify-center gap-2 border border-amber-300 dark:border-amber-500/30 transition-all cursor-pointer"
              >
                <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Minta Akses / Pendaftaran Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notice Detail Modal */}
      {selectedNotice && (
        <NoticeDetailModal
          notice={selectedNotice}
          onClose={() => setSelectedNotice(null)}
        />
      )}

      {/* PWA Install Modal */}
      <PWAInstallModal isOpen={pwaModalOpen} onClose={() => setPwaModalOpen(false)} />

      {/* Request Access / Registration Modal */}
      <RequestAccessModal
        isOpen={requestAccessModalOpen}
        preselectedApp={selectedAppForRequest}
        availableApps={currentApps}
        onClose={() => {
          setRequestAccessModalOpen(false);
          setSelectedAppForRequest(null);
        }}
      />

      {/* PWA Floating Install Pop-Up / Banner */}
      <PWAInstallBanner onOpenModal={() => setPwaModalOpen(true)} />
    </div>
  );
}
