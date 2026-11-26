'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MetricsPeriod } from '@/lib/types';
import { useLiveMetrics } from '@/lib/live-metrics';
import { SourceOverlay } from '@/components/SourceStatus';
import { SOURCE_LABELS } from '@/lib/integration-contract';
import { AlertTriangle, ArrowUpRight, BarChart3, BedDouble, Film, Store, Wallet } from 'lucide-react';
import { Bento, BentoCard, CardTitle } from '@/components/ui/Bento';

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Batang kemajuan kecil di dalam kartu pilar. */
function Meter({ percent, tone }: { percent: number; tone: string }) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div
      className="w-full h-1.5 rounded-full bg-stone-200 dark:bg-white/10 overflow-hidden"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={`h-full rounded-full transition-all duration-500 ${tone}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}

const PILLAR_TONE = {
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  teal: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300',
  indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
};

/** Kepala tiap kartu pilar: ikon + nama modul di kiri, tren kecil di kanan. */
function PillarHead({
  icon: Icon,
  label,
  tone,
  trend,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tone: keyof typeof PILLAR_TONE;
  trend?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${PILLAR_TONE[tone]}`}>
          <Icon className="w-4 h-4" />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-wide truncate">{label}</span>
      </div>
      {trend && (
        <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 shrink-0">{trend}</span>
      )}
    </div>
  );
}

/** Ringkasan empat sub-aplikasi untuk pimpinan, sebagai bento di dalam satu kartu. */
export default function ExecutiveOverviewWidget() {
  const [period, setPeriod] = useState<MetricsPeriod>('TODAY');
  const { metrics: m, sources } = useLiveMetrics(period);

  const periodBtn = (value: MetricsPeriod, label: string) => (
    <button
      type="button"
      onClick={() => setPeriod(value)}
      aria-pressed={period === value}
      className={`px-2.5 h-8 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
        period === value
          ? 'bg-amber-600 text-white'
          : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="rounded-3xl bg-white dark:bg-[#0c241b] border border-stone-200/90 dark:border-white/10 shadow-[0_1px_2px_rgba(16,24,20,0.04),0_10px_28px_-18px_rgba(16,24,20,0.18)] dark:shadow-none p-4 sm:p-5">
      <CardTitle
        as="h2"
        icon={BarChart3}
        iconTone="bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
        eyebrow="Pimpinan & eksekutif"
        title="Denyut operasional terpadu"
        action={
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5 p-0.5 rounded-xl bg-stone-100 dark:bg-white/5">
              {periodBtn('TODAY', 'Hari Ini')}
              {periodBtn('THIS_MONTH', 'Bulan Ini')}
            </div>
            <Link
              href="/eksekutif"
              aria-label="Buka dasbor eksekutif"
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        }
      />

      <Bento className="mt-4">
        <BentoCard span="third" tone="amber" className="relative flex flex-col justify-between gap-2.5">
          <SourceOverlay compact state={sources.reservasi} appName={SOURCE_LABELS.reservasi} />
          <PillarHead icon={BedDouble} label="Homestay" tone="amber" trend={m.reservasi.trendGuests} />
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xl sm:text-2xl font-black tabular-nums">{m.reservasi.occupancyRate}%</span>
              <span className="text-[11px] text-stone-500 dark:text-slate-400 shrink-0">
                {m.reservasi.occupiedHomestay}/{m.reservasi.totalHomestay} kamar
              </span>
            </div>
            <div className="mt-1.5">
              <Meter percent={m.reservasi.occupancyRate} tone="bg-gradient-to-r from-amber-500 to-emerald-500" />
            </div>
            <p className="mt-1.5 text-[10px] text-stone-600 dark:text-slate-300">
              {m.reservasi.activeGuestsToday} tamu aktif • {m.reservasi.totalTicketsSold} tiket
            </p>
          </div>
        </BentoCard>

        <BentoCard span="third" tone="emerald" className="relative flex flex-col justify-between gap-2.5">
          <SourceOverlay compact state={sources.keuangan} appName={SOURCE_LABELS.keuangan} />
          <PillarHead icon={Wallet} label="SIK-REP kas" tone="emerald" trend={m.keuangan.trendRevenue} />
          <div>
            <span className="block text-base sm:text-lg font-black font-mono leading-tight tabular-nums">
              {formatRupiah(m.keuangan.totalCashBalance)}
            </span>
            <div className="mt-1.5 pt-1.5 border-t border-stone-200 dark:border-white/10 flex items-center justify-between gap-2 text-[10px]">
              <span className="text-emerald-700 dark:text-emerald-300 font-semibold truncate">
                Masuk {formatRupiah(m.keuangan.monthlyIncome)}
              </span>
              <span className="text-rose-700 dark:text-rose-300 truncate">
                Keluar {formatRupiah(m.keuangan.monthlyExpense)}
              </span>
            </div>
          </div>
        </BentoCard>

        <BentoCard span="third" className="relative flex flex-col justify-between gap-2.5">
          <SourceOverlay compact state={sources.posGudang} appName={SOURCE_LABELS.posGudang} />
          <PillarHead icon={Store} label="POS & gudang" tone="teal" trend={m.posGudang.trendSales} />
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-base sm:text-lg font-black font-mono leading-tight tabular-nums">
                {formatRupiah(m.posGudang.dailySalesVolume)}
              </span>
              <span className="text-[11px] text-stone-500 dark:text-slate-400 shrink-0">
                {m.posGudang.dailyTransactionsCount} struk
              </span>
            </div>
            {m.posGudang.lowStockAlerts.length > 0 && (
              <p className="mt-1.5 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/25 text-[10px] text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span className="truncate">{m.posGudang.lowStockAlerts.length} suvenir stok menipis</span>
              </p>
            )}
          </div>
        </BentoCard>

        <BentoCard span="third" className="relative flex flex-col justify-between gap-2.5">
          <SourceOverlay compact state={sources.zeeyStudio} appName={SOURCE_LABELS.zeeyStudio} />
          <PillarHead
            icon={Film}
            label="Zeey media"
            tone="indigo"
            trend={`+${m.zeeyStudio.newAssetsThisWeek} pekan ini`}
          />
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xl sm:text-2xl font-black tabular-nums">{m.zeeyStudio.totalMediaAssets}</span>
              <span className="text-[11px] text-stone-500 dark:text-slate-400 shrink-0">
                {m.zeeyStudio.cloudStorageUsedGb}/{m.zeeyStudio.totalCloudStorageGb} GB
              </span>
            </div>
            <div className="mt-1.5">
              <Meter
                percent={
                  m.zeeyStudio.totalCloudStorageGb
                    ? (m.zeeyStudio.cloudStorageUsedGb / m.zeeyStudio.totalCloudStorageGb) * 100
                    : 0
                }
                tone="bg-gradient-to-r from-indigo-500 to-purple-500"
              />
            </div>
            <p className="mt-1.5 text-[10px] text-stone-600 dark:text-slate-300 truncate">
              {m.zeeyStudio.culturalVideosCount} video • {m.zeeyStudio.highResPhotosCount} foto
            </p>
          </div>
        </BentoCard>
      </Bento>
    </div>
  );
}
