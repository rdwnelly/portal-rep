'use client';

import React, { useState } from 'react';
import { getAppsList, SSR_APPS } from '@/lib/storage';
import { useStoreValue } from '@/lib/use-store';
import Navbar from '@/components/Navbar';
import PageHeader from '@/components/PageHeader';
import AppList from '@/components/AppList';
import RequestAccessModal from '@/components/RequestAccessModal';

/** Semua aplikasi kerja yayasan dalam satu daftar sederhana. */
export default function AppsCatalogPage() {
  const apps = useStoreValue('apps', getAppsList, SSR_APPS);
  const [requestOpen, setRequestOpen] = useState(false);

  return (
    <div className="dock-safe min-h-screen bg-[#f6f4ee] dark:bg-[#07130f] text-stone-900 dark:text-slate-100">
      <Navbar />
      <main className="max-w-xl mx-auto px-4">
        <PageHeader title="Aplikasi" subtitle="Ketuk aplikasi untuk membukanya." />
        <AppList apps={apps} showDescription />

        <div className="mt-6 p-4 rounded-2xl bg-white dark:bg-[#0c241b] border border-stone-200 dark:border-white/10 text-center">
          <p className="text-sm text-stone-600 dark:text-slate-300">Belum punya akun di salah satu aplikasi?</p>
          <button
            type="button"
            onClick={() => setRequestOpen(true)}
            className="mt-3 w-full h-11 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold cursor-pointer"
          >
            Ajukan akses
          </button>
        </div>
      </main>
      <RequestAccessModal isOpen={requestOpen} availableApps={apps} onClose={() => setRequestOpen(false)} />
    </div>
  );
}
