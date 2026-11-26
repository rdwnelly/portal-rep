'use client';

import React, { useCallback, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { AppItem } from '@/lib/types';
import AppIcon from '@/components/AppIcon';
import AppInfoSheet from '@/components/AppInfoSheet';
import { CARD_SURFACE } from '@/components/ui/Bento';

const STATUS: Partial<Record<AppItem['status'], { label: string; dot: string }>> = {
  MAINTENANCE: { label: 'Perbaikan', dot: 'bg-amber-500' },
  OFFLINE: { label: 'Tidak aktif', dot: 'bg-stone-400' },
};

/**
 * Kisi aplikasi kerja. Mengetuk ubin menampilkan informasi aplikasi;
 * aplikasinya dibuka dari tombol "Buka aplikasi" di lembar informasi itu.
 */
export default function AppList({
  apps,
  emptyMessage = 'Belum ada aplikasi yang terdaftar.',
}: {
  apps: AppItem[];
  emptyMessage?: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const opened = apps.find((a) => a.id === openId) ?? null;

  const close = useCallback(() => {
    const id = openId;
    setOpenId(null);
    // Kembalikan fokus ke ubin asal agar pengguna keyboard tidak kehilangan posisinya.
    if (id) requestAnimationFrame(() => document.getElementById(`ubin-${id}`)?.focus());
  }, [openId]);

  if (apps.length === 0) {
    return (
      <p className={`${CARD_SURFACE} p-6 text-center text-sm text-stone-500 dark:text-slate-400`}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <>
      <ul className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {apps.map((app) => {
          const status = STATUS[app.status];
          return (
            <li key={app.id}>
              <button
                id={`ubin-${app.id}`}
                type="button"
                aria-haspopup="dialog"
                onClick={() => setOpenId(app.id)}
                className="group relative w-full h-full flex flex-col items-start gap-5 p-4 sm:p-5 rounded-[1.5rem] bg-white dark:bg-[#0c241b] ring-1 ring-stone-200/80 dark:ring-white/[0.08] text-left overflow-hidden transition-all duration-200 hover:ring-stone-300 dark:hover:ring-white/20 hover:shadow-[0_18px_40px_-20px_rgba(16,24,20,0.35)] hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
              >
                {/* Cahaya lembut di sudut, muncul saat disorot. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -top-10 -right-10 w-28 h-28 rounded-full bg-emerald-400/0 blur-2xl transition-colors duration-300 group-hover:bg-emerald-400/15"
                />

                <span className="relative w-full flex items-start justify-between">
                  <AppIcon app={app} variant="solid" />
                  {status ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 dark:bg-white/10 text-[10px] font-semibold text-stone-600 dark:text-slate-300">
                      <span aria-hidden className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  ) : (
                    <span
                      aria-hidden
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-stone-100 dark:bg-white/5 text-stone-400 dark:text-slate-500 transition-colors group-hover:bg-emerald-600 group-hover:text-white"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  )}
                </span>

                <span className="relative w-full min-w-0 mt-auto">
                  <span className="block text-sm sm:text-base font-semibold leading-snug text-stone-900 dark:text-white break-words">
                    {app.title}
                  </span>
                  <span className="mt-1 block truncate text-xs text-stone-500 dark:text-slate-400">
                    {app.badgeText || 'Aplikasi kerja'}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {opened && <AppInfoSheet app={opened} onClose={close} />}
    </>
  );
}
