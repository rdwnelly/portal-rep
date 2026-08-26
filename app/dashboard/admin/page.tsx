'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  getWhitelist,
  addWhitelistedUser,
  removeWhitelistedUser,
  getAppsList,
  addAppItem,
  updateAppItem,
  deleteAppItem,
  getNotices,
  addNotice,
  updateNotice,
  deleteNotice,
  togglePinNotice,
  getAccessRequests,
  resolveAccessRequest,
  getFoundationInfo,
  updateFoundationInfo
} from '@/lib/storage';
import {
  WhitelistedUser,
  AppItem,
  NoticeItem,
  AccessRequest,
  FoundationInfo,
  UserRole,
  AppStatus,
  AppCategory,
  NoticeCategory,
  NoticePriority
} from '@/lib/types';
import Navbar from '@/components/Navbar';
import PWAInstallModal from '@/components/PWAInstallModal';
import PWAInstallBanner from '@/components/PWAInstallBanner';
import Link from 'next/link';
import {
  ShieldCheck,
  Bell,
  Link2,
  Info,
  Users,
  UserPlus,
  Trash2,
  Edit2,
  Layers,
  ArrowLeft,
  Check,
  X,
  Plus,
  ExternalLink,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Pin,
  Save,
  Building,
  Phone,
  Clock,
  Sparkles,
  Mail,
  Lock,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PapuanBorderCorner } from '@/components/PapuanMotif';

const subscribeClient = () => () => {};

