'use client';

import React, { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getAllExecutiveMetrics, getAppsList } from '@/lib/storage';
import { INITIAL_EXECUTIVE_METRICS, INITIAL_APPS } from '@/lib/seed-data';
import { ExecutiveMetrics, MetricsPeriod, AppItem } from '@/lib/types';
import Navbar from '@/components/Navbar';
import PWAInstallModal from '@/components/PWAInstallModal';
import PWAInstallBanner from '@/components/PWAInstallBanner';
import { PapuanBorderCorner } from '@/components/PapuanMotif';
import { formatRupiah } from '@/components/ExecutiveOverviewWidget';
import confetti from 'canvas-confetti';
import {
  TrendingUp,
  BedDouble,
  Wallet,
  Store,
  Film,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  BarChart3,
  Calendar,
  Building,
  Users,
  Clock,
  Printer,
  Share2,
  RefreshCw,
  ArrowUpRight,
  CheckCircle2,
  Lock,
  Layers,
  HardDrive
} from 'lucide-react';

let cachedAllMetrics: Record<MetricsPeriod, ExecutiveMetrics> = INITIAL_EXECUTIVE_METRICS;

function subscribeStorage(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  cachedAllMetrics = getAllExecutiveMetrics();

  const handler = () => {
    cachedAllMetrics = getAllExecutiveMetrics();
    callback();
  };

  window.addEventListener('portal_rep_storage_update', handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('portal_rep_storage_update', handler);
    window.removeEventListener('storage', handler);
  };
}

const getMetricsSnapshot = () => (typeof window !== 'undefined' ? cachedAllMetrics : INITIAL_EXECUTIVE_METRICS);
const getServerSnapshot = () => INITIAL_EXECUTIVE_METRICS;

