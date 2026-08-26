'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  BedDouble,
  Landmark,
  ShoppingBag,
  Camera,
  Search,
  ExternalLink,
  Sparkles,
  Clock,
  Download,
  Bell,
  Check,
  Copy,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getAppsList, getNotices } from '@/lib/storage';
import { AppItem, NoticeItem } from '@/lib/types';
import PWAInstallModal from '@/components/PWAInstallModal';
import NoticeDetailModal from '@/components/NoticeDetailModal';
import { PapuanMotifDivider, PapuanBorderCorner } from '@/components/PapuanMotif';

const ICON_MAP: Record<string, React.ElementType> = {
  BedDouble,
  Landmark,
  ShoppingBag,
  Camera,
};

export default function OpenPortalHomePage() {
  const [apps, setApps] = useState<AppItem[]>(() => (typeof window !== 'undefined' ? getAppsList() : []));
  const [notices, setNotices] = useState<NoticeItem[]>(() => (typeof window !== 'undefined' ? getNotices() : []));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modals state
  const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);
  const [pwaModalOpen, setPwaModalOpen] = useState(false);
  const [copiedAppId, setCopiedAppId] = useState<string | null>(null);

  // Live WIT Clock (Sorong, Papua Barat Daya - UTC+9)
  const [timeWIT, setTimeWIT] = useState<string>('');
  const [dateWIT, setDateWIT] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const optionsTime: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Jayapura',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      };
      const optionsDate: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Jayapura',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      };
      setTimeWIT(new Intl.DateTimeFormat('id-ID', optionsTime).format(now));
      setDateWIT(new Intl.DateTimeFormat('id-ID', optionsDate).format(now));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    const handleStorageUpdate = () => {
      setApps(getAppsList());
      setNotices(getNotices());
    };

    window.addEventListener('portal_rep_storage_update', handleStorageUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('portal_rep_storage_update', handleStorageUpdate);
    };
  }, []);

  const currentApps = apps.length > 0 ? apps : getAppsList();
  const currentNotices = notices.length > 0 ? notices : getNotices();

  const filteredApps = currentApps.filter((app) => {
    const matchesSearch =
      app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.shortCode.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'ALL' || app.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleLaunchClick = () => {
    if (typeof window !== 'undefined') {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#e5a93c', '#0f382a', '#c28844', '#10b981'],
      });
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

  const categories = [
    { id: 'ALL', label: 'Semua Aplikasi', count: currentApps.length },
    { id: 'OPERASIONAL', label: 'Homestay & Tiket', count: currentApps.filter((a) => a.category === 'OPERASIONAL').length },
    { id: 'KEUANGAN', label: 'Keuangan (SIK-REP)', count: currentApps.filter((a) => a.category === 'KEUANGAN').length },
    { id: 'GUDANG_POS', label: 'POS Kasir & Gudang', count: currentApps.filter((a) => a.category === 'GUDANG_POS').length },
    { id: 'MEDIA_KREATIF', label: 'Media & Kreatif', count: currentApps.filter((a) => a.category === 'MEDIA_KREATIF').length },
  ];

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#07130f] papuan-pattern-overlay text-slate-100 selection:bg-amber-500 selection:text-black">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-amber-500/20 bg-[#081812]/95 backdrop-blur-md transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Brand Logo & Title */}
            <div className="flex items-center gap-3.5">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-amber-500/40 shadow-lg shadow-amber-950/40 flex items-center justify-center bg-[#0d281e]">
                <Image
                  src="/images/rep-logo.jpg"
                  alt="Logo Rumah Etnik Papua"
                  width={48}
                  height={48}
                  className="object-cover"
                  priority
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-xl tracking-wider text-amber-400">
                    PORTAL REP
                  </span>
                  <span className="text-[10px] uppercase font-extrabold tracking-widest px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-300 border border-emerald-500/40">
                    Pusat Sistem Staf
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium">
                  Yayasan Rumah Etnik Papua • Sorong, Papua Barat Daya
                </p>
              </div>
            </div>

            {/* Right Tools: Live Clock, PWA, Notices */}
            <div className="flex items-center gap-3">
              {/* Live WIT Clock */}
              <div className="hidden sm:flex items-center gap-2 bg-[#0d261d] px-3.5 py-2 rounded-xl border border-emerald-500/25 text-xs text-slate-300 shadow-inner">
                <Clock className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                <div suppressHydrationWarning>
                  <span className="font-bold text-amber-400">{timeWIT || '00:00:00'} WIT</span>
                  <span className="text-[10px] text-slate-400 ml-1.5">{dateWIT}</span>
                </div>
              </div>

              {/* Notice Quick Button */}
              <Link
                href="/dashboard/notices"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all shadow-sm"
                title="Papan Pengumuman Yayasan"
              >
                <Bell className="w-4 h-4 text-amber-400" />
                <span className="hidden md:inline">Pengumuman</span>
                {currentNotices.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-black font-bold text-[10px] flex items-center justify-center">
                    {currentNotices.length}
                  </span>
                )}
              </Link>

              {/* PWA Install Button */}
              <button
                onClick={() => setPwaModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all shadow-sm"
                title="Pasang Aplikasi di HP / Desktop"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Pasang PWA</span>
              </button>

              {/* Admin Link */}
              <Link
                href="/dashboard/admin"
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>Admin</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Banner Hero */}
        <div className="relative rounded-3xl overflow-hidden border border-amber-500/30 shadow-2xl bg-gradient-to-r from-[#0d2a20] via-[#0b2118] to-[#071711] p-6 sm:p-10 mb-8">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-400 text-xs font-bold mb-3.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gerbang Terpadu Ekosistem Yayasan Rumah Etnik Papua</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Pilih & Buka Aplikasi Langsung
            </h1>

            <p className="text-slate-300 text-sm sm:text-base mt-2.5 leading-relaxed">
              Klik salah satu kotak aplikasi di bawah untuk langsung membuka sistem kerja yang Anda butuhkan di tab baru. Verifikasi login dilakukan langsung pada masing-masing aplikasi.
            </p>
          </div>
        </div>

        {/* Search & Category Filter Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400/70" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari sistem / modul..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0a1e16] border border-amber-500/25 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all shadow-inner"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-950/50 scale-102 border border-amber-400/40'
                    : 'bg-[#0a1f17] text-slate-300 hover:text-white hover:bg-emerald-900/40 border border-amber-500/15'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedCategory === cat.id
                      ? 'bg-black/30 text-amber-200'
                      : 'bg-black/20 text-slate-400'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* BIG-GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-12">
          {filteredApps.map((app) => {
            const IconComponent = ICON_MAP[app.iconName] || Layers;
            const isCopied = copiedAppId === app.id;

            return (
              <div
                key={app.id}
                className="group relative rounded-3xl glass-panel overflow-hidden border-2 border-amber-500/25 hover:border-amber-400/70 bg-gradient-to-b from-[#0e291e]/95 to-[#081812]/95 shadow-2xl hover:shadow-amber-950/50 transition-all duration-300 flex flex-col justify-between"
              >
                <PapuanBorderCorner />

                <div className="p-6 sm:p-8 pb-4 relative z-10">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div
                      className={`w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${app.colorTheme.from} ${app.colorTheme.to} flex items-center justify-center shadow-xl shadow-black/50 border-2 border-amber-400/40 group-hover:scale-105 group-hover:border-amber-300 transition-transform duration-300 shrink-0`}
                    >
                      <IconComponent className="w-9 h-9 sm:w-10 sm:h-10 text-amber-200" />
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 shadow-sm">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        LIVE ONLINE
                      </span>
                      <span className="text-[11px] font-bold text-amber-300 bg-amber-950/70 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
                        {app.badgeText}
                      </span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black tracking-widest text-amber-400 uppercase">
                        {app.shortCode}
                      </span>
                      <span className="text-[11px] text-slate-400">• Vercel Production</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-amber-300 transition-colors mt-1 leading-snug">
                      {app.title}
                    </h2>
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed line-clamp-3 mb-4">
                    {app.fullDetails || app.description}
                  </p>

                  {app.stats && (
                    <div className="py-2.5 px-3.5 rounded-xl bg-[#06160f]/80 border border-amber-500/15 flex items-center gap-2 text-xs text-slate-300">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="truncate font-medium">{app.stats}</span>
                    </div>
                  )}
                </div>

                <div className="p-6 pt-3 bg-[#06140e]/95 border-t border-amber-500/20 relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleCopyLink(e, app.id, app.url)}
                      className="px-3 py-2 rounded-xl bg-[#0c241b] hover:bg-[#123528] text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 border border-amber-500/20 transition-all cursor-pointer"
                      title="Salin Tautan Aplikasi"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-300 font-bold">Disalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-amber-400" />
                          <span>Salin Link</span>
                        </>
                      )}
                    </button>
                    <span className="text-[11px] font-mono text-slate-400 truncate max-w-[140px] sm:max-w-[160px]">
                      {app.url.replace('https://', '')}
                    </span>
                  </div>

                  <a
                    href={app.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleLaunchClick}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-white text-sm font-extrabold shadow-xl shadow-amber-950/70 hover:shadow-amber-600/40 transition-all active:scale-95 cursor-pointer border border-amber-400/40 text-center"
                  >
                    <span>Buka Sistem Sekarang</span>
                    <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Bulletin Board */}
        <div className="rounded-3xl glass-panel bg-[#091e16]/80 border border-amber-500/20 p-6 sm:p-8 mb-8">
          <div className="flex items-center justify-between gap-4 mb-5 border-b border-amber-500/15 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Papan Pengumuman Internal Staf</h3>
                <p className="text-xs text-slate-400">Informasi & instruksi resmi dari Pengurus Yayasan REP</p>
              </div>
            </div>
            <Link
              href="/dashboard/notices"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 underline underline-offset-4"
            >
              Lihat Semua ({currentNotices.length})
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentNotices.slice(0, 2).map((notice) => (
              <div
                key={notice.id}
                onClick={() => setSelectedNotice(notice)}
                className="p-4 rounded-2xl bg-[#06140e] border border-amber-500/15 hover:border-amber-400/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/30">
                    {notice.category}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(notice.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2">
                  {notice.title}
                </h4>
                <p className="text-xs text-slate-300 line-clamp-2 mt-1.5">
                  {notice.content}
                </p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                  <span>Oleh: <strong className="text-slate-200">{notice.authorName}</strong></span>
                  <span className="text-amber-400 font-semibold group-hover:underline">Baca Selengkapnya ➔</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-amber-500/20 bg-[#06130e] py-6 px-4 text-center text-xs text-slate-400">
        <PapuanMotifDivider />
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
          <p>© {new Date().getFullYear()} Yayasan Rumah Etnik Papua • Sorong, Papua Barat Daya</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>IT Helpdesk: <strong>Ridwan Elly</strong></span>
            <span>•</span>
            <span>Pusat Operasional Terpadu</span>
          </div>
        </div>
      </footer>

      {/* Notice Detail Modal */}
      {selectedNotice && (
        <NoticeDetailModal
          notice={selectedNotice}
          onClose={() => setSelectedNotice(null)}
        />
      )}

      {/* PWA Install Modal */}
      <PWAInstallModal isOpen={pwaModalOpen} onClose={() => setPwaModalOpen(false)} />
    </div>
  );
}
