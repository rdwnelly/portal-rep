'use client';

import React from 'react';
import { getAppsList, isShowingDefaultApps, SSR_APPS } from '@/lib/storage';
import { useStoreValue } from '@/lib/use-store';
import RoleGuard from '@/components/RoleGuard';
import Navbar from '@/components/Navbar';
import AppsTab from '@/components/admin/tabs/AppsTab';
import { CARD_SURFACE } from '@/components/ui/Bento';

/** Panel admin: satu panel saja — Link Aplikasi. */
export default function AdminDashboardPage() {
  return (
    <RoleGuard allow={['IT_ADMIN']} pageName="Panel Admin" returnTo="/dashboard/admin">
      <AdminDashboardContent />
    </RoleGuard>
  );
}

function AdminDashboardContent() {
  const apps = useStoreValue('apps', getAppsList, SSR_APPS);
  const showingDefaults = useStoreValue('appsDefault', isShowingDefaultApps, false);

  return (
    <div className="dock-safe relative min-h-screen flex flex-col bg-[#f6f4ee] dark:bg-[#07130f] text-stone-900 dark:text-slate-100">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 pb-6 w-full flex-1">
        <section className={`${CARD_SURFACE} p-4 sm:p-6`}>
          <AppsTab apps={apps} showingDefaults={showingDefaults} />
        </section>
      </main>
    </div>
  );
}