export default function AdminDashboardPage() {
  const {
    user,
    isInitialized,
    loginWithEmailPassword,
    isLoading: isAuthLoading,
    authError,
    clearAuthError
  } = useAuth();
  const isClient = useSyncExternalStore(subscribeClient, () => true, () => false);

  // Login form state for unauthenticated admin access
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginLocalError, setLoginLocalError] = useState('');

  // Active Admin Core Tab: NOTICES (Kelola Notifikasi), APPS (Kelola Link Aplikasi), INFO (Kelola Informasi), REQUESTS (Permohonan Akses), WHITELIST (Kelola Staf)
  const [activeTab, setActiveTab] = useState<'NOTICES' | 'APPS' | 'INFO' | 'REQUESTS' | 'WHITELIST'>('NOTICES');

  // Data States
  const [notices, setNotices] = useState<NoticeItem[]>(() => (typeof window !== 'undefined' ? getNotices() : []));
  const [apps, setApps] = useState<AppItem[]>(() => (typeof window !== 'undefined' ? getAppsList() : []));
  const [info, setInfo] = useState<FoundationInfo>(() => (typeof window !== 'undefined' ? getFoundationInfo() : getFoundationInfo()));
  const [requests, setRequests] = useState<AccessRequest[]>(() => (typeof window !== 'undefined' ? getAccessRequests() : []));
  const [whitelist, setWhitelist] = useState<WhitelistedUser[]>(() => (typeof window !== 'undefined' ? getWhitelist() : []));

  const [pwaModalOpen, setPwaModalOpen] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedReqId, setCopiedReqId] = useState<string | null>(null);

  // Form States: Kelola Notifikasi
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState<NoticeItem | null>(null);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeCategory, setNoticeCategory] = useState<NoticeCategory>('INSTRUCTION');
  const [noticePriority, setNoticePriority] = useState<NoticePriority>('HIGH');
  const [noticeIsPinned, setNoticeIsPinned] = useState(true);
  const [noticeAuthor, setNoticeAuthor] = useState('');

  // Form States: Kelola Aplikasi
  const [showAppModal, setShowAppModal] = useState(false);
  const [editingApp, setEditingApp] = useState<AppItem | null>(null);
  const [appTitle, setAppTitle] = useState('');
  const [appShortCode, setAppShortCode] = useState('');
  const [appUrl, setAppUrl] = useState('');
  const [appDescription, setAppDescription] = useState('');
  const [appCategory, setAppCategory] = useState<AppCategory>('OPERASIONAL');
  const [appStatus, setAppStatus] = useState<AppStatus>('ONLINE');
  const [appBadgeText, setAppBadgeText] = useState('');

  // Form States: Kelola Informasi Yayasan
  const [infoForm, setInfoForm] = useState<FoundationInfo>(info);
  const [infoSavedSuccess, setInfoSavedSuccess] = useState(false);

  // Form States: Tambah Whitelist
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('OPERATIONAL');
  const [newUserDept, setNewUserDept] = useState('Operasional & Frontdesk');

  const loadData = () => {
    setNotices(getNotices());
    setApps(getAppsList());
    const loadedInfo = getFoundationInfo();
    setInfo(loadedInfo);
    setInfoForm(loadedInfo);
    setRequests(getAccessRequests());
    setWhitelist(getWhitelist());
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

  // Guard: Otentikasi Admin Firebase Email & Password
  if (!user || (user.role !== 'IT_ADMIN' && user.role !== 'EXECUTIVE')) {
    const handleGuardEmailSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoginLocalError('');
      clearAuthError();

      if (!loginEmail.trim() || !loginPass.trim()) {
        setLoginLocalError('Mohon masukkan email dan kata sandi admin.');
        return;
      }

      const success = await loginWithEmailPassword(loginEmail.trim(), loginPass);
      if (success) {
        if (typeof window !== 'undefined') {
          confetti({
            particleCount: 50,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#e5a93c', '#0f382a', '#10b981', '#a855f7'],
          });
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.href = '/dashboard/admin';
        }
      }
    };

    return (
      <div className="relative min-h-screen flex flex-col justify-between bg-[#07130f] papuan-pattern-overlay text-slate-100 selection:bg-amber-500 selection:text-black">
        <Navbar onOpenPwaModal={() => setPwaModalOpen(true)} />

        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 pb-32 md:pb-12">
          <div className="relative w-full max-w-md rounded-3xl glass-panel bg-[#091e16]/95 border-2 border-purple-500/40 shadow-2xl overflow-hidden p-6 sm:p-8">
            <PapuanBorderCorner />

            <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />

            <div className="text-center mb-6 relative z-10">
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-700 to-indigo-950 border-2 border-purple-400/50 text-purple-200 mx-auto flex items-center justify-center shadow-xl shadow-black/50 mb-3">
                <ShieldCheck className="w-8 h-8 text-purple-300" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-[10px] font-extrabold uppercase tracking-wider mb-2">
                <Sparkles className="w-3 h-3" />
                <span>Otentikasi Firebase Admin</span>
              </div>
              <h1 className="text-2xl font-black text-white">Login Admin Diperlukan</h1>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Halaman ini dilindungi. Masukkan <strong>Email & Kata Sandi Firebase</strong> Anda untuk mengakses Panel Kontrol.
              </p>
            </div>

            {(loginLocalError || authError) && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs flex items-start gap-2 relative z-10 animate-in fade-in duration-200">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{loginLocalError || authError}</span>
              </div>
            )}

            <form onSubmit={handleGuardEmailSubmit} className="space-y-4 relative z-10">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-purple-400" />
                  <span>Email Administrator</span>
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="Masukkan email admin terdaftar..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-purple-500/30 text-base sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-purple-400" />
                  <span>Kata Sandi (Password)</span>
                </label>
                <div className="relative">
                  <input
                    type={showLoginPass ? 'text' : 'password'}
                    required
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    placeholder="Masukkan kata sandi Firebase"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#06140e] border border-purple-500/30 text-base sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPass(!showLoginPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-300 p-1 cursor-pointer"
                  >
                    {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isAuthLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-600 hover:to-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-purple-950/60 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-purple-400/40 disabled:opacity-50 mt-2"
              >
                {isAuthLoading ? (
                  <span>Memverifikasi akun Firebase...</span>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4 text-purple-300" />
                    <span>Masuk dengan Email & Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center mt-6 relative z-10">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke Halaman Utama</span>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const currentAdminName = user?.displayName || 'Ridwan Elly (IT Developer)';

  // ================= NOTICES HANDLERS =================
  const handleOpenNewNotice = () => {
    setEditingNotice(null);
    setNoticeTitle('');
    setNoticeContent('');
    setNoticeCategory('INSTRUCTION');
    setNoticePriority('HIGH');
    setNoticeIsPinned(true);
    setNoticeAuthor(currentAdminName);
    setShowNoticeModal(true);
  };

  const handleOpenEditNotice = (n: NoticeItem) => {
    setEditingNotice(n);
    setNoticeTitle(n.title);
    setNoticeContent(n.content);
    setNoticeCategory(n.category);
    setNoticePriority(n.priority);
    setNoticeIsPinned(n.isPinned);
    setNoticeAuthor(n.authorName);
    setShowNoticeModal(true);
  };

  const handleSaveNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) return;

    if (editingNotice) {
      updateNotice(
        editingNotice.id,
        {
          title: noticeTitle.trim(),
          content: noticeContent.trim(),
          category: noticeCategory,
          priority: noticePriority,
          isPinned: noticeIsPinned,
          authorName: noticeAuthor.trim() || currentAdminName,
        },
        currentAdminName
      );
    } else {
      addNotice({
        title: noticeTitle.trim(),
        content: noticeContent.trim(),
        category: noticeCategory,
        priority: noticePriority,
        authorName: noticeAuthor.trim() || currentAdminName,
        authorRole: 'Admin Yayasan REP',
        isPinned: noticeIsPinned,
      });
    }

    if (typeof window !== 'undefined') {
      confetti({ particleCount: 25, spread: 50, origin: { y: 0.6 } });
    }

    setShowNoticeModal(false);
    loadData();
  };

  const handleDeleteNotice = (id: string, title: string) => {
    if (confirm(`Hapus notifikasi "${title}"?`)) {
      deleteNotice(id, currentAdminName);
      loadData();
    }
  };

  // ================= APPS HANDLERS =================
  const handleOpenNewApp = () => {
    setEditingApp(null);
    setAppTitle('');
    setAppShortCode('');
    setAppUrl('https://');
    setAppDescription('');
    setAppCategory('OPERASIONAL');
    setAppStatus('ONLINE');
    setAppBadgeText('Modul Baru');
    setShowAppModal(true);
  };

  const handleOpenEditApp = (a: AppItem) => {
    setEditingApp(a);
    setAppTitle(a.title);
    setAppShortCode(a.shortCode);
    setAppUrl(a.url);
    setAppDescription(a.description);
    setAppCategory(a.category);
    setAppStatus(a.status);
    setAppBadgeText(a.badgeText);
    setShowAppModal(true);
  };

  const handleSaveApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appTitle.trim() || !appUrl.trim()) return;

    if (editingApp) {
      updateAppItem(
        editingApp.id,
        {
          title: appTitle.trim(),
          shortCode: appShortCode.trim().toUpperCase() || 'APP',
          url: appUrl.trim(),
          description: appDescription.trim(),
          category: appCategory,
          status: appStatus,
          badgeText: appBadgeText.trim(),
        },
        currentAdminName
      );
    } else {
      addAppItem(
        {
          title: appTitle.trim(),
          shortCode: appShortCode.trim().toUpperCase() || 'APP',
          description: appDescription.trim() || 'Modul sistem terintegrasi Yayasan Rumah Etnik Papua.',
          category: appCategory,
          iconName: appCategory === 'OPERASIONAL' ? 'BedDouble' : appCategory === 'KEUANGAN' ? 'Landmark' : appCategory === 'GUDANG_POS' ? 'ShoppingBag' : 'Camera',
          url: appUrl.trim(),
          status: appStatus,
          allowedRoles: ['EXECUTIVE', 'OPERATIONAL', 'FINANCE_WAREHOUSE', 'IT_ADMIN'],
          badgeText: appBadgeText.trim() || 'Live Vercel',
          colorTheme: {
            from: 'from-amber-700',
            to: 'to-amber-950',
            accent: 'text-amber-400',
            border: 'border-amber-500/30',
          },
        },
        currentAdminName
      );
    }

    if (typeof window !== 'undefined') {
      confetti({ particleCount: 25, spread: 50, origin: { y: 0.6 } });
    }

    setShowAppModal(false);
    loadData();
  };

  const handleDeleteApp = (id: string, title: string) => {
    if (confirm(`Hapus aplikasi "${title}" dari portal?`)) {
      deleteAppItem(id, currentAdminName);
      loadData();
    }
  };

  // ================= INFO HANDLERS =================
  const handleSaveFoundationInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateFoundationInfo(infoForm, currentAdminName);
    setInfoSavedSuccess(true);
    setTimeout(() => setInfoSavedSuccess(false), 3000);
    if (typeof window !== 'undefined') {
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
    }
    loadData();
  };

  // ================= REQUESTS HANDLERS =================
  const handleResolveRequest = (req: AccessRequest, status: 'APPROVED' | 'REJECTED') => {
    const role: UserRole = req.department.includes('Keuangan')
      ? 'FINANCE_WAREHOUSE'
      : req.department.includes('Manajemen') || req.department.includes('Pengurus')
      ? 'EXECUTIVE'
      : 'OPERATIONAL';

    resolveAccessRequest(req.id, status, currentAdminName, role);
    loadData();
  };

  const handleCopyWaMessage = (r: AccessRequest) => {
    const text = `Halo ${r.name},\n\nPendaftaran akun Anda untuk *${r.appTitle || 'PORTAL REP'}* telah DISETUJUI & DIVERIFIKASI oleh Admin IT Yayasan Rumah Etnik Papua.\n\nDetail Akun Anda:\n📧 Email: ${r.email}\n🔑 Password: ${r.proposedPassword || '(Sesuai pendaftaran)'}\n🌐 Portal: http://localhost:3008/\n\nSilakan langsung membuka dan menggunakan sistem. Terima kasih!`;
    navigator.clipboard.writeText(text);
    setCopiedReqId(r.id);
    setTimeout(() => setCopiedReqId(null), 2000);
  };

  // ================= WHITELIST HANDLERS =================
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    addWhitelistedUser(
      {
        name: newUserName.trim(),
        email: newUserEmail.trim().toLowerCase(),
        role: newUserRole,
        roleTitle: newUserRole === 'EXECUTIVE' ? 'Pengurus Yayasan' : newUserRole === 'FINANCE_WAREHOUSE' ? 'Staf Keuangan/Gudang' : newUserRole === 'IT_ADMIN' ? 'IT Developer' : 'Staf Operasional',
        department: newUserDept,
        active: true,
        addedBy: currentAdminName,
      },
      currentAdminName
    );

    setShowAddUserModal(false);
    setNewUserName('');
    setNewUserEmail('');
    loadData();
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#07130f] papuan-pattern-overlay text-slate-100 selection:bg-amber-500 selection:text-black">
      {/* Navbar */}
      <Navbar onOpenPwaModal={() => setPwaModalOpen(true)} />

      {/* Main Admin View with safe mobile bottom spacing */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full flex-1 pb-32 md:pb-8">
        {/* Admin Header Banner */}
        <div className="relative rounded-3xl overflow-hidden border-2 border-purple-500/30 shadow-2xl bg-gradient-to-r from-[#140b24] via-[#0e1e17] to-[#071711] p-5 sm:p-8 mb-6 sm:mb-8">
          <PapuanBorderCorner />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-bold mb-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>Panel Kontrol Administrator Yayasan</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                Kelola Portal Rumah Etnik Papua
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Administrator Aktif: <strong className="text-amber-400">{currentAdminName}</strong>
              </p>
            </div>

            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold transition-all shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Beranda Portal</span>
            </Link>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3 CORE ADMIN TABS: KELOLA NOTIFIKASI, KELOLA LINK APLIKASI, KELOLA INFO   */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2 border-b border-amber-500/20 pb-3 mb-8 overflow-x-auto scrollbar-none">
          {/* TAB 1: KELOLA NOTIFIKASI */}
          <button
            onClick={() => setActiveTab('NOTICES')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'NOTICES'
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-950/60 border border-amber-400/40'
                : 'bg-[#0a1f17] text-slate-300 hover:text-white hover:bg-emerald-950/60 border border-amber-500/15'
            }`}
          >
            <Bell className="w-4 h-4 text-amber-400" />
            <span>1. Kelola Notifikasi ({notices.length})</span>
          </button>

          {/* TAB 2: KELOLA LINK APLIKASI */}
          <button
            onClick={() => setActiveTab('APPS')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'APPS'
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-950/60 border border-amber-400/40'
                : 'bg-[#0a1f17] text-slate-300 hover:text-white hover:bg-emerald-950/60 border border-amber-500/15'
            }`}
          >
            <Link2 className="w-4 h-4 text-emerald-400" />
            <span>2. Kelola Link Aplikasi ({apps.length})</span>
          </button>

          {/* TAB 3: KELOLA INFORMASI */}
          <button
            onClick={() => setActiveTab('INFO')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'INFO'
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-950/60 border border-amber-400/40'
                : 'bg-[#0a1f17] text-slate-300 hover:text-white hover:bg-emerald-950/60 border border-amber-500/15'
            }`}
          >
            <Info className="w-4 h-4 text-cyan-400" />
            <span>3. Kelola Informasi Yayasan</span>
          </button>

          {/* TAB 4: PERMOHONAN AKSES */}
          <button
            onClick={() => setActiveTab('REQUESTS')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'REQUESTS'
                ? 'bg-gradient-to-r from-purple-700 to-indigo-800 text-white shadow-lg shadow-purple-950/60 border border-purple-400/40'
                : 'bg-[#0a1f17] text-slate-300 hover:text-white hover:bg-purple-950/40 border border-purple-500/15'
            }`}
          >
            <KeyRound className="w-4 h-4 text-purple-400" />
            <span>Permohonan Akses ({requests.filter((r) => r.status === 'PENDING').length})</span>
          </button>

          {/* TAB 5: WHITELIST & AUDIT LOGS */}
          <button
            onClick={() => setActiveTab('WHITELIST')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'WHITELIST'
                ? 'bg-gradient-to-r from-purple-700 to-indigo-800 text-white shadow-lg shadow-purple-950/60 border border-purple-400/40'
                : 'bg-[#0a1f17] text-slate-300 hover:text-white hover:bg-purple-950/40 border border-purple-500/15'
            }`}
          >
            <Users className="w-4 h-4 text-slate-400" />
            <span>Daftar Whitelist ({whitelist.length})</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: KELOLA NOTIFIKASI & PENGUMUMAN                                     */}
        {/* ========================================================================= */}
        {activeTab === 'NOTICES' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-400" />
                  <span>Kelola Notifikasi & Pengumuman Internal Staf</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Buat, perbarui, sematkan (pin), atau hapus pengumuman resmi dari Pengurus Yayasan REP.
                </p>
              </div>

              <button
                onClick={handleOpenNewNotice}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-white text-xs font-bold shadow-lg shadow-amber-950/60 transition-all cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Pengumuman Baru</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notices.map((n) => (
                <div
                  key={n.id}
                  className="p-5 rounded-2xl glass-panel bg-[#091b14] border border-amber-500/25 shadow-xl flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-500/30">
                          {n.category}
                        </span>
                        {n.isPinned && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <Pin className="w-3 h-3 text-emerald-400" />
                            <span>Pinned</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(n.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white leading-snug">{n.title}</h3>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed line-clamp-4">{n.content}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400 truncate">
                      Oleh: <strong className="text-slate-200">{n.authorName}</strong>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          togglePinNotice(n.id);
                          loadData();
                        }}
                        className={`p-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                          n.isPinned
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                        title={n.isPinned ? 'Lepas Sematan' : 'Sematkan ke Beranda'}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleOpenEditNotice(n)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
                        title="Edit Notifikasi"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteNotice(n.id, n.title)}
                        className="p-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-300 transition-all cursor-pointer"
                        title="Hapus Notifikasi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: KELOLA LINK APLIKASI                                              */}
        {/* ========================================================================= */}
        {activeTab === 'APPS' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-emerald-400" />
                  <span>Kelola Tautan Resmi & Status Aplikasi Ekosistem</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Perbarui URL target Vercel/Website dan ubah status operasional modul sistem.
                </p>
              </div>

              <button
                onClick={handleOpenNewApp}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-950/60 transition-all cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Aplikasi Baru</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {apps.map((app) => (
                <div
                  key={app.id}
                  className="p-6 rounded-2xl glass-panel bg-[#091b14] border-2 border-amber-500/25 shadow-xl space-y-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-black text-amber-400 uppercase tracking-widest bg-amber-950/80 px-2.5 py-1 rounded-lg border border-amber-500/30">
                        {app.shortCode}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                          app.status === 'ONLINE'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                            : 'bg-amber-950 text-amber-300 border-amber-500/40'
                        }`}
                      >
                        ● {app.status === 'ONLINE' ? 'LIVE ONLINE' : app.status}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white">{app.title}</h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed line-clamp-2">{app.description}</p>

                    {/* URL Display */}
                    <div className="mt-3 p-2.5 rounded-xl bg-black/40 border border-slate-700 flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-amber-300 truncate">{app.url}</span>
                      <a
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 shrink-0"
                      >
                        <span>Tes Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-semibold">{app.badgeText}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditApp(app)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit Link</span>
                      </button>
                      <button
                        onClick={() => handleDeleteApp(app.id, app.title)}
                        className="p-2 rounded-xl bg-red-950 hover:bg-red-900 text-red-300 border border-red-500/30 cursor-pointer"
                        title="Hapus Aplikasi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: KELOLA INFORMASI YAYASAN & PROFIL                                  */}
        {/* ========================================================================= */}
        {activeTab === 'INFO' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Info className="w-5 h-5 text-cyan-400" />
                  <span>Kelola Informasi Yayasan & Pengaturan Tampilan Portal</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Ubah profil yayasan, teks sambutan beranda, alamat kantor di Sorong, dan kontak IT Helpdesk.
                </p>
              </div>

              {infoSavedSuccess && (
                <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 animate-pulse">
                  <Check className="w-4 h-4" />
                  <span>Informasi Berhasil Disimpan!</span>
                </span>
              )}
            </div>

            <form onSubmit={handleSaveFoundationInfo} className="p-6 rounded-3xl glass-panel bg-[#091b14] border-2 border-amber-500/25 shadow-xl space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-amber-400" />
                    <span>Nama Yayasan / Organisasi</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={infoForm.organizationName}
                    onChange={(e) => setInfoForm({ ...infoForm, organizationName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-amber-500/30 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tagline / Slogan</span>
                  </label>
                  <input
                    type="text"
                    value={infoForm.tagline}
                    onChange={(e) => setInfoForm({ ...infoForm, tagline: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-amber-500/30 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Alamat Kantor & Lokasi (Sorong, Papua Barat Daya)
                </label>
                <input
                  type="text"
                  required
                  value={infoForm.address}
                  onChange={(e) => setInfoForm({ ...infoForm, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-amber-500/30 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Kontak IT Developer / Helpdesk</span>
                  </label>
                  <input
                    type="text"
                    value={infoForm.itHelpdeskName}
                    onChange={(e) => setInfoForm({ ...infoForm, itHelpdeskName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-amber-500/30 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Nomor WhatsApp IT Helpdesk</span>
                  </label>
                  <input
                    type="text"
                    value={infoForm.itHelpdeskPhone}
                    onChange={(e) => setInfoForm({ ...infoForm, itHelpdeskPhone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-amber-500/30 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Jam Operasional Staf (WIT)</span>
                  </label>
                  <input
                    type="text"
                    value={infoForm.operationalHours}
                    onChange={(e) => setInfoForm({ ...infoForm, operationalHours: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-amber-500/30 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Teks Deskripsi Sambutan Beranda
                </label>
                <textarea
                  rows={2}
                  value={infoForm.heroDescription}
                  onChange={(e) => setInfoForm({ ...infoForm, heroDescription: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-amber-500/30 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-800">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white text-xs font-bold shadow-lg shadow-cyan-950/60 transition-all cursor-pointer active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Informasi Yayasan</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: PERMOHONAN AKSES STAF (EMAIL & PASSWORD VERIFIKASI)                */}
        {/* ========================================================================= */}
        {activeTab === 'REQUESTS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Daftar Permohonan Akses & Pendaftaran Akun Staf</h3>
                <p className="text-xs text-slate-400">
                  Verifikasi email dan kata sandi yang diajukan oleh staf untuk didaftarkan ke sistem whitelist yayasan.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-500/30">
                {requests.filter((r) => r.status === 'PENDING').length} Menunggu Persetujuan
              </span>
            </div>

            {requests.length === 0 ? (
              <div className="p-12 text-center rounded-2xl glass-panel bg-[#091a13] border border-amber-500/20 text-xs text-slate-400">
                Belum ada permohonan akses baru yang masuk.
              </div>
            ) : (
              <div className="space-y-3.5">
                {requests.map((req) => {
                  const isPasswordVisible = visiblePasswords[req.id] || false;
                  const isCopied = copiedReqId === req.id;

                  return (
                    <div
                      key={req.id}
                      className="p-5 rounded-2xl glass-panel bg-[#091b14] border-2 border-amber-500/25 shadow-xl space-y-3"
                    >
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
                              <span className="text-slate-400">No. WhatsApp:</span>
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

                      <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                        <div className="text-[11px] text-slate-400">
                          {req.approvedBy && (
                            <span>
                              Diverifikasi oleh: <strong className="text-slate-200">{req.approvedBy}</strong>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleCopyWaMessage(req)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-600 cursor-pointer"
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

        {/* ========================================================================= */}
        {/* TAB 5: WHITELIST STAF                                                    */}
        {/* ========================================================================= */}
        {activeTab === 'WHITELIST' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Daftar Akun Terdaftar & Ter-Whitelist</h3>
                <p className="text-xs text-slate-400">Seluruh staf resmi Yayasan Rumah Etnik Papua yang berhak mengakses sistem.</p>
              </div>

              <button
                onClick={() => setShowAddUserModal(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-600 hover:to-indigo-700 text-white text-xs font-bold cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Tambah Staf Manual</span>
              </button>
            </div>

            <div className="rounded-2xl glass-panel bg-[#091b14] border border-amber-500/20 overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0c241b] text-slate-300 border-b border-slate-800">
                  <tr>
                    <th className="p-3.5 font-bold">Nama Staf</th>
                    <th className="p-3.5 font-bold">Email</th>
                    <th className="p-3.5 font-bold">Role / Divisi</th>
                    <th className="p-3.5 font-bold">Status</th>
                    <th className="p-3.5 font-bold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {whitelist.map((u) => (
                    <tr key={u.id} className="hover:bg-emerald-950/20">
                      <td className="p-3.5 font-bold text-white">{u.name}</td>
                      <td className="p-3.5 font-mono text-amber-300">{u.email}</td>
                      <td className="p-3.5 text-slate-300">{u.roleTitle} ({u.department})</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.active ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-red-950 text-red-300 border border-red-500/40'}`}>
                          {u.active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {u.email !== 'ridwanelly123@gmail.com' && (
                          <button
                            onClick={() => {
                              if (confirm(`Hapus ${u.name} dari whitelist?`)) {
                                removeWhitelistedUser(u.id, currentAdminName);
                                loadData();
                              }
                            }}
                            className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-400 cursor-pointer"
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
        )}
      </main>

      {/* ================= MODAL TAMBAH / EDIT NOTIFIKASI ================= */}
      {showNoticeModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl glass-panel bg-[#091e16] border-t-2 sm:border-2 border-amber-500/40 shadow-2xl p-6 pb-safe-bottom overflow-hidden max-h-[92dvh] overflow-y-auto">
            <PapuanBorderCorner />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-400" />
                <span>{editingNotice ? 'Edit Notifikasi Pengumuman' : 'Buat Notifikasi Pengumuman Baru'}</span>
              </h3>
              <button onClick={() => setShowNoticeModal(false)} className="p-1.5 rounded-lg text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNotice} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Judul Notifikasi</label>
                <input
                  type="text"
                  required
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder="misal: Jadwal Operasional Homestay Libur Nasional"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-amber-500/30 text-base sm:text-xs text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Kategori</label>
                  <select
                    value={noticeCategory}
                    onChange={(e) => setNoticeCategory(e.target.value as NoticeCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-amber-500/30 text-base sm:text-xs text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="INSTRUCTION">Instruksi Kerja</option>
                    <option value="AGENDA">Agenda Kegiatan</option>
                    <option value="SOP">SOP Yayasan</option>
                    <option value="ANNOUNCEMENT">Pengumuman Umum</option>
                    <option value="URGENT">Penting / Darurat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Penulis Pengumuman</label>
                  <input
                    type="text"
                    value={noticeAuthor}
                    onChange={(e) => setNoticeAuthor(e.target.value)}
                    placeholder="Bpk. Fricky / Ibu Mitshi / Ridwan"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-amber-500/30 text-base sm:text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Isi Lengkap Pengumuman</label>
                <textarea
                  required
                  rows={4}
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  placeholder="Tuliskan instruksi atau pengumuman resmi di sini..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-amber-500/30 text-base sm:text-xs text-white focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={noticeIsPinned}
                  onChange={(e) => setNoticeIsPinned(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="pinCheck" className="text-xs text-slate-300 cursor-pointer">
                  Sematkan pengumuman ini di halaman utama (Pinned)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNoticeModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-white text-xs font-bold"
                >
                  Simpan Notifikasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL TAMBAH / EDIT APLIKASI ================= */}
      {showAppModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl glass-panel bg-[#091e16] border-t-2 sm:border-2 border-emerald-500/40 shadow-2xl p-6 pb-safe-bottom overflow-hidden max-h-[92dvh] overflow-y-auto">
            <PapuanBorderCorner />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Link2 className="w-5 h-5 text-emerald-400" />
                <span>{editingApp ? 'Edit Tautan & Konfigurasi Aplikasi' : 'Tambah Modul Aplikasi Baru'}</span>
              </h3>
              <button onClick={() => setShowAppModal(false)} className="p-1.5 rounded-lg text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveApp} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">Nama Aplikasi</label>
                  <input
                    type="text"
                    required
                    value={appTitle}
                    onChange={(e) => setAppTitle(e.target.value)}
                    placeholder="misal: Sistem Manajemen Reservasi"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-emerald-500/30 text-base sm:text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Kode Singkat</label>
                  <input
                    type="text"
                    required
                    value={appShortCode}
                    onChange={(e) => setAppShortCode(e.target.value)}
                    placeholder="RESERVASI"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-emerald-500/30 text-base sm:text-xs text-white uppercase focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">URL Target Resmi (Link Vercel / Website)</label>
                <input
                  type="url"
                  required
                  value={appUrl}
                  onChange={(e) => setAppUrl(e.target.value)}
                  placeholder="https://apk-reservasi-homestay-rep.vercel.app"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-emerald-500/30 text-base sm:text-xs text-amber-300 font-mono focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Kategori</label>
                  <select
                    value={appCategory}
                    onChange={(e) => setAppCategory(e.target.value as AppCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-emerald-500/30 text-base sm:text-xs text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="OPERASIONAL">Homestay & Operasional</option>
                    <option value="KEUANGAN">Keuangan (SIK-REP)</option>
                    <option value="GUDANG_POS">POS Kasir & Logistik</option>
                    <option value="MEDIA_KREATIF">Media Kreatif (Zeey Studio)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Status Operasional</label>
                  <select
                    value={appStatus}
                    onChange={(e) => setAppStatus(e.target.value as AppStatus)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-emerald-500/30 text-base sm:text-xs text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="ONLINE">ONLINE (Aktif Live)</option>
                    <option value="MAINTENANCE">MAINTENANCE (Perawatan)</option>
                    <option value="UPDATED">UPDATED (Versi Baru)</option>
                    <option value="OFFLINE">OFFLINE (Nonaktif)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={appDescription}
                  onChange={(e) => setAppDescription(e.target.value)}
                  placeholder="Keterangan fungsi aplikasi..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-emerald-500/30 text-base sm:text-xs text-white focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAppModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white text-xs font-bold"
                >
                  Simpan Aplikasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL TAMBAH STAF WHITELIST MANUAL ================= */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl glass-panel bg-[#091e16] border-t-2 sm:border-2 border-purple-500/40 shadow-2xl p-6 pb-safe-bottom overflow-hidden max-h-[92dvh] overflow-y-auto">
            <PapuanBorderCorner />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-400" />
                <span>Tambah Staf ke Whitelist Manual</span>
              </h3>
              <button onClick={() => setShowAddUserModal(false)} className="p-1.5 rounded-lg text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nama Staf</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="misal: Johanes Kambu"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-purple-500/30 text-base sm:text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Email Staf</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="staf@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-purple-500/30 text-base sm:text-xs text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Role / Peran</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-purple-500/30 text-base sm:text-xs text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="OPERATIONAL">Staf Operasional</option>
                    <option value="FINANCE_WAREHOUSE">Staf Keuangan/Gudang</option>
                    <option value="EXECUTIVE">Pengurus Yayasan</option>
                    <option value="IT_ADMIN">IT Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Divisi Kerja</label>
                  <input
                    type="text"
                    value={newUserDept}
                    onChange={(e) => setNewUserDept(e.target.value)}
                    placeholder="Frontdesk / Cafe"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-purple-500/30 text-base sm:text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-600 hover:to-indigo-700 text-white text-xs font-bold"
                >
                  Daftarkan Staf
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PWA Modal */}
      {pwaModalOpen && (
        <PWAInstallModal isOpen={pwaModalOpen} onClose={() => setPwaModalOpen(false)} />
      )}

      <PWAInstallBanner onOpenModal={() => setPwaModalOpen(true)} />
    </div>
  );
}