export default function ExecutiveDashboardPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<MetricsPeriod>('TODAY');
  const [pwaModalOpen, setPwaModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const apps = typeof window !== 'undefined' ? getAppsList() : INITIAL_APPS;

  const allMetrics = useSyncExternalStore(
    subscribeStorage,
    getMetricsSnapshot,
    getServerSnapshot
  );

  const currentMetrics = (allMetrics && allMetrics[period]) ? allMetrics[period] : INITIAL_EXECUTIVE_METRICS[period];

  const handleRefresh = () => {
    setRefreshing(true);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('portal_rep_storage_update', { detail: { key: 'METRICS' } }));
      confetti({ particleCount: 20, spread: 40, origin: { y: 0.6 } });
    }
    setTimeout(() => setRefreshing(false), 500);
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const createWhatsAppBroadcast = () => {
    const periodText =
      period === 'TODAY' ? 'HARI INI' : period === 'THIS_WEEK' ? 'PEKAN INI' : 'BULAN INI';

    const text = `*📊 LAPORAN KINERJA EKSEKUTIF - YAYASAN RUMAH ETNIK PAPUA*\n_Periode: ${periodText}_\n\n🏡 *1. RESERVASI HOMESTAY & WISATA*\n• Okupansi: ${currentMetrics.reservasi.occupancyRate}% (${currentMetrics.reservasi.occupiedHomestay}/${currentMetrics.reservasi.totalHomestay} Kamar)\n• Tamu Menginap: ${currentMetrics.reservasi.activeGuestsToday} Orang\n• Tiket Wisata Terjual: ${currentMetrics.reservasi.totalTicketsSold} Tiket\n• Estimasi Pendapatan: ${formatRupiah(currentMetrics.reservasi.revenueEstimated)}\n\n💰 *2. KEUANGAN SIK-REP*\n• Saldo Kas Yayasan: ${formatRupiah(currentMetrics.keuangan.totalCashBalance)}\n• Pemasukan: ${formatRupiah(currentMetrics.keuangan.monthlyIncome)}\n• Pengeluaran: ${formatRupiah(currentMetrics.keuangan.monthlyExpense)}\n• Arus Kas Bersih: ${formatRupiah(currentMetrics.keuangan.netCashFlow)}\n\n🛍️ *3. POS YASWAR CAFE & GUDANG OMG*\n• Omset Kasir: ${formatRupiah(currentMetrics.posGudang.dailySalesVolume)}\n• Total Transaksi: ${currentMetrics.posGudang.dailyTransactionsCount} Struk\n• Menu Terlaris: ${currentMetrics.posGudang.popularItemToday}\n• Alert Stok Menipis: ${currentMetrics.posGudang.lowStockAlerts.length} Item\n\n📸 *4. ZEEY STUDIO (MEDIA & ASET BUDAYA)*\n• Total Aset Media: ${currentMetrics.zeeyStudio.totalMediaAssets} File (${currentMetrics.zeeyStudio.culturalVideosCount} Video / ${currentMetrics.zeeyStudio.highResPhotosCount} Foto)\n• Cloud Storage: ${currentMetrics.zeeyStudio.cloudStorageUsedGb} GB / ${currentMetrics.zeeyStudio.totalCloudStorageGb} GB\n\n_Disinkronkan dari PORTAL REP (Sorong, Papua Barat Daya)_`;

    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  };

  // Find sub-app links for direct jump with safe fallbacks
  const homestayApp =
    apps.find((a) => a.id === 'app-reservasi') ||
    apps[0] || {
      url: 'https://apk-reservasi-homestay-rep.vercel.app',
    };
  const sikApp =
    apps.find((a) => a.id === 'app-sik-rep') ||
    apps[1] || {
      url: 'https://sistem-informasi-keuangan-rep.vercel.app',
    };
  const posApp =
    apps.find((a) => a.id === 'app-pos-omg') ||
    apps[2] || {
      url: 'https://rep-pos-app.vercel.app',
    };
  const zeeyApp =
    apps.find((a) => a.id === 'app-zeestudio') ||
    apps[3] || {
      url: 'https://zeeystudio.vercel.app',
    };

  const totalEstimatedRevenue =
    currentMetrics.reservasi.revenueEstimated + currentMetrics.posGudang.dailySalesVolume;

  return (
    <div className="relative min-h-screen flex flex-col bg-[#f6f4ee] dark:bg-[#07130f] text-stone-900 dark:text-slate-100 selection:bg-amber-500 selection:text-black">
      {/* Top Navbar */}
      <Navbar onOpenPwaModal={() => setPwaModalOpen(true)} hideHeaderOnHome={false} />

      {/* Botanical Dark Forest Green Header with Gold Accents */}
      <div className="relative w-full bg-gradient-to-b from-[#113527] via-[#103325] to-[#0d2a1f] text-white pt-8 pb-12 px-4 sm:px-6 lg:px-8 border-b border-amber-500/20 shadow-xl overflow-hidden print:bg-white print:text-black">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#e5a93c_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <PapuanBorderCorner position="top-right" />
        <PapuanBorderCorner position="bottom-left" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>SINGLE PANE OF GLASS • EXECUTIVE METRICS DASHBOARD</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-serif text-white tracking-tight leading-tight">
              Unified Metrics Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Pusat pantauan terpadu kinerja operasional, arus kas keuangan, okupansi kamar homestay, penjualan kasir cafe/suvenir, dan aset media kebudayaan Yayasan Rumah Etnik Papua.
            </p>
          </div>

          {/* Action Header: Period Selector, Print, WhatsApp & Refresh */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            {/* Period Switcher */}
            <div className="flex items-center bg-[#06140e] p-1 rounded-2xl border border-amber-500/30 text-xs font-bold">
              <button
                type="button"
                onClick={() => setPeriod('TODAY')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  period === 'TODAY'
                    ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => setPeriod('THIS_WEEK')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  period === 'THIS_WEEK'
                    ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Pekan Ini
              </button>
              <button
                type="button"
                onClick={() => setPeriod('THIS_MONTH')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  period === 'THIS_MONTH'
                    ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Bulan Ini
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              className={`p-2.5 rounded-2xl bg-[#091f17] hover:bg-[#0e2c20] border border-amber-500/30 text-amber-300 hover:text-white transition-all cursor-pointer ${
                refreshing ? 'animate-spin text-amber-400' : ''
              }`}
              title="Perbarui Data Metrik"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Broadcast WhatsApp Button */}
            <a
              href={createWhatsAppBroadcast()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-md transition-all active:scale-95"
              title="Bagikan Ringkasan Laporan ke WhatsApp Pimpinan"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Kirim ke WA</span>
            </a>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-[#091f17] hover:bg-[#0e2c20] border border-amber-500/30 text-amber-300 hover:text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              title="Cetak Laporan PDF"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Cetak Laporan</span>
            </button>
          </div>
        </div>

        {/* Quick Executive Stats Strip */}
        <div className="max-w-7xl mx-auto mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
          <div className="p-3 rounded-2xl bg-[#0a241b]/80 border border-emerald-500/20 backdrop-blur-sm">
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">🌿 Kesehatan Sistem</p>
            <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{currentMetrics.operasional.systemHealthScore}% <span className="text-xs font-normal text-emerald-300">Optimal</span></p>
          </div>
          <div className="p-3 rounded-2xl bg-[#0a241b]/80 border border-amber-500/20 backdrop-blur-sm">
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">👥 Staf Bertugas</p>
            <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{currentMetrics.operasional.activeStaffOnDuty} <span className="text-xs font-normal text-slate-300">Personil</span></p>
          </div>
          <div className="p-3 rounded-2xl bg-[#0a241b]/80 border border-teal-500/20 backdrop-blur-sm">
            <p className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">🏷️ Tiket & Pengunjung</p>
            <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{currentMetrics.reservasi.totalTicketsSold} <span className="text-xs font-normal text-slate-300">Wisatawan</span></p>
          </div>
          <div className="p-3 rounded-2xl bg-[#0a241b]/80 border border-indigo-500/20 backdrop-blur-sm">
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">💳 Estimasi Bruto Terpadu</p>
            <p className="text-lg sm:text-xl font-black text-white mt-0.5 font-mono">{formatRupiah(totalEstimatedRevenue)}</p>
          </div>
        </div>
      </div>

      {/* Main Content: 4 Deep Dive Cards Grid */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 mb-safe-bottom space-y-6">
        {/* ROW 1: RESERVASI HOMESTAY & SIK-REP KEUANGAN */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CARD 1: SISTEM RESERVASI HOMESTAY & WISATA */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#091f17] border-2 border-amber-500/30 shadow-xl flex flex-col justify-between space-y-5 relative overflow-hidden">
            <PapuanBorderCorner position="top-right" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
                    <BedDouble className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-stone-900 dark:text-white font-serif">
                      Sistem Reservasi & Homestay Etnik
                    </h2>
                    <p className="text-xs text-stone-500 dark:text-slate-400">
                      Manajemen Kamar, Tamu Menginap & Tiket Wisata Budaya
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                  {currentMetrics.reservasi.trendGuests}
                </span>
              </div>

              {/* Occupancy Progress Bar */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#06140e] border border-amber-500/20 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-600 dark:text-amber-400 uppercase">
                    Tingkat Okupansi Kamar
                  </span>
                  <span className="font-black text-stone-900 dark:text-white font-mono text-sm">
                    {currentMetrics.reservasi.occupancyRate}%
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-stone-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 via-emerald-400 to-teal-400 rounded-full transition-all duration-500"
                    style={{ width: `${currentMetrics.reservasi.occupancyRate}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-stone-600 dark:text-slate-400 pt-1">
                  <span>Terisi: <strong>{currentMetrics.reservasi.occupiedHomestay} unit</strong></span>
                  <span>Tersedia: <strong>{currentMetrics.reservasi.totalHomestay - currentMetrics.reservasi.occupiedHomestay} unit</strong></span>
                  <span>Total Kapasitas: <strong>{currentMetrics.reservasi.totalHomestay} Kamar Etnik</strong></span>
                </div>
              </div>

              {/* Stats Grid 3 cols */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-2xl bg-stone-50 dark:bg-[#081a13] border border-emerald-500/20 text-center">
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Tamu Menginap</p>
                  <p className="text-lg font-black text-stone-900 dark:text-white mt-0.5">{currentMetrics.reservasi.activeGuestsToday}</p>
                  <p className="text-[9px] text-stone-500 dark:text-slate-400">Orang Aktif</p>
                </div>
                <div className="p-3 rounded-2xl bg-stone-50 dark:bg-[#081a13] border border-amber-500/20 text-center">
                  <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">Booking Berikutnya</p>
                  <p className="text-lg font-black text-stone-900 dark:text-white mt-0.5">{currentMetrics.reservasi.upcomingBookings}</p>
                  <p className="text-[9px] text-stone-500 dark:text-slate-400">Rombongan Terjadwal</p>
                </div>
                <div className="p-3 rounded-2xl bg-stone-50 dark:bg-[#081a13] border border-teal-500/20 text-center">
                  <p className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase">Tiket Terjual</p>
                  <p className="text-lg font-black text-stone-900 dark:text-white mt-0.5">{currentMetrics.reservasi.totalTicketsSold}</p>
                  <p className="text-[9px] text-stone-500 dark:text-slate-400">Pentas & Tur Budaya</p>
                </div>
              </div>
            </div>

            {/* Launch App Button */}
            <div className="pt-3 border-t border-stone-200 dark:border-amber-500/20 flex items-center justify-between">
              <span className="text-xs font-bold text-stone-600 dark:text-slate-300">
                Estimasi Nilai: <strong className="text-amber-600 dark:text-amber-400 font-mono">{formatRupiah(currentMetrics.reservasi.revenueEstimated)}</strong>
              </span>
              <a
                href={homestayApp?.url || 'https://apk-reservasi-homestay-rep.vercel.app'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold transition-all shadow-md active:scale-95"
              >
                <span>Buka Reservasi Homestay</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* CARD 2: SIK-REP KEUANGAN & ARUS KAS */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#091f17] border-2 border-emerald-500/30 shadow-xl flex flex-col justify-between space-y-5 relative overflow-hidden">
            <PapuanBorderCorner position="top-right" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-stone-900 dark:text-white font-serif">
                      SIK-REP (Sistem Informasi Keuangan)
                    </h2>
                    <p className="text-xs text-stone-500 dark:text-slate-400">
                      Saldo Kas Yayasan, Arus Kas & Otorisasi Pengeluaran
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                  {currentMetrics.keuangan.trendRevenue}
                </span>
              </div>

              {/* Total Cash Balance Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0d2a1f] to-[#06140e] border border-emerald-500/30 text-white space-y-1">
                <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                  Total Saldo Kas Berjalan Yayasan REP
                </p>
                <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
                  {formatRupiah(currentMetrics.keuangan.totalCashBalance)}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-300 pt-2 border-t border-emerald-500/20 mt-2">
                  <span className="flex items-center gap-1 text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Status Jurnal: Ter-Rekonsiliasi
                  </span>
                  <span className="text-amber-300">
                    Kasbon Pending: {currentMetrics.keuangan.pendingReimbursementsCount} pengajuan ({formatRupiah(currentMetrics.keuangan.pendingReimbursementTotal)})
                  </span>
                </div>
              </div>

              {/* Cash Flow Comparison */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-2xl bg-stone-50 dark:bg-[#081a13] border border-emerald-500/20">
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Penerimaan Kas</p>
                  <p className="text-sm sm:text-base font-black text-emerald-700 dark:text-emerald-300 font-mono mt-0.5">
                    {formatRupiah(currentMetrics.keuangan.monthlyIncome)}
                  </p>
                  <p className="text-[9px] text-stone-500 dark:text-slate-400">Termasuk homestay & donasi</p>
                </div>
                <div className="p-3 rounded-2xl bg-stone-50 dark:bg-[#081a13] border border-rose-500/20">
                  <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase">Pengeluaran Kas</p>
                  <p className="text-sm sm:text-base font-black text-rose-700 dark:text-rose-300 font-mono mt-0.5">
                    {formatRupiah(currentMetrics.keuangan.monthlyExpense)}
                  </p>
                  <p className="text-[9px] text-stone-500 dark:text-slate-400">Operasional & belanja</p>
                </div>
                <div className="p-3 rounded-2xl bg-stone-50 dark:bg-[#081a13] border border-teal-500/20">
                  <p className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase">Arus Kas Bersih</p>
                  <p className="text-sm sm:text-base font-black text-teal-700 dark:text-teal-300 font-mono mt-0.5">
                    {formatRupiah(currentMetrics.keuangan.netCashFlow)}
                  </p>
                  <p className="text-[9px] text-stone-500 dark:text-slate-400">Surplus Berjalan</p>
                </div>
              </div>
            </div>

            {/* Launch App Button */}
            <div className="pt-3 border-t border-stone-200 dark:border-emerald-500/20 flex items-center justify-between">
              <span className="text-xs text-stone-600 dark:text-slate-300">
                Otorisasi Bendahara & Pimpinan Aktif
              </span>
              <a
                href={sikApp?.url || 'https://sistem-informasi-keuangan-rep.vercel.app'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-bold transition-all shadow-md active:scale-95"
              >
                <span>Buka Modul SIK-REP</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* ROW 2: POS YASWAR CAFE & GUDANG OMG + ZEEY STUDIO MEDIA */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CARD 3: POS YASWAR CAFE & GUDANG SUVENIR OMG */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#091f17] border-2 border-teal-500/30 shadow-xl flex flex-col justify-between space-y-5 relative overflow-hidden">
            <PapuanBorderCorner position="top-right" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/40 flex items-center justify-center">
                    <Store className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-stone-900 dark:text-white font-serif">
                      POS Kasir Yaswar & Gudang (OMG)
                    </h2>
                    <p className="text-xs text-stone-500 dark:text-slate-400">
                      Penjualan Kuliner Etnik, Suvenir Ukiran & Manajemen Stok
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-teal-950 text-teal-300 border border-teal-500/40">
                  {currentMetrics.posGudang.trendSales}
                </span>
              </div>

              {/* Sales Volume & Transactions */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#06140e] border border-teal-500/20 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                    Volume Penjualan Kasir
                  </p>
                  <p className="text-2xl font-black font-mono text-stone-900 dark:text-white mt-0.5">
                    {formatRupiah(currentMetrics.posGudang.dailySalesVolume)}
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5">
                    Terdaftar {currentMetrics.posGudang.dailyTransactionsCount} Struk Transaksi Kasir
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                    Shift 2 Aktif
                  </span>
                  <p className="text-[10px] text-stone-500 dark:text-slate-400 mt-2">
                    Item Favorit: <br />
                    <strong className="text-stone-800 dark:text-amber-300 font-semibold">{currentMetrics.posGudang.popularItemToday}</strong>
                  </p>
                </div>
              </div>

              {/* Low Stock Alert Table */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    Peringatan Stok Suvenir Menipis (Gudang OMG)
                  </span>
                  <span className="text-[11px] text-stone-500 dark:text-slate-400">
                    {currentMetrics.posGudang.lowStockAlerts.length} Item Perlu Restok
                  </span>
                </div>
                <div className="rounded-2xl border border-stone-200 dark:border-amber-500/20 overflow-hidden bg-stone-50 dark:bg-[#081a13]">
                  {currentMetrics.posGudang.lowStockAlerts.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 flex items-center justify-between text-xs border-b border-stone-200 dark:border-slate-800/80 last:border-0"
                    >
                      <div>
                        <p className="font-bold text-stone-900 dark:text-white">{item.itemName}</p>
                        <p className="text-[10px] text-stone-500 dark:text-slate-400">{item.category}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">
                          Sisa {item.currentStock} {item.unit}
                        </span>
                        <p className="text-[9px] text-stone-400 dark:text-slate-500">Min: {item.minThreshold} {item.unit}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Launch App Button */}
            <div className="pt-3 border-t border-stone-200 dark:border-teal-500/20 flex items-center justify-between">
              <span className="text-xs text-stone-600 dark:text-slate-300">
                Total Monitor: {currentMetrics.posGudang.totalMonitoredItems} Produk
              </span>
              <a
                href={posApp?.url || 'https://rep-pos-app.vercel.app'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-500 hover:to-emerald-600 text-white text-xs font-bold transition-all shadow-md active:scale-95"
              >
                <span>Buka POS & Gudang</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* CARD 4: ZEEY STUDIO MEDIA & DOKUMENTASI BUDAYA */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#091f17] border-2 border-indigo-500/30 shadow-xl flex flex-col justify-between space-y-5 relative overflow-hidden">
            <PapuanBorderCorner position="top-right" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center">
                    <Film className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-stone-900 dark:text-white font-serif">
                      Zeey Studio (Media & Kreatif)
                    </h2>
                    <p className="text-xs text-stone-500 dark:text-slate-400">
                      Dokumentasi Budaya Papua, Video Tari & Manajemen Cloud Media
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/40">
                  +{currentMetrics.zeeyStudio.newAssetsThisWeek} Berkas Pekan Ini
                </span>
              </div>

              {/* Cloud Storage Meter */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#06140e] border border-indigo-500/20 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
                    Kapasitas Google Drive Cloud Media
                  </span>
                  <span className="font-black text-stone-900 dark:text-white font-mono text-sm">
                    {currentMetrics.zeeyStudio.cloudStorageUsedGb} / {currentMetrics.zeeyStudio.totalCloudStorageGb} GB
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-stone-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-400 rounded-full transition-all duration-500"
                    style={{
                      width: `${(currentMetrics.zeeyStudio.cloudStorageUsedGb / currentMetrics.zeeyStudio.totalCloudStorageGb) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-stone-600 dark:text-slate-400 pt-1">
                  <span>Foto Resolusi Tinggi: <strong>{currentMetrics.zeeyStudio.highResPhotosCount}</strong></span>
                  <span>Video Dokumenter Budaya: <strong>{currentMetrics.zeeyStudio.culturalVideosCount}</strong></span>
                </div>
              </div>

              {/* Latest Upload Box */}
              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-[#081a13] border border-indigo-500/20">
                <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Unggahan Terakhir:
                </p>
                <p className="text-xs font-bold text-stone-900 dark:text-white mt-1 leading-snug">
                  {currentMetrics.zeeyStudio.latestUploadTitle}
                </p>
                <p className="text-[10px] text-stone-500 dark:text-slate-400 mt-1">
                  Total {currentMetrics.zeeyStudio.totalMediaAssets} Aset Digital Terkatalog
                </p>
              </div>
            </div>

            {/* Launch App Button */}
            <div className="pt-3 border-t border-stone-200 dark:border-indigo-500/20 flex items-center justify-between">
              <span className="text-xs text-stone-600 dark:text-slate-300">
                CDN Cloud Terhubung
              </span>
              <a
                href={zeeyApp?.url || 'https://zeeystudio.vercel.app'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white text-xs font-bold transition-all shadow-md active:scale-95"
              >
                <span>Buka Zeey Studio</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* PWA Modal & Banner */}
      <PWAInstallModal isOpen={pwaModalOpen} onClose={() => setPwaModalOpen(false)} />
      <PWAInstallBanner onOpenModal={() => setPwaModalOpen(true)} />
    </div>
  );
}
