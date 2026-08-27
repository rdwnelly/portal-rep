'use client';

import React, { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Wallet,
  Store,
  Sparkles,
  ChevronRight,
  Bell,
  KeyRound,
  Check,
  Copy,
  ExternalLink,
  X,
  SlidersHorizontal,
  Search,
  Landmark
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getAppsList, getNotices } from '@/lib/storage';
import { INITIAL_APPS, INITIAL_NOTICES } from '@/lib/seed-data';
import { AppItem, NoticeItem } from '@/lib/types';
import Navbar from '@/components/Navbar';
import PWAInstallModal from '@/components/PWAInstallModal';
import PWAInstallBanner from '@/components/PWAInstallBanner';
import RequestAccessModal from '@/components/RequestAccessModal';
import NoticeDetailModal from '@/components/NoticeDetailModal';
import AdminLoginModal from '@/components/AdminLoginModal';

let cachedApps: AppItem[] = INITIAL_APPS;
let cachedNotices: NoticeItem[] = INITIAL_NOTICES;

function subscribeStorage(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  cachedApps = getAppsList();
  cachedNotices = getNotices();
  
  const handler = () => {
    cachedApps = getAppsList();
    cachedNotices = getNotices();
    callback();
  };

  window.addEventListener('portal_rep_storage_update', handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('portal_rep_storage_update', handler);
    window.removeEventListener('storage', handler);
  };
}

