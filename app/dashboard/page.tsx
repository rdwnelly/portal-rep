'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getAppsList, getNotices } from '@/lib/storage';
import { AppItem, NoticeItem } from '@/lib/types';
import Navbar from '@/components/Navbar';
import AppCard from '@/components/AppCard';
import AppLauncherModal from '@/components/AppLauncherModal';
import NoticeBoardWidget from '@/components/NoticeBoardWidget';
import NoticeDetailModal from '@/components/NoticeDetailModal';
import CreateNoticeModal from '@/components/CreateNoticeModal';
import PWAInstallModal from '@/components/PWAInstallModal';
import Image from 'next/image';
import {
  Search,
  Sparkles,
  ShieldCheck,
  MapPin,
  Layers,
  UserCheck
} from 'lucide-react';

const subscribeClient = () => () => {};

export default function DashboardPage() {
  const { user, isInitialized } = useAuth();
  const isClient = useSyncExternalStore(subscribeClient, () => true, () => false);

  const [apps, setApps] = useState<AppItem[]>(() => (typeof window !== 'undefined' ? getAppsList() : []));
  const [notices, setNotices] = useState<NoticeItem[]>(() => (typeof window !== 'undefined' ? getNotices() : []));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modals state
  const [activeLaunchApp, setActiveLaunchApp] = useState<AppItem | null>(null);
  const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);
  const [createNoticeModalOpen, setCreateNoticeModalOpen] = useState(false);
  const [pwaModalOpen, setPwaModalOpen] = useState(false);

  useEffect(() => {
    const handleStorageUpdate = () => {
      setApps(getAppsList());
      setNotices(getNotices());
    };

    window.addEventListener('portal_rep_storage_update', handleStorageUpdate);
    return () => window.removeEventListener('portal_rep_storage_update', handleStorageUpdate);
  }, []);

  useEffect(() => {
    if (isInitialized && !user && typeof window !== 'undefined') {
      window.location.replace('/');
    }
  }, [isInitialized, user]);

  if (!isClient || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07130f] text-amber-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold tracking-wider">Memuat PORTAL REP...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

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

  const categories = [
    { id: 'ALL', label: 'Semua Aplikasi' },
    { id: 'OPERASIONAL', label: 'Reservasi & Wisata' },
    { id: 'KEUANGAN', label: 'Keuangan (SIK-REP)' },
    { id: 'GUDANG_POS', label: 'Kasir Cafe & Gudang' },
    { id: 'MEDIA_KREATIF', label: 'zeestudio Media' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#07130f] papuan-pattern-overlay text-slate-100 selection:bg-amber-500 selection:text-black">
      {/* Top Navbar */}
      <Navbar onOpenPwaModal={() => setPwaModalOpen(true)} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* Welcome Hero Banner */}
        <div className="relative rounded-3xl overflow-hidden glass-panel bg-gradient-to-r from-[#0e2a1f]/90 via-[#0b2118]/85 to-[#16382b]/90 border border-amber-500/25 p-6 sm:p-8 shadow-2xl">
          {/* Subtle Background Art */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20 pointer-events-none overflow-hidden hidden md:block">
            <Image
              src="/images/papua-banner.jpg"
              alt="Budaya Papua"
              fill
              className="object-cover object-right"
            />
          </div>

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/70 border border-amber-500/30 text-[11px] font-bold text-amber-300 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Pusat Layanan Terpadu Yayasan Rumah Etnik Papua</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-2">
              Selamat Datang, <span className="text-amber-400">{user.displayName}</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
              Akses cepat seluruh modul operasional, reservasi homestay, pembukuan kas SIK-REP, kasir Yaswar Cafe, dan arsip kreatif zeestudio dalam satu pintu masuk aman.
            </p>

            {/* Quick Stats Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#091b14]/80 border border-amber-500/15 flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400">Total Modul</p>
                  <p className="font-bold text-white text-xs">4 Aplikasi Aktif</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#091b14]/80 border border-emerald-500/15 flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400">Proteksi Akses</p>
                  <p className="font-bold text-emerald-300 text-xs">SSO & Whitelist</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#091b14]/80 border border-amber-500/15 flex items-center gap-2.5">
                <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400">Hak Akses Anda</p>
                  <p className="font-bold text-amber-300 text-xs">{user.roleTitle}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#091b14]/80 border border-teal-500/15 flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-teal-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400">Lokasi Utama</p>
                  <p className="font-bold text-white text-xs truncate">Sorong, Papua B.D.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md shadow-amber-950/50'
                    : 'bg-[#091e17] text-slate-400 hover:text-white hover:bg-[#0e2c20] border border-amber-500/15'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari modul atau layanan..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#091e17] border border-amber-500/20 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-all"
            />
          </div>
        </div>

        {/* Section 1: Dashboard App Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-6 bg-amber-500 rounded-full" />
              <h2 className="text-lg font-extrabold text-white tracking-wide">
                Katalog Aplikasi Inti (App Hub)
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Menampilkan {filteredApps.length} dari {currentApps.length} aplikasi
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredApps.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                userRole={user.role}
                onLaunch={(item) => setActiveLaunchApp(item)}
              />
            ))}
          </div>
        </section>

        {/* Section 2: Real-time Notice Board Widget */}
        <section className="pt-4">
          <NoticeBoardWidget
            notices={currentNotices}
            user={user}
            onSelectNotice={(item) => setSelectedNotice(item)}
            onOpenCreateModal={() => setCreateNoticeModalOpen(true)}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-amber-500/15 bg-[#081812] px-4 sm:px-8 py-5 mt-12 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>
          © 2026 <strong>Yayasan Rumah Etnik Papua</strong> • Sorong, Papua Barat Daya
        </p>
        <p className="text-amber-400/80">
          PORTAL REP Single Sign-On • IT Developer: <strong>Ridwan Elly</strong>
        </p>
      </footer>

      {/* Modals */}
      <AppLauncherModal
        app={activeLaunchApp}
        user={user}
        onClose={() => setActiveLaunchApp(null)}
      />

      <NoticeDetailModal
        notice={selectedNotice}
        onClose={() => setSelectedNotice(null)}
      />

      {createNoticeModalOpen && (
        <CreateNoticeModal
          user={user}
          onClose={() => setCreateNoticeModalOpen(false)}
          onNoticeCreated={(newNotice) => {
            setNotices((prev) => [newNotice, ...prev]);
          }}
        />
      )}

      <PWAInstallModal
        isOpen={pwaModalOpen}
        onClose={() => setPwaModalOpen(false)}
      />
    </div>
  );
}
