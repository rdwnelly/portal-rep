'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import RoleGuard from '@/components/RoleGuard';
import { UserRole } from '@/lib/types';
import Navbar from '@/components/Navbar';
import RequestAccessModal from '@/components/RequestAccessModal';
import {
  ShieldAlert,
  Bell,
  Link2,
  Info,
  KeyRound,
  CalendarDays,
  FileText,
  Users,
  History,
} from 'lucide-react';
import { PapuanBorderCorner } from '@/components/PapuanMotif';
import { AdminTab, ROLE_PERMISSIONS } from '@/components/admin/permissions';
import { useAdminData } from '@/components/admin/useAdminData';
import NoticesTab from '@/components/admin/tabs/NoticesTab';
import EventsTab from '@/components/admin/tabs/EventsTab';
import DocumentsTab from '@/components/admin/tabs/DocumentsTab';
import WhitelistTab from '@/components/admin/tabs/WhitelistTab';
import RequestsTab from '@/components/admin/tabs/RequestsTab';
import AppsTab from '@/components/admin/tabs/AppsTab';
import InfoTab from '@/components/admin/tabs/InfoTab';
import LogsTab from '@/components/admin/tabs/LogsTab';

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
  const { notices, events, documents, whitelist, apps, requests, auditLogs } = data;

  // Role nyata berasal dari whitelist Firestore (RoleGuard memastikan user sudah login).
  // Simulasi role hanya mengubah TAMPILAN untuk pratinjau; izin data tetap ditegakkan Security Rules.
  const actualRole: UserRole = user?.role ?? 'UNAUTHORIZED';
  const [simulatedOverride, setSimulatedRole] = useState<UserRole | null>(null);
  const simulatedRole = simulatedOverride ?? actualRole;

  const [activeTab, setActiveTab] = useState<AdminTab>('NOTICES');
  const [requestAccessModalOpen, setRequestAccessModalOpen] = useState(false);

  const currentAdminName = user?.displayName ?? 'Administrator';
  const currentUserEmail = user?.email.toLowerCase() ?? '';

  // Check if active tab is permitted for simulated role
  const isTabAllowed = ROLE_PERMISSIONS[simulatedRole].allowedTabs.includes(activeTab);

  return (
    <div className="dock-safe relative min-h-screen flex flex-col bg-[#07130f] text-slate-100">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Admin Command Center View */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-6 w-full flex-1">
        {/* Judul panel */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-1 pb-5">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-white">Panel Admin</h1>
            <p className="mt-1 text-sm text-slate-400">
              {currentAdminName} · {ROLE_PERMISSIONS[actualRole].label}
            </p>
          </div>

          {/* Pratinjau tampilan per role (khusus IT Admin) */}
          {actualRole === 'IT_ADMIN' && (
            <label className="flex items-center gap-2 text-xs text-slate-400">
              <span className="shrink-0">Pratinjau sebagai</span>
              <select
                value={simulatedRole}
                onChange={(e) => setSimulatedRole(e.target.value as UserRole)}
                className="h-10 min-w-0 flex-1 sm:flex-none px-3 rounded-xl bg-[#0a2319] border border-amber-500/30 text-sm text-white focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="IT_ADMIN">IT Admin</option>
                <option value="EXECUTIVE">Pimpinan</option>
                <option value="OPERATIONAL">Staf Operasional</option>
                <option value="FINANCE_WAREHOUSE">Staf Keuangan & Gudang</option>
              </select>
            </label>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 2. COMMAND CENTER TABS WITH PERMISSION BADGES                             */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2 border-b border-amber-500/20 pb-3 mb-8 overflow-x-auto scrollbar-none">
          {/* TAB 1: NOTIFIKASI */}
          <button
            onClick={() => setActiveTab('NOTICES')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'NOTICES'
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-950/60 border border-amber-400/40'
                : 'bg-[#0a1f17] text-slate-300 hover:text-white hover:bg-emerald-950/60 border border-amber-500/15'
            }`}
          >
            <Bell className="w-4 h-4 text-amber-400" />
            <span suppressHydrationWarning>1. Notifikasi ({notices.length})</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 text-emerald-300">Semua Role</span>
          </button>

          {/* TAB 2: AGENDA BUDAYA */}
          <button
            onClick={() => setActiveTab('EVENTS')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'EVENTS'
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-950/60 border border-amber-400/40'
                : 'bg-[#0a1f17] text-slate-300 hover:text-white hover:bg-emerald-950/60 border border-amber-500/15'
            }`}
          >
            <CalendarDays className="w-4 h-4 text-amber-400" />
            <span suppressHydrationWarning>2. Agenda Budaya ({events.length})</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 text-amber-300">Ops/Pimpinan</span>
          </button>

          {/* TAB 3: DOKUMEN & SOP */}
          <button
            onClick={() => setActiveTab('DOCUMENTS')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'DOCUMENTS'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-950/60 border border-emerald-400/40'
                : 'bg-[#0a1f17] text-slate-300 hover:text-white hover:bg-emerald-950/60 border border-amber-500/15'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span suppressHydrationWarning>3. Dokumen & SOP ({documents.length})</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 text-teal-300">G-Drive</span>
          </button>

          {/* TAB 4: WHITELIST KARYAWAN */}
          <button
            onClick={() => setActiveTab('WHITELIST')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'WHITELIST'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-lg shadow-purple-950/60 border border-purple-400/40'
                : 'bg-[#0a1f17] text-slate-300 hover:text-white hover:bg-emerald-950/60 border border-amber-500/15'
            }`}
          >
            <Users className="w-4 h-4 text-purple-400" />
            <span suppressHydrationWarning>4. Whitelist Karyawan ({whitelist.length})</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/40">Khusus IT</span>
          </button>

          {/* TAB 5: PERMOHONAN AKSES */}
          <button
            onClick={() => setActiveTab('REQUESTS')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'REQUESTS'
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-950/60 border border-amber-400/40'
                : 'bg-[#0a1f17] text-slate-300 hover:text-white hover:bg-emerald-950/60 border border-amber-500/15'
            }`}
          >
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span suppressHydrationWarning>5. Permohonan Akses ({requests.filter((r) => r.status === 'PENDING').length})</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 text-amber-300">Pimpinan/IT</span>
          </button>

          {/* TAB 6: LINK APLIKASI */}
          <button
            onClick={() => setActiveTab('APPS')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'APPS'
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-950/60 border border-amber-400/40'
                : 'bg-[#0a1f17] text-slate-300 hover:text-white hover:bg-emerald-950/60 border border-amber-500/15'
            }`}
          >
            <Link2 className="w-4 h-4 text-emerald-400" />
            <span suppressHydrationWarning>6. Link Aplikasi ({apps.length})</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 text-slate-400">Khusus IT</span>
          </button>

          {/* TAB 7: INFORMASI YAYASAN */}
          <button
            onClick={() => setActiveTab('INFO')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'INFO'
                ? 'bg-gradient-to-r from-cyan-600 to-teal-700 text-white shadow-lg shadow-cyan-950/60 border border-cyan-400/40'
                : 'bg-[#0a1f17] text-slate-300 hover:text-white hover:bg-emerald-950/60 border border-amber-500/15'
            }`}
          >
            <Info className="w-4 h-4 text-cyan-400" />
            <span>7. Info Yayasan</span>
          </button>

          {/* TAB 8: AUDIT LOGS */}
          <button
            onClick={() => setActiveTab('LOGS')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'LOGS'
                ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-lg border border-slate-500/40'
                : 'bg-[#0a1f17] text-slate-300 hover:text-white hover:bg-emerald-950/60 border border-amber-500/15'
            }`}
          >
            <History className="w-4 h-4 text-slate-400" />
            <span suppressHydrationWarning>8. Audit Logs ({auditLogs.length})</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* ACCESS GUARD: TAMPILKAN RESTRIKSI JIKA ROLE TIDAK DIIZINKAN              */}
        {/* ========================================================================= */}
        {!isTabAllowed ? (
          <div className="p-8 sm:p-10 rounded-3xl bg-[#091f17] border-2 border-rose-500/40 text-center space-y-4 shadow-2xl relative overflow-hidden">
            <PapuanBorderCorner position="top-right" />
            <PapuanBorderCorner position="bottom-left" />

            <div className="w-16 h-16 rounded-3xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-white font-serif">
                Akses Terbatas / Restriksi Otorisasi
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Role Anda saat ini (<strong className="text-amber-300">{ROLE_PERMISSIONS[simulatedRole].label}</strong>) tidak memiliki izin untuk mengelola tab ini.
              </p>
              <p className="text-[11px] text-slate-400">
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

              <button
                type="button"
                onClick={() => setActiveTab('NOTICES')}
                className="px-4 py-2.5 rounded-xl bg-[#0c281e] hover:bg-[#12382c] border border-amber-500/30 text-amber-300 text-xs font-bold transition-all cursor-pointer"
              >
                Kembali ke Tab Terbuka
              </button>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'NOTICES' && <NoticesTab notices={notices} currentAdminName={currentAdminName} />}
            {activeTab === 'EVENTS' && <EventsTab events={events} currentAdminName={currentAdminName} />}
            {activeTab === 'DOCUMENTS' && <DocumentsTab documents={documents} currentAdminName={currentAdminName} />}
            {activeTab === 'WHITELIST' && (
              <WhitelistTab whitelist={whitelist} currentUserEmail={currentUserEmail} currentAdminName={currentAdminName} />
            )}
            {activeTab === 'REQUESTS' && <RequestsTab requests={requests} currentAdminName={currentAdminName} />}
            {activeTab === 'APPS' && <AppsTab apps={apps} currentAdminName={currentAdminName} />}
            {activeTab === 'INFO' &&
              (data.infoLoaded ? (
                <InfoTab info={data.info} currentAdminName={currentAdminName} />
              ) : (
                <div className="p-10 flex justify-center" role="status" aria-label="Memuat informasi yayasan">
                  <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ))}
            {activeTab === 'LOGS' && <LogsTab auditLogs={auditLogs} actualRole={actualRole} currentAdminName={currentAdminName} />}
          </>
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
