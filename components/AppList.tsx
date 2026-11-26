'use client';

import React from 'react';
import { ArrowUpRight, CalendarDays, Landmark, Package, ShoppingBag, Sparkles, Store, Wallet } from 'lucide-react';
import type { AppCategory, AppItem } from '@/lib/types';
import { launchApp } from '@/lib/app-launcher';
import { Bento, BentoCard, CARD_SURFACE } from '@/components/ui/Bento';

const ICONS: Record<AppCategory, { icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  OPERASIONAL: { icon: CalendarDays, tone: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' },
  KEUANGAN: { icon: Wallet, tone: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' },
  GUDANG_POS: { icon: Store, tone: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300' },
  MEDIA_KREATIF: { icon: Sparkles, tone: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300' },
  ADMINISTRASI: { icon: Landmark, tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
};

function getAppVisual(app: AppItem) {
  if (app.id === 'app-omg' || app.iconName === 'Boxes' || app.iconName === 'Package') {
    return { icon: Package, tone: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300' };
  }
  if (app.id === 'app-pos' || app.iconName === 'ShoppingBag') {
    return { icon: ShoppingBag, tone: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300' };
  }
  return ICONS[app.category] ?? ICONS.ADMINISTRASI;
}

const STATUS_LABEL: Partial<Record<AppItem['status'], string>> = {
  MAINTENANCE: 'Sedang perbaikan',
  OFFLINE: 'Tidak aktif',
};

/** Aplikasi yang dimatikan admin tidak boleh dibuka — menghindari staf mendarat di halaman mati. */
const isLaunchable = (app: AppItem) => app.status !== 'OFFLINE';

/**
 * Aplikasi kerja sebagai kartu bento. Satu ketukan pada kartu langsung membuka aplikasinya
 * (masuk otomatis bila staf sudah login & aplikasi mendukung SSO).
 */
export default function AppList({ apps, showDescription = false }: { apps: AppItem[]; showDescription?: boolean }) {
  if (apps.length === 0) {
    return (
      <p className={`${CARD_SURFACE} p-6 text-center text-sm text-stone-500 dark:text-slate-400`}>
        Belum ada aplikasi yang terdaftar. Administrator dapat menambahkannya di Panel Admin → Aplikasi.
      </p>
    );
  }

  return (
    <Bento as="ul">
      {apps.map((app) => {
        const { icon: Icon, tone } = getAppVisual(app);
        const status = STATUS_LABEL[app.status];
        const launchable = isLaunchable(app);
        return (
          <BentoCard key={app.id} as="li" span="third" surface={false} className={`${CARD_SURFACE} overflow-hidden`}>
            <button
              type="button"
              disabled={!launchable}
              aria-describedby={status ? `status-${app.id}` : undefined}
              onClick={() => void launchApp(app)}
              className={`group w-full h-full flex flex-col items-start gap-2.5 p-4 text-left transition-transform ${
                launchable ? 'active:scale-[0.98] cursor-pointer' : 'opacity-60 cursor-not-allowed'
              }`}
            >
              <span className="w-full flex items-start justify-between gap-2">
                <span className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${tone}`}>
                  <Icon className="w-5 h-5" />
                </span>
                {launchable && (
                  <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors shrink-0" />
                )}
              </span>

              <span className="flex-1 min-w-0 w-full">
                <span className="text-sm font-bold leading-snug text-stone-900 dark:text-white line-clamp-3">
                  {app.title}
                </span>
                {showDescription && app.description && (
                  <span className="mt-1 text-xs text-stone-500 dark:text-slate-400 line-clamp-2">
                    {app.description}
                  </span>
                )}
              </span>

              {status ? (
                <span
                  id={`status-${app.id}`}
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
                >
                  {status}
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-stone-400 dark:text-slate-500">Ketuk untuk membuka</span>
              )}
            </button>
          </BentoCard>
        );
      })}
    </Bento>
  );
}
