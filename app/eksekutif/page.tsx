'use client';

import React, { useState } from 'react';
import { getAppsList } from '@/lib/storage';
import { useLiveMetrics, hasData } from '@/lib/live-metrics';
import { SourceBadge, SourceOverlay } from '@/components/SourceStatus';
import { SOURCE_LABELS } from '@/lib/integration-contract';
import { INITIAL_APPS } from '@/lib/seed-data';
import { MetricsPeriod } from '@/lib/types';
import Navbar from '@/components/Navbar';
import RoleGuard from '@/components/RoleGuard';
import { PapuanBorderCorner } from '@/components/PapuanMotif';
import { formatRupiah } from '@/components/ExecutiveOverviewWidget';
import { Bento, BentoCard, CardTitle, Stat } from '@/components/ui/Bento';
import {
  BedDouble,
  Wallet,
  Store,
  Film,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Printer,
  Share2,
  RefreshCw,
  CheckCircle2,
  HardDrive
} from 'lucide-react';

export default function ExecutiveDashboardPage() {
  return (
    <RoleGuard allow={['IT_ADMIN', 'EXECUTIVE']} pageName="Dasbor Eksekutif" returnTo="/eksekutif">
      <ExecutiveDashboardContent />
    </RoleGuard>
  );
}

function ExecutiveDashboardContent() {
  const [period, setPeriod] = useState<MetricsPeriod>('TODAY');

  const apps = typeof window !== 'undefined' ? getAppsList() : INITIAL_APPS;

  // Data asli dari sub-aplikasi via /api/metrics (atau data contoh berlabel di mode demo).
  const live = useLiveMetrics(period);
  const currentMetrics = live.metrics;
  const sources = live.sources;
  const refreshing = live.loading;

  const handleRefresh = () => {
    live.refresh();
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const createWhatsAppBroadcast = () => {
    const periodText =
      period === 'TODAY' ? 'HARI INI' : period === 'THIS_WEEK' ? 'PEKAN INI' : 'BULAN INI';

    const m = currentMetrics;
    const off = (key: keyof typeof sources) => `• _${SOURCE_LABELS[key]} belum terhubung ke portal_\n`;
    const text =
      `*📊 LAPORAN KINERJA EKSEKUTIF - YAYASAN RUMAH ETNIK PAPUA*\n_Periode: ${periodText}_\n\n` +
      `🏡 *1. RESERVASI HOMESTAY & WISATA*\n` +
      (hasData(sources.reservasi)
        ? `• Okupansi: ${m.reservasi.occupancyRate}% (${m.reservasi.occupiedHomestay}/${m.reservasi.totalHomestay} Kamar)\n• Tamu Menginap: ${m.reservasi.activeGuestsToday} Orang\n• Tiket Wisata Terjual: ${m.reservasi.totalTicketsSold} Tiket\n• Estimasi Pendapatan: ${formatRupiah(m.reservasi.revenueEstimated)}\n`
        : off('reservasi')) +
      `\n💰 *2. KEUANGAN SIK-REP*\n` +
      (hasData(sources.keuangan)
        ? `• Saldo Kas Yayasan: ${formatRupiah(m.keuangan.totalCashBalance)}\n• Pemasukan: ${formatRupiah(m.keuangan.monthlyIncome)}\n• Pengeluaran: ${formatRupiah(m.keuangan.monthlyExpense)}\n• Arus Kas Bersih: ${formatRupiah(m.keuangan.netCashFlow)}\n`
        : off('keuangan')) +
      `\n🛍️ *3. POS YASWAR CAFE & GUDANG OMG*\n` +
      (hasData(sources.posGudang)
        ? `• Omset Kasir: ${formatRupiah(m.posGudang.dailySalesVolume)}\n• Total Transaksi: ${m.posGudang.dailyTransactionsCount} Struk\n• Menu Terlaris: ${m.posGudang.popularItemToday}\n• Alert Stok Menipis: ${m.posGudang.lowStockAlerts.length} Item\n`
        : off('posGudang')) +
      `\n📸 *4. ZEEY STUDIO (MEDIA & ASET BUDAYA)*\n` +
      (hasData(sources.zeeyStudio)
        ? `• Total Aset Media: ${m.zeeyStudio.totalMediaAssets} File (${m.zeeyStudio.culturalVideosCount} Video / ${m.zeeyStudio.highResPhotosCount} Foto)\n• Cloud Storage: ${m.zeeyStudio.cloudStorageUsedGb} GB / ${m.zeeyStudio.totalCloudStorageGb} GB\n`
        : off('zeeyStudio')) +
      (Object.values(sources).some((x) => x.status === 'DEMO') ? `\n⚠️ _Catatan: angka di atas adalah DATA CONTOH (mode demo)._\n` : '') +
      `\n_Disinkronkan dari PORTAL REP (Sorong, Papua Barat Daya)_`;

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
    apps.find((a) => a.id === 'app-pos') ||
    apps.find((a) => a.id === 'app-pos-omg') ||
    apps[2] || {
      url: 'https://rep-pos-app.vercel.app',
    };
  const omgApp =
    apps.find((a) => a.id === 'app-omg') ||
    apps.find((a) => a.id === 'app-pos-omg') ||
    posApp;
  const zeeyApp =
    apps.find((a) => a.id === 'app-zeestudio') ||
    apps[3] || {
      url: 'https://zeeystudio.vercel.app',
    };

  const revenueSources = (['reservasi', 'posGudang'] as const).filter((k) => hasData(sources[k]));
  const totalEstimatedRevenue =
    (hasData(sources.reservasi) ? currentMetrics.reservasi.revenueEstimated : 0) +
    (hasData(sources.posGudang) ? currentMetrics.posGudang.dailySalesVolume : 0);

  return (
    <div className="dock-safe relative min-h-screen flex flex-col bg-[#f6f4ee] dark:bg-[#07130f] text-stone-900 dark:text-slate-100 selection:bg-amber-500 selection:text-black print:bg-white print:text-black">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-5 pb-6 flex-1 space-y-4 sm:space-y-5">
        {/* Kepala dasbor + angka ringkas sebagai bento */}
        <Bento>
          <BentoCard as="section" span="full" tone="forest" className="relative overflow-hidden print:!bg-white print:!text-black">
            <div
              aria-hidden
              className="absolute inset-0 opacity-10 bg-[radial-gradient(#e5a93c_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none print:hidden"
            />
            <PapuanBorderCorner position="top-right" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
              <div className="min-w-0 space-y-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30 text-[10px] font-extrabold uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3" />
                  Satu layar untuk semua sub-aplikasi
                </span>
                <h1 className="text-2xl sm:text-3xl font-black font-serif tracking-tight">Dasbor Eksekutif</h1>
                <p className="text-xs sm:text-sm text-emerald-100/80 max-w-2xl leading-relaxed">
                  Pantauan terpadu okupansi homestay, arus kas SIK-REP, penjualan kasir &amp; gudang, serta aset media
                  budaya Yayasan Rumah Etnik Papua.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap shrink-0 print:hidden">
                <div className="flex items-center gap-0.5 p-0.5 rounded-xl bg-black/30 border border-white/15 text-xs font-bold">
                  {(
                    [
                      ['TODAY', 'Hari Ini'],
                      ['THIS_WEEK', 'Pekan Ini'],
                      ['THIS_MONTH', 'Bulan Ini'],
                    ] as [MetricsPeriod, string][]
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPeriod(value)}
                      aria-pressed={period === value}
                      className={`px-2.5 h-9 rounded-lg transition-colors cursor-pointer ${
                        period === value ? 'bg-amber-500 text-slate-950 font-extrabold' : 'text-emerald-100/80 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleRefresh}
                  aria-label="Perbarui data metrik"
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-black/30 border border-white/15 text-amber-200 hover:text-white cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>

                <a
                  href={createWhatsAppBroadcast()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 px-3.5 flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                  title="Bagikan ringkasan laporan ke WhatsApp pimpinan"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Kirim ke WA</span>
                </a>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="h-10 px-3.5 flex items-center gap-1.5 rounded-xl bg-black/30 border border-white/15 text-amber-200 hover:text-white text-xs font-bold cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">Cetak</span>
                </button>
              </div>
            </div>
          </BentoCard>

          <BentoCard span="third">
            <Stat
              label="Kesehatan sistem"
              value={live.operasionalReady ? `${currentMetrics.operasional.systemHealthScore}%` : '—'}
              hint="Aplikasi terhubung ke portal"
            />
          </BentoCard>
          <BentoCard span="third">
            <Stat
              label="Staf aktif terdaftar"
              value={live.operasionalReady ? currentMetrics.operasional.activeStaffOnDuty : '—'}
              unit="personil"
            />
          </BentoCard>
          <BentoCard span="third">
            <Stat
              label="Tiket & pengunjung"
              value={hasData(sources.reservasi) ? currentMetrics.reservasi.totalTicketsSold : '—'}
              unit="wisatawan"
            />
          </BentoCard>
          <BentoCard span="thirdWide" tone="amber">
            <Stat
              label="Estimasi bruto terpadu"
              value={
                <span className="font-mono text-lg sm:text-xl">
                  {revenueSources.length ? formatRupiah(totalEstimatedRevenue) : '—'}
                </span>
              }
              hint="Reservasi + kasir, hanya sumber yang terhubung"
            />
          </BentoCard>
        </Bento>

        {/* Empat kartu rinci per sub-aplikasi */}
        <Bento>
          {/* 1. RESERVASI HOMESTAY & WISATA */}
          <BentoCard as="section" span="half" className="relative overflow-hidden flex flex-col gap-4">
            <SourceOverlay state={sources.reservasi} appName={SOURCE_LABELS.reservasi} />
            <div className="flex items-start justify-between gap-2">
              <SourceBadge state={sources.reservasi} />
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40">
                {currentMetrics.reservasi.trendGuests}
              </span>
            </div>

            <CardTitle
              icon={BedDouble}
              iconTone="bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
              eyebrow="Reservasi"
              title="Sistem Reservasi & Homestay Etnik"
            />
            <p className="-mt-2 text-xs text-stone-500 dark:text-slate-400">
              Manajemen kamar, tamu menginap &amp; tiket wisata budaya.
            </p>

            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase text-amber-700 dark:text-amber-400">Tingkat okupansi kamar</span>
                <span className="font-black font-mono text-sm tabular-nums">
                  {currentMetrics.reservasi.occupancyRate}%
                </span>
              </div>
              <div
                className="w-full h-3 rounded-full bg-stone-200 dark:bg-white/10 overflow-hidden"
                role="progressbar"
                aria-valuenow={currentMetrics.reservasi.occupancyRate}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-emerald-400 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${currentMetrics.reservasi.occupancyRate}%` }}
                />
              </div>
              <div className="flex items-center justify-between gap-2 text-[11px] text-stone-600 dark:text-slate-400 pt-0.5">
                <span>
                  Terisi <strong>{currentMetrics.reservasi.occupiedHomestay}</strong>
                </span>
                <span>
                  Tersedia{' '}
                  <strong>{currentMetrics.reservasi.totalHomestay - currentMetrics.reservasi.occupiedHomestay}</strong>
                </span>
                <span>
                  Kapasitas <strong>{currentMetrics.reservasi.totalHomestay}</strong>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {[
                ['Tamu menginap', currentMetrics.reservasi.activeGuestsToday, 'orang aktif'],
                ['Booking berikutnya', currentMetrics.reservasi.upcomingBookings, 'rombongan'],
                ['Tiket terjual', currentMetrics.reservasi.totalTicketsSold, 'pentas & tur'],
              ].map(([label, value, hint]) => (
                <div
                  key={label as string}
                  className="p-3 rounded-2xl bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-center"
                >
                  <p className="text-[10px] font-bold uppercase text-stone-500 dark:text-slate-400">{label}</p>
                  <p className="mt-0.5 text-lg font-black tabular-nums">{value}</p>
                  <p className="text-[9px] text-stone-500 dark:text-slate-400">{hint}</p>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-3 border-t border-stone-200 dark:border-white/10 flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs text-stone-600 dark:text-slate-300">
                Estimasi nilai:{' '}
                <strong className="font-mono text-amber-700 dark:text-amber-400">
                  {formatRupiah(currentMetrics.reservasi.revenueEstimated)}
                </strong>
              </span>
              <a
                href={homestayApp?.url || 'https://apk-reservasi-homestay-rep.vercel.app'}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 px-3.5 flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold print:hidden"
              >
                <span>Buka Reservasi</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </BentoCard>

          {/* 2. SIK-REP KEUANGAN */}
          <BentoCard as="section" span="half" className="relative overflow-hidden flex flex-col gap-4">
            <SourceOverlay state={sources.keuangan} appName={SOURCE_LABELS.keuangan} />
            <div className="flex items-start justify-between gap-2">
              <SourceBadge state={sources.keuangan} />
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40">
                {currentMetrics.keuangan.trendRevenue}
              </span>
            </div>

            <CardTitle
              icon={Wallet}
              iconTone="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
              eyebrow="Keuangan"
              title="SIK-REP (Sistem Informasi Keuangan)"
            />
            <p className="-mt-2 text-xs text-stone-500 dark:text-slate-400">
              Saldo kas yayasan, arus kas &amp; otorisasi pengeluaran.
            </p>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#123a2b] to-[#06140e] border border-emerald-500/30 text-white space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                Total saldo kas berjalan
              </p>
              <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight tabular-nums">
                {formatRupiah(currentMetrics.keuangan.totalCashBalance)}
              </p>
              <div className="mt-2 pt-2 border-t border-emerald-500/20 flex items-center justify-between gap-2 flex-wrap text-[11px] text-slate-300">
                <span className="flex items-center gap-1 text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  Jurnal ter-rekonsiliasi
                </span>
                <span className="text-amber-300">
                  Kasbon pending: {currentMetrics.keuangan.pendingReimbursementsCount} (
                  {formatRupiah(currentMetrics.keuangan.pendingReimbursementTotal)})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {[
                ['Penerimaan', currentMetrics.keuangan.monthlyIncome, 'text-emerald-700 dark:text-emerald-300', 'homestay & donasi'],
                ['Pengeluaran', currentMetrics.keuangan.monthlyExpense, 'text-rose-700 dark:text-rose-300', 'operasional'],
                ['Arus kas bersih', currentMetrics.keuangan.netCashFlow, 'text-teal-700 dark:text-teal-300', 'surplus berjalan'],
              ].map(([label, value, tone, hint]) => (
                <div
                  key={label as string}
                  className="p-3 rounded-2xl bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10"
                >
                  <p className="text-[10px] font-bold uppercase text-stone-500 dark:text-slate-400">{label}</p>
                  <p className={`mt-0.5 text-sm font-black font-mono tabular-nums ${tone}`}>
                    {formatRupiah(value as number)}
                  </p>
                  <p className="text-[9px] text-stone-500 dark:text-slate-400">{hint}</p>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-3 border-t border-stone-200 dark:border-white/10 flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs text-stone-600 dark:text-slate-300">Otorisasi bendahara &amp; pimpinan aktif</span>
              <a
                href={sikApp?.url || 'https://sistem-informasi-keuangan-rep.vercel.app'}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 px-3.5 flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold print:hidden"
              >
                <span>Buka SIK-REP</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </BentoCard>

          {/* 3. POS KASIR YASWAR & GUDANG OMG */}
          <BentoCard as="section" span="half" className="relative overflow-hidden flex flex-col gap-4">
            <SourceOverlay state={sources.posGudang} appName={SOURCE_LABELS.posGudang} />
            <div className="flex items-start justify-between gap-2">
              <SourceBadge state={sources.posGudang} />
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-300 dark:border-teal-500/40">
                {currentMetrics.posGudang.trendSales}
              </span>
            </div>

            <CardTitle
              icon={Store}
              iconTone="bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300"
              eyebrow="Kasir & gudang"
              title="POS Kasir Yaswar & Gudang (OMG)"
            />
            <p className="-mt-2 text-xs text-stone-500 dark:text-slate-400">
              Penjualan kuliner etnik, suvenir ukiran &amp; manajemen stok.
            </p>

            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                  Volume penjualan kasir
                </p>
                <p className="mt-0.5 text-2xl font-black font-mono tabular-nums">
                  {formatRupiah(currentMetrics.posGudang.dailySalesVolume)}
                </p>
                <p className="mt-0.5 text-[11px] text-stone-500 dark:text-slate-400">
                  {currentMetrics.posGudang.dailyTransactionsCount} struk transaksi
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40">
                  Shift 2 aktif
                </span>
                <p className="mt-2 text-[10px] text-stone-500 dark:text-slate-400">
                  Item favorit:
                  <br />
                  <strong className="font-semibold text-stone-800 dark:text-amber-300">
                    {currentMetrics.posGudang.popularItemToday}
                  </strong>
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 min-w-0">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Stok suvenir menipis (gudang OMG)</span>
                </span>
                <span className="text-[11px] text-stone-500 dark:text-slate-400 shrink-0">
                  {currentMetrics.posGudang.lowStockAlerts.length} item
                </span>
              </div>
              {currentMetrics.posGudang.lowStockAlerts.length > 0 ? (
                <ul className="rounded-2xl border border-stone-200 dark:border-white/10 overflow-hidden bg-stone-50 dark:bg-white/5">
                  {currentMetrics.posGudang.lowStockAlerts.map((item, idx) => (
                    <li
                      key={`${item.itemName}-${idx}`}
                      className="p-2.5 flex items-center justify-between gap-2 text-xs border-b border-stone-200 dark:border-white/10 last:border-0"
                    >
                      <span className="min-w-0">
                        <span className="block font-bold truncate">{item.itemName}</span>
                        <span className="block text-[10px] text-stone-500 dark:text-slate-400">{item.category}</span>
                      </span>
                      <span className="text-right shrink-0">
                        <span className="block font-bold font-mono text-rose-600 dark:text-rose-400">
                          Sisa {item.currentStock} {item.unit}
                        </span>
                        <span className="block text-[9px] text-stone-400 dark:text-slate-500">
                          Min {item.minThreshold} {item.unit}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="p-3 rounded-2xl bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-[11px] text-stone-500 dark:text-slate-400">
                  Tidak ada suvenir yang perlu restok.
                </p>
              )}
            </div>

            <div className="mt-auto pt-3 border-t border-stone-200 dark:border-white/10 flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs text-stone-600 dark:text-slate-300">
                {currentMetrics.posGudang.totalMonitoredItems} produk dipantau
              </span>
              <div className="flex items-center gap-2 print:hidden">
                <a
                  href={posApp?.url || 'https://rep-pos-app.vercel.app'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 px-3 flex items-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold"
                >
                  <span>Kasir (POS)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a
                  href={omgApp?.url || 'https://rep-pos-app.vercel.app'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 px-3 flex items-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold"
                >
                  <span>Gudang (OMG)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </BentoCard>

          {/* 4. ZEEY STUDIO MEDIA */}
          <BentoCard as="section" span="half" className="relative overflow-hidden flex flex-col gap-4">
            <SourceOverlay state={sources.zeeyStudio} appName={SOURCE_LABELS.zeeyStudio} />
            <div className="flex items-start justify-between gap-2">
              <SourceBadge state={sources.zeeyStudio} />
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/40">
                +{currentMetrics.zeeyStudio.newAssetsThisWeek} pekan ini
              </span>
            </div>

            <CardTitle
              icon={Film}
              iconTone="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
              eyebrow="Media & kreatif"
              title="Zeey Studio (Media & Kreatif)"
            />
            <p className="-mt-2 text-xs text-stone-500 dark:text-slate-400">
              Dokumentasi budaya Papua, video tari &amp; manajemen cloud media.
            </p>

            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-bold uppercase text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5 min-w-0">
                  <HardDrive className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Kapasitas cloud media</span>
                </span>
                <span className="font-black font-mono text-sm tabular-nums shrink-0">
                  {currentMetrics.zeeyStudio.cloudStorageUsedGb} / {currentMetrics.zeeyStudio.totalCloudStorageGb} GB
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-stone-200 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-400 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      currentMetrics.zeeyStudio.totalCloudStorageGb
                        ? (currentMetrics.zeeyStudio.cloudStorageUsedGb / currentMetrics.zeeyStudio.totalCloudStorageGb) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between gap-2 text-[11px] text-stone-600 dark:text-slate-400">
                <span>
                  Foto resolusi tinggi <strong>{currentMetrics.zeeyStudio.highResPhotosCount}</strong>
                </span>
                <span>
                  Video budaya <strong>{currentMetrics.zeeyStudio.culturalVideosCount}</strong>
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                Unggahan terakhir
              </p>
              <p className="mt-1 text-xs font-bold leading-snug">{currentMetrics.zeeyStudio.latestUploadTitle}</p>
              <p className="mt-1 text-[10px] text-stone-500 dark:text-slate-400">
                Total {currentMetrics.zeeyStudio.totalMediaAssets} aset digital terkatalog
              </p>
            </div>

            <div className="mt-auto pt-3 border-t border-stone-200 dark:border-white/10 flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs text-stone-600 dark:text-slate-300">CDN cloud terhubung</span>
              <a
                href={zeeyApp?.url || 'https://zeeystudio.vercel.app'}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 px-3.5 flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold print:hidden"
              >
                <span>Buka Zeey Studio</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </BentoCard>
        </Bento>
      </main>
    </div>
  );
}
