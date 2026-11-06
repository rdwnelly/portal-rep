'use client';

import React from 'react';
import { CalendarDays, ChevronRight, Landmark, Sparkles, Store, Wallet } from 'lucide-react';
import type { AppCategory, AppItem } from '@/lib/types';
import { launchApp } from '@/lib/app-launcher';

const ICONS: Record<AppCategory, { icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  OPERASIONAL: { icon: CalendarDays, tone: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' },
  KEUANGAN: { icon: Wallet, tone: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' },
  GUDANG_POS: { icon: Store, tone: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300' },
  MEDIA_KREATIF: { icon: Sparkles, tone: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300' },
  ADMINISTRASI: { icon: Landmark, tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
};

const STATUS_LABEL: Partial<Record<AppItem['status'], string>> = {
  MAINTENANCE: 'Sedang perbaikan',
  OFFLINE: 'Tidak aktif',
};

/**
 * Daftar aplikasi kerja. Satu ketukan pada baris langsung membuka aplikasinya
 * (masuk otomatis bila staf sudah login & aplikasi mendukung SSO).
 */
export default function AppList({ apps, showDescription = false }: { apps: AppItem[]; showDescription?: boolean }) {
  if (apps.length === 0) {
    return (
      <p className="p-6 text-center text-sm text-stone-500 dark:text-slate-400 rounded-2xl bg-white dark:bg-[#0c241b] border border-stone-200 dark:border-white/10">
        Daftar aplikasi sedang dimuat…
      </p>
    );
  }

  return (
    <ul className="space-y-2.5">
      {apps.map((app) => {
        const { icon: Icon, tone } = ICONS[app.category] ?? ICONS.ADMINISTRASI;
        const status = STATUS_LABEL[app.status];
        return (
          <li key={app.id}>
            <button
              type="button"
              onClick={() => void launchApp(app)}
              className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#0c241b] border border-stone-200 dark:border-white/10 text-left active:scale-[0.99] transition-transform cursor-pointer"
            >
              <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${tone}`}>
                <Icon className="w-5 h-5" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="text-[15px] font-semibold leading-snug text-stone-900 dark:text-white line-clamp-2">
                  {app.title}
                </span>
                {showDescription && app.description && (
                  <span className="mt-0.5 text-xs text-stone-500 dark:text-slate-400 line-clamp-2">{app.description}</span>
                )}
                {status && (
                  <span className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                    {status}
                  </span>
                )}
              </span>
              <ChevronRight className="w-5 h-5 text-stone-400 shrink-0" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
