'use client';

import React, { useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import RoleGuard from '@/components/RoleGuard';
import { UserRole } from '@/lib/types';
import Navbar from '@/components/Navbar';
import RequestAccessModal from '@/components/RequestAccessModal';
import {
  ShieldAlert,
  Link2,
  Info,
  KeyRound,
  CalendarDays,
  Users,
  History,
} from 'lucide-react';
import { PapuanBorderCorner } from '@/components/PapuanMotif';
import { AdminTab, ROLE_PERMISSIONS } from '@/components/admin/permissions';
import { Bento, BentoCard, CARD_SURFACE, Stat } from '@/components/ui/Bento';
import { useAdminData } from '@/components/admin/useAdminData';
import EventsTab from '@/components/admin/tabs/EventsTab';
import WhitelistTab from '@/components/admin/tabs/WhitelistTab';
import RequestsTab from '@/components/admin/tabs/RequestsTab';
import AppsTab from '@/components/admin/tabs/AppsTab';
import InfoTab from '@/components/admin/tabs/InfoTab';
import LogsTab from '@/components/admin/tabs/LogsTab';

/** Definisi tab panel admin. Urutan di sini = urutan & nomor yang tampil. */
const TAB_DEFS: {
  key: AdminTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  activeClass: string;
  badge?: string;
  badgeClass?: string;
}[] = [
  {
    key: 'EVENTS',
    label: 'Agenda Budaya',
    icon: CalendarDays,
    iconColor: 'text-amber-400',
    activeClass: 'bg-gradient-to-r from-amber-600 to-amber-700 shadow-amber-950/60 border-amber-400/40',
    badge: 'Ops/Pimpinan',
    badgeClass: 'bg-black/40 text-amber-300',
  },
  {
    key: 'WHITELIST',
    label: 'Whitelist Karyawan',
    icon: Users,
    iconColor: 'text-purple-400',
    activeClass: 'bg-gradient-to-r from-purple-600 to-indigo-700 shadow-purple-950/60 border-purple-400/40',
    badge: 'Khusus IT',
    badgeClass: 'bg-purple-950 text-purple-300 border border-purple-500/40',
  },
  {
    key: 'REQUESTS',
    label: 'Permohonan Akses',
    icon: KeyRound,
    iconColor: 'text-amber-400',
    activeClass: 'bg-gradient-to-r from-amber-600 to-amber-700 shadow-amber-950/60 border-amber-400/40',
    badge: 'Pimpinan/IT',
    badgeClass: 'bg-black/40 text-amber-300',
  },
  {
    key: 'APPS',
    label: 'Link Aplikasi',
    icon: Link2,
    iconColor: 'text-emerald-400',
    activeClass: 'bg-gradient-to-r from-amber-600 to-amber-700 shadow-amber-950/60 border-amber-400/40',
    badge: 'Khusus IT',
    badgeClass: 'bg-black/40 text-slate-400',
  },
  {
    key: 'INFO',
    label: 'Info Yayasan',
    icon: Info,
    iconColor: 'text-cyan-400',
    activeClass: 'bg-gradient-to-r from-cyan-600 to-teal-700 shadow-cyan-950/60 border-cyan-400/40',
  },
  {
    key: 'LOGS',
    label: 'Audit Logs',
    icon: History,
    iconColor: 'text-stone-500 dark:text-slate-400',
    activeClass: 'bg-gradient-to-r from-slate-700 to-slate-800 border-slate-500/40',
  },
];

export default function AdminDashboardPage() {
  return (
    <RoleGuard allow={['IT_ADMIN', 'EXECUTIVE']} pageName="Panel Kontrol Admin" returnTo="/dashboard/admin">
      <AdminDashboardContent />
    </RoleGuard>
  );
}

function AdminDashboardContent() {
  const { user } = useAuth();
  // Data reaktif (lokal maupun Firestore real-time) — tidak perlu memuat ulang manual.
  const data = useAdminData();
  const { events, whitelist, apps, requests, auditLogs } = data;

  // Role nyata berasal dari whitelist Firestore (RoleGuard memastikan user sudah login).
  // Simulasi role hanya mengubah TAMPILAN untuk pratinjau; izin data tetap ditegakkan Security Rules.
  const actualRole: UserRole = user?.role ?? 'UNAUTHORIZED';
  const [simulatedOverride, setSimulatedRole] = useState<UserRole | null>(null);
  const simulatedRole = simulatedOverride ?? actualRole;

  const [activeTab, setActiveTab] = useState<AdminTab>('EVENTS');
  const [requestAccessModalOpen, setRequestAccessModalOpen] = useState(false);

  const currentAdminName = user?.displayName ?? 'Administrator';
  const currentUserEmail = user?.email.toLowerCase() ?? '';

  const allowedTabs = ROLE_PERMISSIONS[simulatedRole].allowedTabs;
  const visibleTabs = useMemo(() => TAB_DEFS.filter((t) => allowedTabs.includes(t.key)), [allowedTabs]);
  // Tab yang benar-benar ditampilkan: bila role pratinjau tidak boleh membuka tab terpilih,
  // pindah ke tab pertama yang boleh — administrator tidak ditinggalkan di panel kosong.
  const effectiveTab = allowedTabs.includes(activeTab) ? activeTab : (visibleTabs[0]?.key ?? activeTab);
  const isTabAllowed = allowedTabs.includes(effectiveTab);

  const tabCount: Partial<Record<AdminTab, number>> = {
    EVENTS: events.length,
    WHITELIST: whitelist.length,
    REQUESTS: requests.filter((r) => r.status === 'PENDING').length,
    APPS: apps.length,
    LOGS: auditLogs.length,
  };

  return (
    <div className="dock-safe relative min-h-screen flex flex-col bg-[#f6f4ee] dark:bg-[#07130f] text-stone-900 dark:text-slate-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-6 w-full flex-1 space-y-4 sm:space-y-5">
        {/* Kartu kepala: identitas administrator + pratinjau role */}
        <Bento>
          <BentoCard as="section" span="twoThirds" tone="forest" className="flex flex-col justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                Panel kontrol · Yayasan Rumah Etnik Papua
              </p>
              <h1 className="mt-1.5 text-2xl font-bold">Panel Admin</h1>
              <p className="mt-1 text-sm text-emerald-100/80 truncate">
                {currentAdminName} · {ROLE_PERMISSIONS[actualRole].label}
              </p>
            </div>

            {actualRole === 'IT_ADMIN' && (
              <label className="flex items-center gap-2 text-xs text-emerald-100/80">
                <span className="shrink-0">Pratinjau sebagai</span>
                <select
                  value={simulatedRole}
                  onChange={(e) => setSimulatedRole(e.target.value as UserRole)}
                  className="h-10 min-w-0 flex-1 px-3 rounded-xl bg-black/30 border border-white/20 text-sm text-stone-900 dark:text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="IT_ADMIN">IT Admin</option>
                  <option value="EXECUTIVE">Pimpinan</option>
                  <option value="OPERATIONAL">Staf Operasional</option>
                  <option value="FINANCE_WAREHOUSE">Staf Keuangan & Gudang</option>
                </select>
              </label>
            )}
          </BentoCard>

          <BentoCard span="third">
            <Stat label="Permohonan menunggu" value={tabCount.REQUESTS ?? 0} unit="orang" />
          </BentoCard>
          <BentoCard span="third">
            <Stat label="Karyawan terdaftar" value={tabCount.WHITELIST ?? 0} unit="akun" />
          </BentoCard>
          <BentoCard span="third">
            <Stat label="Agenda tersimpan" value={tabCount.EVENTS ?? 0} unit="kegiatan" />
          </BentoCard>
          <BentoCard span="third">
            <Stat label="Jejak audit" value={tabCount.LOGS ?? 0} unit="catatan" />
          </BentoCard>
        </Bento>

        {/* Tab panel — hanya tab yang boleh dibuka role ini yang ditampilkan. */}
        <div
          className={`${CARD_SURFACE} flex items-center gap-2 p-2 overflow-x-auto scrollbar-none`}
          role="tablist"
          aria-label="Bagian panel admin"
        >
          {visibleTabs.map(({ key, label, icon: Icon, iconColor, activeClass, badge, badgeClass }, i) => {
            const active = effectiveTab === key;
            const count = tabCount[key];
            return (
              <button
                key={key}
                id={`tab-${key}`}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls="panel-admin"
                onClick={() => setActiveTab(key)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap border ${
                  active
                    ? `${activeClass} text-white shadow-lg`
                    : 'bg-stone-50 dark:bg-[#0a1f17] text-stone-600 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-emerald-950/60 border-stone-200 dark:border-amber-500/15'
                }`}
              >
                <Icon className={`w-4 h-4 ${iconColor}`} />
                <span suppressHydrationWarning>
                  {i + 1}. {label}
                  {count !== undefined ? ` (${count})` : ''}
                </span>
                {badge && <span className={`text-[9px] px-1.5 py-0.5 rounded ${badgeClass}`}>{badge}</span>}
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* ACCESS GUARD: TAMPILKAN RESTRIKSI JIKA ROLE TIDAK DIIZINKAN              */}
        {/* ========================================================================= */}
        {!isTabAllowed ? (
          <div
            id="panel-admin"
            role="tabpanel"
            className={`${CARD_SURFACE} p-8 sm:p-10 border-rose-300 dark:border-rose-500/40 text-center space-y-4 relative overflow-hidden`}
          >
            <PapuanBorderCorner position="top-right" />
            <PapuanBorderCorner position="bottom-left" />

            <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-500/40 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <h2 className="text-xl sm:text-2xl font-black font-serif">
                Akses Terbatas / Restriksi Otorisasi
              </h2>
              <p className="text-xs text-stone-600 dark:text-slate-300 leading-relaxed">
                Role Anda saat ini (<strong className="text-amber-700 dark:text-amber-300">{ROLE_PERMISSIONS[simulatedRole].label}</strong>) tidak memiliki izin untuk mengelola tab ini.
              </p>
              <p className="text-[11px] text-stone-500 dark:text-slate-400">
                Fitur ini dikhususkan untuk Administrator IT atau Manajemen Eksekutif Yayasan Rumah Etnik Papua.
              </p>
            </div>

            <div className="pt-3 flex items-center justify-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setRequestAccessModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-extrabold shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>Ajukan Peningkatan Role / Akses</span>
              </button>

              {simulatedOverride && (
                <button
                  type="button"
                  onClick={() => setSimulatedRole(null)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-[#0c281e] hover:bg-stone-200 dark:hover:bg-[#12382c] border border-stone-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Akhiri pratinjau, kembali ke role saya
                </button>
              )}
            </div>
          </div>
        ) : (
          <div
            id="panel-admin"
            role="tabpanel"
            aria-labelledby={`tab-${effectiveTab}`}
            className={`${CARD_SURFACE} p-4 sm:p-5`}
          >
            {effectiveTab === 'EVENTS' && <EventsTab events={events} currentAdminName={currentAdminName} />}
            {effectiveTab === 'WHITELIST' && (
              <WhitelistTab whitelist={whitelist} currentUserEmail={currentUserEmail} currentAdminName={currentAdminName} />
            )}
            {effectiveTab === 'REQUESTS' && <RequestsTab requests={requests} currentAdminName={currentAdminName} />}
            {effectiveTab === 'APPS' && <AppsTab apps={apps} currentAdminName={currentAdminName} />}
            {effectiveTab === 'INFO' &&
              (data.infoLoaded ? (
                <InfoTab info={data.info} currentAdminName={currentAdminName} />
              ) : (
                <div className="p-10 flex justify-center" role="status" aria-label="Memuat informasi yayasan">
                  <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ))}
            {effectiveTab === 'LOGS' && <LogsTab auditLogs={auditLogs} actualRole={actualRole} currentAdminName={currentAdminName} />}
          </div>
        )}
      </main>

      {/* Modal Permohonan Akses / Upgrade Role */}
      <RequestAccessModal
        isOpen={requestAccessModalOpen}
        onClose={() => setRequestAccessModalOpen(false)}
      />
    </div>
  );
}
