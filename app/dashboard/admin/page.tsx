'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  getWhitelist,
  addWhitelistedUser,
  updateWhitelistedUser,
  removeWhitelistedUser,
  getAppsList,
  updateAppItem,
  getAuditLogs,
  getAccessRequests,
  resolveAccessRequest,
  resetToDefaults
} from '@/lib/storage';
import { WhitelistedUser, AppItem, AuditLog, AccessRequest, UserRole, AppStatus } from '@/lib/types';
import Navbar from '@/components/Navbar';
import PWAInstallModal from '@/components/PWAInstallModal';
import Link from 'next/link';
import {
  ShieldCheck,
  Users,
  UserPlus,
  Trash2,
  Edit2,
  History,
  Cloud,
  Layers,
  ArrowLeft,
  Search,
  Check,
  X,
  AlertCircle,
  RefreshCw,
  Terminal,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';

const subscribeClient = () => () => {};

export default function AdminPage() {
  const { user, isInitialized } = useAuth();
  const isClient = useSyncExternalStore(subscribeClient, () => true, () => false);

  const [activeTab, setActiveTab] = useState<'WHITELIST' | 'REQUESTS' | 'APPS' | 'LOGS' | 'FIREBASE'>('WHITELIST');
  const [whitelist, setWhitelist] = useState<WhitelistedUser[]>(() => (typeof window !== 'undefined' ? getWhitelist() : []));
  const [apps, setApps] = useState<AppItem[]>(() => (typeof window !== 'undefined' ? getAppsList() : []));
  const [logs, setLogs] = useState<AuditLog[]>(() => (typeof window !== 'undefined' ? getAuditLogs() : []));
  const [requests, setRequests] = useState<AccessRequest[]>(() => (typeof window !== 'undefined' ? getAccessRequests() : []));
  const [searchQuery, setSearchQuery] = useState('');
  const [pwaModalOpen, setPwaModalOpen] = useState(false);

  // Request visibility & copy state
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedReqId, setCopiedReqId] = useState<string | null>(null);

  // New user form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('OPERATIONAL');
  const [newDepartment, setNewDepartment] = useState('Operasional & Frontdesk');
  const [formError, setFormError] = useState('');

  // Edit App URL state
  const [editingApp, setEditingApp] = useState<AppItem | null>(null);
  const [appUrlInput, setAppUrlInput] = useState('');
  const [appStatusInput, setAppStatusInput] = useState<AppStatus>('ONLINE');

  const loadData = () => {
    setWhitelist(getWhitelist());
    setApps(getAppsList());
    setLogs(getAuditLogs());
    setRequests(getAccessRequests());
  };

  useEffect(() => {
    const handleStorageUpdate = () => {
      loadData();
    };

    window.addEventListener('portal_rep_storage_update', handleStorageUpdate);
    return () => window.removeEventListener('portal_rep_storage_update', handleStorageUpdate);
  }, []);

  if (!isClient || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07130f] text-amber-400">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentAdminName = user?.displayName || 'Admin IT (Ridwan Elly)';
  const currentWhitelist = whitelist.length > 0 ? whitelist : getWhitelist();
  const currentApps = apps.length > 0 ? apps : getAppsList();
  const currentLogs = logs.length > 0 ? logs : getAuditLogs();
  const currentRequests = requests.length > 0 ? requests : getAccessRequests();

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!newName || !newEmail) {
      setFormError('Nama dan email wajib diisi.');
      return;
    }

    try {
      const getTitle = (r: UserRole) => {
        if (r === 'EXECUTIVE') return 'Manajemen Eksekutif';
        if (r === 'IT_ADMIN') return 'IT Developer / Administrator';
        if (r === 'FINANCE_WAREHOUSE') return 'Staf Keuangan / Gudang';
        return 'Staf Operasional';
      };

      addWhitelistedUser(
        {
          name: newName.trim(),
          email: newEmail.trim().toLowerCase(),
          role: newRole,
          roleTitle: getTitle(newRole),
          department: newDepartment,
          active: true,
          addedBy: currentAdminName,
        },
        currentAdminName
      );

      if (typeof window !== 'undefined') {
        confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
      }

      setShowAddModal(false);
      setNewName('');
      setNewEmail('');
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menambahkan staf ke whitelist.';
      setFormError(msg);
    }
  };

  const handleToggleUserActive = (u: WhitelistedUser) => {
    updateWhitelistedUser(u.id, { active: !u.active }, currentAdminName);
    loadData();
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (confirm(`Hapus ${name} dari daftar whitelist yayasan?`)) {
      removeWhitelistedUser(id, currentAdminName);
      loadData();
    }
  };

  const handleSaveAppConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp) return;

    updateAppItem(
      editingApp.id,
      {
        url: appUrlInput,
        status: appStatusInput,
      },
      currentAdminName
    );

    setEditingApp(null);
    loadData();
  };

  const handleResolveRequest = (req: AccessRequest, status: 'APPROVED' | 'REJECTED') => {
    const role: UserRole = req.department.includes('Keuangan')
      ? 'FINANCE_WAREHOUSE'
      : req.department.includes('Manajemen') || req.department.includes('Pengurus')
      ? 'EXECUTIVE'
      : 'OPERATIONAL';

    resolveAccessRequest(req.id, status, currentAdminName, role);
    loadData();
  };

  const filteredWhitelist = currentWhitelist.filter((u) => {
    return (
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.roleTitle.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#07130f] papuan-pattern-overlay text-slate-100 selection:bg-amber-500 selection:text-black">
      <Navbar onOpenPwaModal={() => setPwaModalOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors mb-2 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Katalog Aplikasi
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-900/40 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-lg">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                    Panel Admin & Whitelist Keamanan
                  </h1>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
                    IT Internal
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Pengelolaan hak akses Single Sign-On (SSO) Yayasan Rumah Etnik Papua
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirm('Reset seluruh data ke konfigurasi awal bawaan PRD?')) {
                  resetToDefaults();
                  loadData();
                }
              }}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              title="Reset ke Data Bawaan"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Data</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('WHITELIST')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'WHITELIST'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-[#0c241b]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Whitelist Email Staf ({currentWhitelist.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('REQUESTS')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'REQUESTS'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-[#0c241b]'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            <span>Permohonan Akses ({currentRequests.filter((r) => r.status === 'PENDING').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('APPS')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'APPS'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-[#0c241b]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Konfigurasi Link Aplikasi</span>
          </button>

          <button
            onClick={() => setActiveTab('LOGS')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'LOGS'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-[#0c241b]'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Trail ({currentLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('FIREBASE')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'FIREBASE'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-[#0c241b]'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Status Cloud & Security Rules</span>
          </button>
        </div>

        {/* TAB 1: WHITELIST MANAGEMENT */}
        {activeTab === 'WHITELIST' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari email atau nama staf..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#091b14] border border-amber-500/20 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold shadow-lg shadow-amber-950/50 w-full sm:w-auto justify-center cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Tambah Email Staf ke Whitelist</span>
              </button>
            </div>

            {/* Whitelist Table */}
            <div className="rounded-2xl glass-panel bg-[#091a13]/90 border border-amber-500/20 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0c241b] text-slate-300 font-bold border-b border-amber-500/20 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-4">Staf & Email</th>
                      <th className="p-4">Peran (Role)</th>
                      <th className="p-4">Departemen</th>
                      <th className="p-4">Status Akses</th>
                      <th className="p-4">Didaftarkan Oleh</th>
                      <th className="p-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-500/10 text-slate-300">
                    {filteredWhitelist.map((u) => (
                      <tr key={u.id} className="hover:bg-[#0e291e]/60 transition-colors">
                        <td className="p-4">
                          <div>
                            <p className="font-bold text-white text-xs">{u.name}</p>
                            <p className="font-mono text-[11px] text-amber-400/90">{u.email}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              u.role === 'IT_ADMIN'
                                ? 'bg-purple-950 text-purple-300 border-purple-500/40'
                                : u.role === 'EXECUTIVE'
                                ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                                : 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                            }`}
                          >
                            {u.roleTitle}
                          </span>
                        </td>
                        <td className="p-4 text-slate-300">{u.department}</td>
                        <td className="p-4">
                          <button
                            onClick={() => handleToggleUserActive(u)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                              u.active
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 hover:bg-red-950 hover:text-red-300'
                                : 'bg-red-950/80 text-red-300 border-red-500/40 hover:bg-emerald-950 hover:text-emerald-300'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                u.active ? 'bg-emerald-400' : 'bg-red-400'
                              }`}
                            />
                            {u.active ? 'Diizinkan (Aktif)' : 'Dinonaktifkan'}
                          </button>
                        </td>
                        <td className="p-4 text-slate-400 text-[11px]">{u.addedBy}</td>
                        <td className="p-4 text-right">
                          {u.email !== user?.email && (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-400 transition-all cursor-pointer"
                              title="Hapus dari Whitelist"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ACCESS REQUESTS */}
        {activeTab === 'REQUESTS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Daftar Permohonan Akses & Pendaftaran Akun</h3>
                <p className="text-xs text-slate-400">
                  Verifikasi email dan kata sandi yang diajukan oleh staf untuk didaftarkan ke sistem whitelist yayasan.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-500/30">
                {currentRequests.filter((r) => r.status === 'PENDING').length} Menunggu Persetujuan
              </span>
            </div>

            {currentRequests.length === 0 ? (
              <div className="p-12 text-center rounded-2xl glass-panel bg-[#091a13] border border-amber-500/20 text-xs text-slate-400">
                Belum ada permohonan akses baru yang masuk.
              </div>
            ) : (
              <div className="space-y-3.5">
                {currentRequests.map((req) => {
                  const isPasswordVisible = visiblePasswords[req.id] || false;
                  const isCopied = copiedReqId === req.id;

                  const handleCopyWaMessage = (r: AccessRequest) => {
                    const text = `Halo ${r.name},\n\nPendaftaran akun Anda untuk *${r.appTitle || 'PORTAL REP'}* telah DISETUJUI & DIVERIFIKASI oleh Admin IT Yayasan Rumah Etnik Papua.\n\nDetail Akun Anda:\n📧 Email: ${r.email}\n🔑 Password: ${r.proposedPassword || '(Sesuai pendaftaran)'}\n🌐 Portal: http://localhost:3008/\n\nSilakan langsung login ke sistem. Terima kasih!`;
                    navigator.clipboard.writeText(text);
                    setCopiedReqId(r.id);
                    setTimeout(() => setCopiedReqId(null), 2000);
                  };

                  return (
                    <div
                      key={req.id}
                      className="p-5 rounded-2xl glass-panel bg-[#091b14] border-2 border-amber-500/25 shadow-xl space-y-3"
                    >
                      {/* Top Bar: Target App & Status */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-amber-600/30 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-amber-400" />
                            <span>{req.appTitle || 'Seluruh Ekosistem PORTAL REP'}</span>
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(req.requestedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </div>

                        <span
                          className={`text-[11px] font-extrabold px-3 py-0.5 rounded-full border self-start sm:self-auto ${
                            req.status === 'PENDING'
                              ? 'bg-amber-950/90 text-amber-300 border-amber-500/50 animate-pulse'
                              : req.status === 'APPROVED'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                              : 'bg-red-950 text-red-300 border-red-500/50'
                          }`}
                        >
                          ● {req.status === 'PENDING' ? 'MENUNGGU VERIFIKASI' : req.status === 'APPROVED' ? 'DISETUJUI (TERDAFTAR)' : 'DITOLAK'}
                        </span>
                      </div>

                      {/* Main Info Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1.5 bg-[#06140e] p-3 rounded-xl border border-slate-800/80">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Nama Lengkap Staf:</span>
                            <strong className="text-white text-sm">{req.name}</strong>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Email Login:</span>
                            <span className="font-mono text-amber-300 font-bold">{req.email}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Divisi / Unit:</span>
                            <span className="text-slate-200">{req.department}</span>
                          </div>
                          {req.phoneNumber && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">No. WhatsApp / HP:</span>
                              <a
                                href={`https://wa.me/${req.phoneNumber.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-400 hover:underline font-mono flex items-center gap-1 font-bold"
                              >
                                <span>{req.phoneNumber}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Proposed Password Box */}
                        <div className="space-y-2 bg-[#06140e] p-3 rounded-xl border border-slate-800/80 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-slate-400 font-semibold flex items-center gap-1">
                                <KeyRound className="w-3 h-3 text-amber-400" />
                                <span>Kata Sandi (Password) Diajukan:</span>
                              </span>
                              {req.proposedPassword && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setVisiblePasswords((prev) => ({
                                      ...prev,
                                      [req.id]: !prev[req.id],
                                    }))
                                  }
                                  className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  {isPasswordVisible ? (
                                    <>
                                      <EyeOff className="w-3 h-3" />
                                      <span>Sembunyikan</span>
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="w-3 h-3" />
                                      <span>Lihat Password</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>

                            <div className="p-2 rounded-lg bg-black/40 border border-slate-700 flex items-center justify-between">
                              <span className="font-mono text-xs text-amber-300 font-bold">
                                {req.proposedPassword
                                  ? isPasswordVisible
                                    ? req.proposedPassword
                                    : '••••••••••••'
                                  : '(Menggunakan Google SSO)'}
                              </span>
                              {req.proposedPassword && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(req.proposedPassword || '');
                                    alert('Password disalin ke clipboard!');
                                  }}
                                  className="p-1 rounded hover:bg-slate-700 text-slate-300"
                                  title="Salin Password"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-400 italic">
                            &quot;{req.reason}&quot;
                          </p>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                        <div className="text-[11px] text-slate-400">
                          {req.approvedBy && (
                            <span>
                              Diverifikasi oleh: <strong className="text-slate-200">{req.approvedBy}</strong>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Copy WhatsApp text button */}
                          <button
                            type="button"
                            onClick={() => handleCopyWaMessage(req)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-600 cursor-pointer"
                            title="Salin Pesan Konfirmasi WhatsApp untuk Staf"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-300 font-bold">Pesan WA Disalin!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-amber-400" />
                                <span>Salin Info WA Staf</span>
                              </>
                            )}
                          </button>

                          {req.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleResolveRequest(req, 'APPROVED')}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-950/50 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Setujui & Daftarkan Akun</span>
                              </button>
                              <button
                                onClick={() => handleResolveRequest(req, 'REJECTED')}
                                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-950 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-bold cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Tolak</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: APP URL CONFIGURATION */}
        {activeTab === 'APPS' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Kelola tautan resmi (URL target) dan status operasional 4 aplikasi inti Yayasan Rumah Etnik Papua.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentApps.map((app) => (
                <div
                  key={app.id}
                  className="p-5 rounded-2xl glass-panel bg-[#091b14] border border-amber-500/20 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black text-amber-400 tracking-wider">
                        {app.shortCode}
                      </span>
                      <h3 className="text-sm font-bold text-white">{app.title}</h3>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        app.status === 'ONLINE'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-950 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#06140e] border border-slate-800 text-xs space-y-1">
                    <p className="text-[10px] text-slate-400">Target Tautan SSO:</p>
                    <p className="font-mono text-amber-300 break-all">{app.url}</p>
                  </div>

                  <button
                    onClick={() => {
                      setEditingApp(app);
                      setAppUrlInput(app.url);
                      setAppStatusInput(app.status);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ubah URL & Status</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: AUDIT LOGS */}
        {activeTab === 'LOGS' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Audit trail aktivitas login, publikasi pengumuman, dan perubahan whitelist keamanan.
            </p>

            <div className="rounded-2xl glass-panel bg-[#091a13] border border-amber-500/20 p-4 space-y-2.5">
              {currentLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-[#06140e] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] text-amber-400 font-bold px-1.5 py-0.2 rounded bg-amber-950 border border-amber-500/30">
                        {log.action}
                      </span>
                      <span className="font-bold text-white">{log.userName}</span>
                      <span className="text-slate-500 text-[10px]">({log.userEmail})</span>
                    </div>
                    <p className="text-slate-300 text-xs">{log.details}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString('id-ID')} WIT
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: FIREBASE & SECURITY RULES */}
        {activeTab === 'FIREBASE' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl glass-panel bg-[#091b14] border border-amber-500/30 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Cloud className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Konfigurasi Firebase & Cloud Deployment</h2>
                  <p className="text-xs text-slate-400">
                    Panduan integrasi Google Firebase Auth & Firestore Rules untuk produksi.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#06140e] border border-amber-500/20 text-xs text-slate-300 space-y-3">
                <p className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4" /> Variabel Lingkungan (.env.local):
                </p>
                <pre className="p-3 rounded-lg bg-black/60 font-mono text-[11px] text-emerald-400 overflow-x-auto">
{`NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=portal-rep.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=portal-rep-yayasan
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=portal-rep.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef`}
                </pre>
                <p className="text-[11px] text-slate-400">
                  *Catatan: Sistem saat ini dilengkapi <strong>Built-in Dual Mode</strong> sehingga otomatis berjalan sempurna baik menggunakan Local Reactive Engine maupun Firebase Live Connection.
                </p>
              </div>

              {/* Firestore Security Rules */}
              <div className="p-4 rounded-xl bg-[#06140e] border border-amber-500/20 text-xs text-slate-300 space-y-3">
                <p className="font-bold text-amber-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Aturan Keamanan (Firestore Security Rules):
                </p>
                <pre className="p-3 rounded-lg bg-black/60 font-mono text-[11px] text-amber-300 overflow-x-auto">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Hanya user di whitelist yang dapat membaca pengumuman
    match /notices/{noticeId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/whitelisted_users/$(request.auth.token.email)).data.role in ['EXECUTIVE', 'IT_ADMIN'];
    }
    // Whitelist hanya bisa diubah oleh IT Developer (Ridwan Elly) / Admin
    match /whitelisted_users/{email} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/whitelisted_users/$(request.auth.token.email)).data.role == 'IT_ADMIN';
    }
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal Add Whitelist User */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl glass-panel bg-[#091d16] border border-amber-500/40 shadow-2xl p-6">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-900/60 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">Tambah Staf ke Whitelist</h2>
            <p className="text-xs text-slate-400 mb-4">
              Hanya email yang didaftarkan di sini yang dapat login ke portal.
            </p>

            {formError && (
              <div className="p-2.5 mb-3 rounded-lg bg-red-950 border border-red-500/40 text-xs text-red-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Petrus Kambuaya"
                  className="w-full px-3 py-2 rounded-xl bg-[#06140e] border border-amber-500/30 text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email Google Akun *</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="petrus.kambuaya@rumahetnikpapua.org"
                  className="w-full px-3 py-2 rounded-xl bg-[#06140e] border border-amber-500/30 text-white focus:outline-none focus:border-amber-400 font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Role / Peran</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl bg-[#06140e] border border-amber-500/30 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="OPERATIONAL">Staf Operasional</option>
                    <option value="FINANCE_WAREHOUSE">Keuangan / Gudang</option>
                    <option value="EXECUTIVE">Manajemen Eksekutif</option>
                    <option value="IT_ADMIN">IT Developer (Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Departemen</label>
                  <input
                    type="text"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    placeholder="Frontdesk / Cafe / SIK"
                    className="w-full px-3 py-2 rounded-xl bg-[#06140e] border border-amber-500/30 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-lg cursor-pointer"
                >
                  Daftarkan Staf
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit App Config */}
      {editingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl glass-panel bg-[#091d16] border border-amber-500/40 shadow-2xl p-6">
            <button
              onClick={() => setEditingApp(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-900/60 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">Ubah Pengaturan Aplikasi</h2>
            <p className="text-xs text-amber-400 font-bold mb-4">{editingApp.title}</p>

            <form onSubmit={handleSaveAppConfig} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">URL Target Resmi</label>
                <input
                  type="url"
                  value={appUrlInput}
                  onChange={(e) => setAppUrlInput(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-[#06140e] border border-amber-500/30 text-white focus:outline-none focus:border-amber-400 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Status Sistem</label>
                <select
                  value={appStatusInput}
                  onChange={(e) => setAppStatusInput(e.target.value as AppStatus)}
                  className="w-full px-3 py-2 rounded-xl bg-[#06140e] border border-amber-500/30 text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="ONLINE">ONLINE (Aktif & Live)</option>
                  <option value="MAINTENANCE">MAINTENANCE (Sedang Perawatan)</option>
                  <option value="UPDATED">UPDATED (Baru Diperbarui)</option>
                  <option value="OFFLINE">OFFLINE (Nonaktif)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingApp(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-lg cursor-pointer"
                >
                  Simpan Konfigurasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <PWAInstallModal
        isOpen={pwaModalOpen}
        onClose={() => setPwaModalOpen(false)}
      />
    </div>
  );
}
