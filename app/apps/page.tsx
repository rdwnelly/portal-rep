'use client';

import React, { useMemo, useState } from 'react';
import { LayoutGrid, Search, X } from 'lucide-react';
import { getAppsList, SSR_APPS } from '@/lib/storage';
import { useStoreValue } from '@/lib/use-store';
import type { AppCategory } from '@/lib/types';
import Navbar from '@/components/Navbar';
import AppList from '@/components/AppList';
import { CATEGORY_LABEL } from '@/components/AppIcon';
import { PapuanBorderCorner } from '@/components/PapuanMotif';

type Filter = 'SEMUA' | AppCategory;

const normalize = (text: string) => text.toLocaleLowerCase('id-ID');

/** Semua aplikasi kerja yayasan: cari, saring per kategori, ketuk untuk melihat informasi. */
export default function AppsCatalogPage() {
  const apps = useStoreValue('apps', getAppsList, SSR_APPS);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('SEMUA');

  // Hanya kategori yang benar-benar punya aplikasi yang dijadikan pilihan.
  const categories = useMemo(() => {
    const present = new Set(apps.map((a) => a.category));
    return (Object.keys(CATEGORY_LABEL) as AppCategory[]).filter((c) => present.has(c));
  }, [apps]);

  const q = normalize(query.trim());
  const shown = apps.filter(
    (a) =>
      (filter === 'SEMUA' || a.category === filter) &&
      (!q || [a.title, a.description, a.badgeText, a.shortCode].some((t) => t && normalize(t).includes(q)))
  );
  const activeCount = apps.filter((a) => a.status === 'ONLINE' || a.status === 'UPDATED').length;

  const chip = (value: Filter, label: string, count: number) => (
    <button
      key={value}
      type="button"
      aria-pressed={filter === value}
      onClick={() => setFilter(value)}
      className={`h-9 shrink-0 inline-flex items-center gap-1.5 px-3.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
        filter === value
          ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
          : 'bg-white text-stone-600 ring-1 ring-stone-200 hover:ring-stone-300 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10'
      }`}
    >
      {label}
      <span className={`tabular-nums ${filter === value ? 'opacity-70' : 'text-stone-400 dark:text-slate-500'}`}>
        {count}
      </span>
    </button>
  );

  return (
    <div className="dock-safe min-h-screen bg-[#f6f4ee] dark:bg-[#07130f] text-stone-900 dark:text-slate-100">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-[#123a2b] via-[#0f3324] to-[#0a2219] text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(#e5a93c_1px,transparent_1px)] [background-size:18px_18px]"
        />
        <div aria-hidden className="absolute -bottom-24 -left-16 w-64 h-64 rounded-full bg-emerald-400/10 blur-3xl" />
        <PapuanBorderCorner position="top-right" />

        <div className="relative max-w-xl md:max-w-5xl mx-auto px-4 pt-7 pb-16">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.14em] uppercase text-emerald-200/80">
            <LayoutGrid className="w-3.5 h-3.5" /> Aplikasi kerja
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Semua aplikasi yayasan</h1>
          <p className="mt-1.5 max-w-md text-sm leading-relaxed text-emerald-50/75">
            Ketuk aplikasi untuk melihat informasinya, lalu buka di tab baru.
          </p>
          <p className="mt-4 flex flex-wrap gap-2 text-xs" suppressHydrationWarning>
            <span className="px-3 py-1 rounded-full bg-white/10 ring-1 ring-white/15">{apps.length} aplikasi</span>
            <span className="px-3 py-1 rounded-full bg-emerald-400/15 text-emerald-100 ring-1 ring-emerald-300/20">
              {activeCount} siap dipakai
            </span>
          </p>
        </div>
      </section>

      <main className="max-w-xl md:max-w-5xl mx-auto px-4 -mt-8 relative space-y-4">
        {/* Pencarian */}
        <div className="relative">
          <Search
            aria-hidden
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-slate-500"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari aplikasi…"
            aria-label="Cari aplikasi"
            enterKeyHint="search"
            className="w-full h-12 pl-11 pr-11 rounded-2xl bg-white dark:bg-[#0c241b] ring-1 ring-stone-200 dark:ring-white/10 shadow-[0_10px_30px_-18px_rgba(16,24,20,0.35)] text-sm placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Hapus pencarian"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 dark:hover:bg-white/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Saring per kategori — bergulir ke samping di HP tanpa melebarkan halaman */}
        {categories.length > 1 && (
          <div
            role="group"
            aria-label="Saring kategori"
            className="-mx-4 px-4 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {chip('SEMUA', 'Semua', apps.length)}
            {categories.map((c) => chip(c, CATEGORY_LABEL[c], apps.filter((a) => a.category === c).length))}
          </div>
        )}

        <AppList
          apps={shown}
          emptyMessage={
            q ? `Tidak ada aplikasi yang cocok dengan “${query.trim()}”.` : 'Belum ada aplikasi pada kategori ini.'
          }
        />
      </main>
    </div>
  );
}
