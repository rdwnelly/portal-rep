'use client';

import React, { useEffect, useRef } from 'react';
import { ExternalLink, Globe, Info, Wrench, X } from 'lucide-react';
import type { AppItem } from '@/lib/types';
import { launchApp } from '@/lib/app-launcher';
import AppIcon, { CATEGORY_LABEL } from '@/components/AppIcon';

const hostOf = (url: string) => {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
};

/**
 * Informasi satu aplikasi: deskripsi, rincian, dan tombol untuk membukanya.
 * Lembar dari bawah di HP, dialog di tengah pada layar lebar.
 */
export default function AppInfoSheet({ app, onClose }: { app: AppItem; onClose: () => void }) {
  const primaryRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const offline = app.status === 'OFFLINE';
  const maintenance = app.status === 'MAINTENANCE';

  // Fokus ke tombol utama saat dibuka; tutup dengan Escape.
  useEffect(() => {
    (offline ? closeRef : primaryRef).current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [offline, onClose]);

  const details = app.fullDetails?.trim();

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
      <button
        type="button"
        aria-label="Tutup informasi aplikasi"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] cursor-default"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="judul-info-aplikasi"
        aria-describedby="deskripsi-info-aplikasi"
        className="relative w-full sm:max-w-md max-h-[88dvh] overflow-y-auto rounded-t-[1.75rem] sm:rounded-3xl bg-white dark:bg-[#0c241b] text-stone-900 dark:text-slate-100 shadow-2xl ring-1 ring-stone-200 dark:ring-white/10 px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:p-6"
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-stone-300 dark:bg-white/20 sm:hidden" aria-hidden />

        <div className="flex items-start gap-4">
          <AppIcon app={app} size="lg" variant="solid" />
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-slate-400">
              {CATEGORY_LABEL[app.category] ?? 'Aplikasi'}
            </p>
            <h2 id="judul-info-aplikasi" className="mt-0.5 text-lg font-bold leading-snug">
              {app.title}
            </h2>
            {app.badgeText && <p className="text-xs text-stone-500 dark:text-slate-400">{app.badgeText}</p>}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="-mr-2 -mt-1 w-10 h-10 flex items-center justify-center rounded-full text-stone-500 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {(offline || maintenance) && (
          <p
            className={`mt-4 flex items-start gap-2 p-3 rounded-2xl text-xs leading-relaxed ${
              offline
                ? 'bg-stone-100 text-stone-700 dark:bg-white/5 dark:text-slate-300'
                : 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200'
            }`}
          >
            <Wrench className="w-4 h-4 shrink-0 mt-px" />
            {offline
              ? 'Aplikasi ini sedang tidak aktif dan belum bisa dibuka.'
              : 'Aplikasi ini sedang dalam perbaikan — mungkin belum bisa dipakai sepenuhnya.'}
          </p>
        )}

        <p id="deskripsi-info-aplikasi" className="mt-4 text-base leading-relaxed text-stone-700 dark:text-slate-200">
          {app.description || 'Belum ada deskripsi untuk aplikasi ini.'}
        </p>

        {details && details !== app.description && (
          <div className="mt-4 p-4 rounded-2xl bg-stone-50 dark:bg-white/5">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-slate-400">
              <Info className="w-3.5 h-3.5" /> Rincian
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-stone-600 dark:text-slate-300">{details}</p>
          </div>
        )}

        <p className="mt-4 flex items-center gap-1.5 text-xs text-stone-500 dark:text-slate-400">
          <Globe className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate font-mono">{hostOf(app.url)}</span>
        </p>

        <button
          ref={primaryRef}
          type="button"
          disabled={offline}
          onClick={() => {
            launchApp(app);
            onClose();
          }}
          className="mt-5 w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-base font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:bg-stone-300 dark:disabled:bg-white/10 disabled:text-stone-500"
        >
          Buka aplikasi
          <ExternalLink className="w-4 h-4" />
        </button>
        <p className="mt-2.5 text-center text-[11px] text-stone-500 dark:text-slate-400">
          Terbuka di tab baru. Masuk menggunakan akun Anda di aplikasi tersebut.
        </p>
      </div>
    </div>
  );
}