export default function AppsCatalogPage() {
  const apps = useSyncExternalStore(
    subscribeStorage,
    () => (typeof window !== 'undefined' ? cachedApps : INITIAL_APPS),
    () => INITIAL_APPS
  );

  const notices = useSyncExternalStore(
    subscribeStorage,
    () => (typeof window !== 'undefined' ? cachedNotices : INITIAL_NOTICES),
    () => INITIAL_NOTICES
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Modals
  const [pwaModalOpen, setPwaModalOpen] = useState(false);
  const [requestAccessModalOpen, setRequestAccessModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [selectedAppForRequest, setSelectedAppForRequest] = useState<AppItem | null>(null);
  const [copiedAppId, setCopiedAppId] = useState<string | null>(null);
  const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);

  // Active App Detail Modal
  const [activeAppDrawer, setActiveAppDrawer] = useState<AppItem | null>(null);

  const currentApps = apps;
  const currentNotices = notices;

  const filteredApps = currentApps.filter((app) => {
    const matchesSearch =
      app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.shortCode.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'ALL' || app.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

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

  // Structured app practical cards data
  const getAppCardData = (index: number, app: AppItem) => {
    const num = (index + 1).toString().padStart(2, '0');
    switch (app.id) {
      case 'app-reservasi-homestay':
        return {
          num,
          title: 'Reservasi Homestay',
          subtitle: '& tiket',
          description: 'Kelola ketersediaan kamar, pemesanan tamu, dan penjualan tiket dalam satu alur.',
          icon: CalendarDays,
          badgeColor: 'bg-[#feebe7] dark:bg-rose-950/60 text-[#c24127] dark:text-rose-300 border border-[#fbd3cb] dark:border-rose-800/40',
        };
      case 'app-sik-rep':
        return {
          num,
          title: 'SIK-REP Keuangan',
          subtitle: '& pembukuan',
          description: 'Catat transaksi, pantau arus kas, dan siapkan laporan keuangan yayasan.',
          icon: Wallet,
          badgeColor: 'bg-[#fef3d6] dark:bg-amber-950/60 text-[#b45309] dark:text-amber-300 border border-[#fde4a0] dark:border-amber-800/40',
        };
      case 'app-pos-omg':
        return {
          num,
          title: 'POS Yaswar Kasir',
          subtitle: '& stok',
          description: 'Proses penjualan di kasir dan kendalikan stok produk secara real-time.',
          icon: Store,
          badgeColor: 'bg-[#e2f7f1] dark:bg-teal-950/60 text-[#0d745e] dark:text-teal-300 border border-[#bbf0e1] dark:border-teal-800/40',
        };
      case 'app-zeestudio':
        return {
          num,
          title: 'Zeestudio Kreatif',
          subtitle: '& media',
          description: 'Akses ruang kerja kreatif untuk produksi konten dan kebutuhan media REP.',
          icon: Sparkles,
          badgeColor: 'bg-[#f4eafc] dark:bg-purple-950/60 text-[#7e22ce] dark:text-purple-300 border border-[#e8d1f9] dark:border-purple-800/40',
        };
      default:
        return {
          num,
          title: app.title,
          subtitle: app.badgeText || '& sistem modul',
          description: app.description || 'Gunakan aplikasi sesuai dengan kebutuhan operasional Anda.',
          icon: Landmark,
          badgeColor: 'bg-[#e7f1eb] dark:bg-emerald-950/60 text-[#11382b] dark:text-emerald-300 border border-[#cde2d6] dark:border-emerald-800/40',
        };
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-[#f6f4ee] dark:bg-[#07130f] text-stone-900 dark:text-slate-100 selection:bg-amber-500 selection:text-black">
      {/* Top Navbar with custom hidden sticky header so the botanical hero matches the design */}
      <Navbar onOpenPwaModal={() => setPwaModalOpen(true)} hideHeaderOnHome={true} />

      {/* ========================================================================= */}
      {/* 1. BOTANICAL DARK FOREST GREEN HEADER (MATCHING MOCKUP)                   */}
      {/* ========================================================================= */}
      <header className="relative w-full bg-gradient-to-b from-[#113527] via-[#103325] to-[#0d2a1f] text-white pt-6 sm:pt-8 pb-12 sm:pb-14 px-4 sm:px-6 lg:px-8 shadow-xl overflow-hidden">
        {/* Subtle Ambient Glows */}
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

          {/* Section Tag & Headline */}
          <div className="space-y-1">
            <p className="text-[11px] font-bold tracking-wider text-emerald-200/90 uppercase font-mono">
              PUSAT APLIKASI
            </p>
            <h1 className="text-3xl sm:text-4xl font-serif font-black text-white tracking-tight leading-tight">
              Layanan{' '}
              <span className="font-serif italic font-normal text-[#e5a93c] tracking-wide">
                PERWAKILAN.
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 font-medium max-w-sm mt-1.5 leading-relaxed">
              Gunakan aplikasi sesuai dengan kebutuhan operasional Anda.
            </p>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. 2-COLUMN APPLICATION GRID (MATCHING SCREENSHOT)                        */}
      {/* ========================================================================= */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 w-full flex-1 -mt-6 z-20 pb-36">
        {/* Optional Filter & Search Toggle */}
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400">
            {filteredApps.length} Aplikasi Operasional
          </span>
          <button
            type="button"
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className="text-xs font-bold text-[#b45309] dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{showFilterDrawer ? 'Tutup Filter' : 'Filter Kategori'}</span>
            <SlidersHorizontal className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>

        {/* Expandable Filter Box */}
        {showFilterDrawer && (
          <div className="mb-4 p-4 rounded-2xl bg-white dark:bg-[#0c241b] border border-stone-200 dark:border-amber-500/30 shadow-md animate-in fade-in">
            <div className="relative w-full mb-3">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari sistem / modul..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-50 dark:bg-[#06160f] border border-stone-200 dark:border-amber-500/20 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-[#11382b]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'ALL', label: 'Semua' },
                { id: 'OPERASIONAL', label: 'Homestay' },
                { id: 'KEUANGAN', label: 'Keuangan' },
                { id: 'GUDANG_POS', label: 'Kasir & Gudang' },
                { id: 'MEDIA_KREATIF', label: 'Media' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-[#11382b] text-white shadow-sm'
                      : 'bg-stone-100 dark:bg-[#0a1e16] text-stone-600 dark:text-slate-300 hover:bg-stone-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 2-Column Application Cards Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {filteredApps.map((app, index) => {
            const cardData = getAppCardData(index, app);
            const IconComp = cardData.icon;

            return (
              <div
                key={app.id}
                onClick={() => handleLaunchClick(app.url)}
                className="group relative rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0c241b] hover:bg-[#fafaf8] dark:hover:bg-[#103024] border border-stone-200/90 dark:border-amber-500/25 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer active:scale-[0.98]"
              >
                <div>
                  {/* Top Row: Number & Circular Icon Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono font-bold text-xs text-stone-400 dark:text-stone-500 select-none">
                      {cardData.num}
                    </span>

                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full ${cardData.badgeColor} flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-200 shrink-0`}
                    >
                      <IconComp className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  </div>

                  {/* Title & Sublabel */}
                  <h3 className="text-sm sm:text-base font-extrabold text-stone-900 dark:text-white group-hover:text-[#11382b] dark:group-hover:text-amber-300 transition-colors leading-snug line-clamp-1">
                    {cardData.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 font-medium mt-0.5 line-clamp-1">
                    {cardData.subtitle}
                  </p>

                  {/* Practical Description */}
                  <p className="text-[11px] sm:text-xs text-stone-600 dark:text-stone-300 leading-relaxed mt-2.5 line-clamp-3 sm:line-clamp-4">
                    {cardData.description}
                  </p>
                </div>

                {/* Bottom Action: "Buka aplikasi >" & Options */}
                <div className="flex items-center justify-between gap-1 pt-4 mt-auto border-t border-stone-100 dark:border-stone-800">
                  <span className="text-xs font-black text-stone-800 dark:text-stone-200 group-hover:text-[#11382b] dark:group-hover:text-amber-300 flex items-center gap-1 transition-all">
                    <span>Buka aplikasi</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveAppDrawer(app);
                    }}
                    className="p-1 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-emerald-950/60 transition-all cursor-pointer"
                    title="Opsi Aplikasi"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* 3. BOTTOM HELP STRIP (MATCHING SCREENSHOT)                                */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between px-2 pt-6 pb-2 text-xs">
          <span className="text-stone-500 dark:text-stone-400 font-medium">
            Butuh bantuan?
          </span>
          <button
            type="button"
            onClick={() => setAdminModalOpen(true)}
            className="font-bold text-[#b45309] dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Hubungi admin</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
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

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
      />

      {/* PWA Install Modal */}
      <PWAInstallModal isOpen={pwaModalOpen} onClose={() => setPwaModalOpen(false)} />

      {/* Request Access Modal */}
      <RequestAccessModal
        isOpen={requestAccessModalOpen}
        preselectedApp={selectedAppForRequest}
        availableApps={currentApps}
        onClose={() => {
          setRequestAccessModalOpen(false);
          setSelectedAppForRequest(null);
        }}
      />

      {/* PWA Floating Banner */}
      <PWAInstallBanner onOpenModal={() => setPwaModalOpen(true)} />
    </div>
  );
}
