'use client';

import React, { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { getAllExecutiveMetrics } from '@/lib/storage';
import { INITIAL_EXECUTIVE_METRICS } from '@/lib/seed-data';
import { ExecutiveMetrics, MetricsPeriod } from '@/lib/types';
import {
  TrendingUp,
  BedDouble,
  Wallet,
  Store,
  Film,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  BarChart3
} from 'lucide-react';
import { PapuanBorderCorner } from '@/components/PapuanMotif';

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

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ExecutiveOverviewWidget() {
  const [period, setPeriod] = useState<MetricsPeriod>('TODAY');

  const allMetrics = useSyncExternalStore(
    subscribeStorage,
    getMetricsSnapshot,
    getServerSnapshot
  );

  const currentMetrics = (allMetrics && allMetrics[period]) ? allMetrics[period] : INITIAL_EXECUTIVE_METRICS[period];

  return (
    <div className="rounded-3xl bg-gradient-to-b from-[#091f17] via-[#0b241b] to-[#071711] border-2 border-amber-500/30 text-white p-5 sm:p-6 shadow-2xl relative overflow-hidden">
      <PapuanBorderCorner position="top-right" />
      <PapuanBorderCorner position="bottom-left" />

      {/* Header Widget */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-500/20 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/40">
                PIMPINAN & EKSEKUTIF
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-white font-serif mt-0.5">
              Denyut Operasional Terpadu (4 Aplikasi)
            </h3>
          </div>
        </div>

        {/* Period Selector & Link Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center bg-[#06140e] p-1 rounded-xl border border-amber-500/25 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setPeriod('TODAY')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                period === 'TODAY'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => setPeriod('THIS_MONTH')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                period === 'THIS_MONTH'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Bulan Ini
            </button>
          </div>

          <Link
            href="/eksekutif"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-extrabold shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <span>Selengkapnya</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 4 Pillars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4 relative z-10">
        {/* Pillar 1: Reservasi Homestay */}
        <div className="p-3.5 rounded-2xl bg-[#081a13] border border-amber-500/20 flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <BedDouble className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wide">
                Homestay
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">
              {currentMetrics.reservasi.trendGuests}
            </span>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-black text-white font-serif">
                {currentMetrics.reservasi.occupancyRate}%
              </span>
              <span className="text-[11px] text-slate-400">
                {currentMetrics.reservasi.occupiedHomestay}/{currentMetrics.reservasi.totalHomestay} Kamar
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 mt-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${currentMetrics.reservasi.occupancyRate}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-300 mt-1.5">
              {currentMetrics.reservasi.activeGuestsToday} Tamu Aktif • {currentMetrics.reservasi.totalTicketsSold} Tiket Terjual
            </p>
          </div>
        </div>

        {/* Pillar 2: SIK-REP Keuangan */}
        <div className="p-3.5 rounded-2xl bg-[#081a13] border border-emerald-500/20 flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide">
                SIK-REP Kas
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">
              {currentMetrics.keuangan.trendRevenue}
            </span>
          </div>

          <div>
            <span className="text-lg sm:text-xl font-black text-white font-mono block leading-tight">
              {formatRupiah(currentMetrics.keuangan.totalCashBalance)}
            </span>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 pt-1.5 border-t border-slate-800">
              <span className="text-emerald-300 font-semibold">
                Masuk: {formatRupiah(currentMetrics.keuangan.monthlyIncome)}
              </span>
              <span className="text-rose-300">
                Keluar: {formatRupiah(currentMetrics.keuangan.monthlyExpense)}
              </span>
            </div>
          </div>
        </div>

        {/* Pillar 3: POS Kasir Yaswar & Gudang */}
        <div className="p-3.5 rounded-2xl bg-[#081a13] border border-teal-500/20 flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
                <Store className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wide">
                POS & Gudang
              </span>
            </div>
            <span className="text-[10px] font-mono text-teal-300 font-bold">
              {currentMetrics.posGudang.trendSales}
            </span>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-lg sm:text-xl font-black text-white font-mono leading-tight">
                {formatRupiah(currentMetrics.posGudang.dailySalesVolume)}
              </span>
              <span className="text-[11px] text-slate-400">
                {currentMetrics.posGudang.dailyTransactionsCount} Struk
              </span>
            </div>
            {currentMetrics.posGudang.lowStockAlerts.length > 0 && (
              <p className="text-[10px] text-amber-300 flex items-center gap-1 mt-1.5 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/25">
                <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                <span>{currentMetrics.posGudang.lowStockAlerts.length} Suvenir Stok Menipis</span>
              </p>
            )}
          </div>
        </div>

        {/* Pillar 4: Zeey Studio Media */}
        <div className="p-3.5 rounded-2xl bg-[#081a13] border border-indigo-500/20 flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Film className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wide">
                Zeey Media
              </span>
            </div>
            <span className="text-[10px] font-mono text-indigo-300 font-bold">
              +{currentMetrics.zeeyStudio.newAssetsThisWeek} pekan ini
            </span>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-black text-white font-serif">
                {currentMetrics.zeeyStudio.totalMediaAssets}
              </span>
              <span className="text-[11px] text-slate-400">
                {currentMetrics.zeeyStudio.cloudStorageUsedGb} / {currentMetrics.zeeyStudio.totalCloudStorageGb} GB
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 mt-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-400 rounded-full"
                style={{
                  width: `${(currentMetrics.zeeyStudio.cloudStorageUsedGb / currentMetrics.zeeyStudio.totalCloudStorageGb) * 100}%`,
                }}
              />
            </div>
            <p className="text-[10px] text-slate-300 mt-1.5 truncate">
              {currentMetrics.zeeyStudio.culturalVideosCount} Video Budaya • {currentMetrics.zeeyStudio.highResPhotosCount} Foto
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
