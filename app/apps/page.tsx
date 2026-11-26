'use client';

import React, { useState } from 'react';
import { KeyRound, LayoutGrid } from 'lucide-react';
import { getAppsList, SSR_APPS } from '@/lib/storage';
import { useStoreValue } from '@/lib/use-store';
import Navbar from '@/components/Navbar';
import PageHeader from '@/components/PageHeader';
import AppList from '@/components/AppList';
import RequestAccessModal from '@/components/RequestAccessModal';
import { Bento, BentoCard, CardTitle, Stat } from '@/components/ui/Bento';

/** Semua aplikasi kerja yayasan sebagai kartu bento. */
export default function AppsCatalogPage() {
  const apps = useStoreValue('apps', getAppsList, SSR_APPS);
  const [requestOpen, setRequestOpen] = useState(false);

  // 'UPDATED' juga siap dipakai — hanya MAINTENANCE & OFFLINE yang tidak.
  const active = apps.filter((a) => a.status === 'ONLINE' || a.status === 'UPDATED').length;
  const maintenance = apps.filter((a) => a.status === 'MAINTENANCE').length;
  const offline = apps.filter((a) => a.status === 'OFFLINE').length;

  return (
    <div className="dock-safe min-h-screen bg-[#f6f4ee] dark:bg-[#07130f] text-stone-900 dark:text-slate-100">
      <Navbar />
      <main className="max-w-xl md:max-w-5xl mx-auto px-4 space-y-4 sm:space-y-5">
        <PageHeader title="Aplikasi" subtitle="Ketuk kartu aplikasi untuk membukanya." />

        <Bento>
          <BentoCard span="third">
            <Stat label="Siap dipakai" value={active} unit="aplikasi" />
          </BentoCard>
          <BentoCard span="third">
            <Stat label="Sedang perbaikan" value={maintenance} unit="aplikasi" />
          </BentoCard>
          <BentoCard span="third" className="hidden md:block">
            <Stat label="Tidak aktif" value={offline} unit="aplikasi" />
          </BentoCard>
        </Bento>

        <section aria-labelledby="judul-katalog" className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2.5 px-1">
            <span className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <LayoutGrid className="w-4.5 h-4.5" />
            </span>
            <h2 id="judul-katalog" className="text-lg font-bold">
              Katalog aplikasi
            </h2>
          </div>
          <AppList apps={apps} showDescription />
        </section>

        <Bento>
          <BentoCard as="section" span="full" tone="amber" aria-labelledby="judul-ajukan">
            <CardTitle
              id="judul-ajukan"
              icon={KeyRound}
              iconTone="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
              eyebrow="Belum punya akun?"
              title="Ajukan akses ke salah satu aplikasi"
              action={
                <button
                  type="button"
                  onClick={() => setRequestOpen(true)}
                  className="h-10 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold cursor-pointer"
                >
                  Ajukan akses
                </button>
              }
            />
            <p className="mt-3 text-xs text-stone-600 dark:text-slate-300 leading-relaxed">
              Permohonan diteruskan ke pimpinan dan Admin IT yayasan. Anda akan dihubungi setelah akun dibuat.
            </p>
          </BentoCard>
        </Bento>
      </main>
      <RequestAccessModal isOpen={requestOpen} availableApps={apps} onClose={() => setRequestOpen(false)} />
    </div>
  );
}
