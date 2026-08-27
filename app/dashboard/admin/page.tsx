'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
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
  updateFoundationInfo,
  INITIAL_FOUNDATION_INFO
} from '@/lib/storage';
import { INITIAL_APPS, INITIAL_NOTICES } from '@/lib/seed-data';
import {
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
import {
  ShieldCheck,
  Bell,
  Link2,
  Info,
  Trash2,
  Edit2,
  ArrowLeft,
  Check,
  X,
  Plus,
  ExternalLink,
  KeyRound,
  Eye,
  EyeOff,
  Pin,
  Save,
  Building,
  Sparkles,
  Mail,
  Lock,
  AlertTriangle,
  ArrowRight,
  MessageCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PapuanBorderCorner } from '@/components/PapuanMotif';

const subscribeClient = () => () => {};

export default function AdminDashboardPage() {
  const router = useRouter();
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

  // 4 Core Admin Tabs: NOTICES, APPS, INFO, REQUESTS
  const [activeTab, setActiveTab] = useState<'NOTICES' | 'APPS' | 'INFO' | 'REQUESTS'>('NOTICES');

  // Data States
  const [notices, setNotices] = useState<NoticeItem[]>(() => (typeof window !== 'undefined' ? getNotices() : INITIAL_NOTICES));
  const [apps, setApps] = useState<AppItem[]>(() => (typeof window !== 'undefined' ? getAppsList() : INITIAL_APPS));
  const [requests, setRequests] = useState<AccessRequest[]>(() => (typeof window !== 'undefined' ? getAccessRequests() : []));

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
  const [infoForm, setInfoForm] = useState<FoundationInfo>(() => (typeof window !== 'undefined' ? getFoundationInfo() : INITIAL_FOUNDATION_INFO));
  const [infoSavedSuccess, setInfoSavedSuccess] = useState(false);

  const loadData = () => {
    setNotices(getNotices());
    setApps(getAppsList());
    setInfoForm(getFoundationInfo());
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
            colors: ['#e5a93c', '#113527', '#10b981', '#a855f7'],
          });
        }
        router.push('/dashboard/admin');
      }
    };

    return (
      <div className="relative min-h-[100dvh] flex flex-col bg-[#07130f] papuan-pattern-overlay text-slate-100 selection:bg-amber-500 selection:text-black">
        <Navbar onOpenPwaModal={() => setPwaModalOpen(true)} />

        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 pb-28 sm:pb-12 w-full max-w-md mx-auto my-auto">
          <div className="relative w-full rounded-3xl glass-panel bg-[#091e16]/95 border-2 border-amber-500/40 shadow-2xl overflow-hidden p-6 sm:p-8">
            <PapuanBorderCorner />

            <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />

            <div className="text-center mb-6 relative z-10">
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#113527] to-[#0a2319] border-2 border-amber-400/50 text-amber-300 mx-auto flex items-center justify-center shadow-xl shadow-black/50 mb-3">
                <ShieldCheck className="w-8 h-8 text-amber-400" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[10px] font-extrabold uppercase tracking-wider mb-2">
                <Sparkles className="w-3 h-3" />
                <span>Otentikasi Firebase Admin</span>
              </div>
              <h1 className="text-2xl font-black text-white">Login Administrator</h1>
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
                <label className="text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span>Email Administrator</span>
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="Masukkan email admin terdaftar..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-amber-500/30 text-base sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kata Sandi (Password)</span>
                </label>
                <div className="relative">
                  <input
                    type={showLoginPass ? 'text' : 'password'}
                    required
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    placeholder="Masukkan kata sandi Firebase"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#06140e] border border-amber-500/30 text-base sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPass(!showLoginPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-300 p-1 cursor-pointer"
                  >
                    {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isAuthLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-white font-extrabold text-xs shadow-lg shadow-amber-950/60 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-amber-400/40 disabled:opacity-50 mt-2"
              >
                {isAuthLoading ? (
                  <span>Memverifikasi akun Firebase...</span>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4 text-amber-300" />
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
                <span>Kembali ke Beranda Portal</span>
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

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#07130f] papuan-pattern-overlay text-slate-100 selection:bg-amber-500 selection:text-black">
      {/* Navbar */}
      <Navbar onOpenPwaModal={() => setPwaModalOpen(true)} />

      {/* Main Admin View with safe mobile bottom spacing */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full flex-1 pb-36 md:pb-12">
        {/* Admin Header Banner */}
        <div className="relative rounded-3xl overflow-hidden border-2 border-amber-500/30 shadow-2xl bg-gradient-to-r from-[#0d281e] via-[#11382b] to-[#091f16] p-5 sm:p-8 mb-6 sm:mb-8">
          <PapuanBorderCorner />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold mb-2 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Panel Kontrol Administrator Yayasan</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-black text-white tracking-tight">
                Kelola Portal Rumah Etnik Papua
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">
                Administrator Aktif: <strong className="text-amber-400">{currentAdminName}</strong>
              </p>
            </div>

            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#091e16] hover:bg-[#0d2b1f] border border-amber-500/30 text-amber-200 hover:text-white text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Beranda Portal</span>
            </Link>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4 CORE ADMIN TABS: NOTIFIKASI, LINK APLIKASI, INFORMASI, PERMOHONAN AKSES */}
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
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-950/60 border border-amber-400/40'
                : 'bg-[#0a1f17] text-slate-300 hover:text-white hover:bg-emerald-950/60 border border-amber-500/15'
            }`}
          >
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span>4. Permohonan Akses ({requests.filter((r) => r.status === 'PENDING').length})</span>
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

                    <h3 className="text-base font-extrabold text-white leading-snug">{n.title}</h3>
                    <p className="text-xs text-slate-300 mt-2 line-clamp-3 leading-relaxed">{n.content}</p>

                    <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                      <span>Penulis: <strong className="text-slate-200">{n.authorName}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-amber-500/15">
                    <button
                      onClick={() => {
                        togglePinNotice(n.id);
                        loadData();
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        n.isPinned
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-white'
                      }`}
                    >
                      <Pin className="w-3 h-3" />
                      <span>{n.isPinned ? 'Lepas Pin' : 'Sematkan (Pin)'}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditNotice(n)}
                        className="p-2 rounded-lg bg-amber-950/60 hover:bg-amber-900 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        title="Edit Notifikasi"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleDeleteNotice(n.id, n.title)}
                        className="p-2 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        title="Hapus Notifikasi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
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
                  <span>Kelola Link & Konfigurasi Modul Aplikasi</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Ubah target tautan Vercel, nama modul, status operasional, dan keterangan sistem.
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {apps.map((app) => (
                <div
                  key={app.id}
                  className="p-5 rounded-2xl glass-panel bg-[#091b14] border border-amber-500/25 shadow-xl flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30">
                          {app.shortCode}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                          {app.category}
                        </span>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded ${app.status === 'ONLINE' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-red-950 text-red-300 border border-red-500/40'}`}>
                        ● {app.status}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-white leading-snug">{app.title}</h3>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-2">{app.description}</p>

                    <div className="mt-3 p-2 rounded-xl bg-[#06140e] border border-slate-800 text-[11px] font-mono text-emerald-400 break-all flex items-center justify-between gap-2">
                      <span className="truncate">{app.url}</span>
                      <a
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-slate-400 hover:text-white shrink-0"
                        title="Buka Link di Tab Baru"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-500/15">
                    <button
                      onClick={() => handleOpenEditApp(app)}
                      className="px-3 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Link</span>
                    </button>

                    <button
                      onClick={() => handleDeleteApp(app.id, app.title)}
                      className="px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: KELOLA INFORMASI YAYASAN & SOP                                     */}
        {/* ========================================================================= */}
        {activeTab === 'INFO' && (
          <div className="max-w-3xl mx-auto">
            <div className="rounded-3xl glass-panel bg-[#091b14] border-2 border-amber-500/30 p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-amber-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-950/60 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">Profil & Pengaturan Portal Yayasan</h2>
                    <p className="text-xs text-slate-400">Informasi operasional, helpdesk IT, dan panduan akses staf</p>
                  </div>
                </div>

                {infoSavedSuccess && (
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-3 py-1 rounded-full border border-emerald-500/40 animate-in fade-in">
                    ✓ Tersimpan!
                  </span>
                )}
              </div>

              <form onSubmit={handleSaveFoundationInfo} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Nama Yayasan / Lembaga</label>
                  <input
                    type="text"
                    value={infoForm.organizationName}
                    onChange={(e) => setInfoForm({ ...infoForm, organizationName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-amber-500/25 text-white font-medium focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Slogan / Tagline</label>
                  <input
                    type="text"
                    value={infoForm.tagline}
                    onChange={(e) => setInfoForm({ ...infoForm, tagline: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-amber-500/25 text-white font-medium focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Alamat Kantor & Operasional</label>
                  <textarea
                    rows={2}
                    value={infoForm.address}
                    onChange={(e) => setInfoForm({ ...infoForm, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-amber-500/25 text-white font-medium focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Nama IT Developer / Helpdesk</label>
                    <input
                      type="text"
                      value={infoForm.itHelpdeskName}
                      onChange={(e) => setInfoForm({ ...infoForm, itHelpdeskName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-amber-500/25 text-white font-medium focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">No. WhatsApp Helpdesk IT</label>
                    <input
                      type="text"
                      value={infoForm.itHelpdeskPhone}
                      onChange={(e) => setInfoForm({ ...infoForm, itHelpdeskPhone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-amber-500/25 text-white font-medium focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Email Resmi Helpdesk</label>
                    <input
                      type="email"
                      value={infoForm.itHelpdeskEmail}
                      onChange={(e) => setInfoForm({ ...infoForm, itHelpdeskEmail: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-amber-500/25 text-white font-medium focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Jam Operasional Kantor</label>
                    <input
                      type="text"
                      value={infoForm.operationalHours}
                      onChange={(e) => setInfoForm({ ...infoForm, operationalHours: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-amber-500/25 text-white font-medium focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-amber-500/20 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-white font-extrabold flex items-center gap-2 shadow-lg shadow-amber-950/60 transition-all cursor-pointer active:scale-95"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Perubahan Profil</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: PERMOHONAN AKSES STAF                                             */}
        {/* ========================================================================= */}
        {activeTab === 'REQUESTS' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <span>Daftar Permohonan Akun & Akses Login Staf</span>
              </h2>
              <p className="text-xs text-slate-400">
                Verifikasi email dan kata sandi yang diajukan oleh staf untuk diberikan akses ke sistem yayasan.
              </p>
            </div>

            {requests.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#091b14] border border-amber-500/20 text-center text-slate-400 text-xs">
                Belum ada permohonan akses baru yang masuk.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="p-5 rounded-2xl glass-panel bg-[#091b14] border border-amber-500/25 shadow-xl flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md ${
                          req.status === 'APPROVED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                            : req.status === 'REJECTED'
                            ? 'bg-red-950 text-red-300 border border-red-500/30'
                            : 'bg-amber-950 text-amber-300 border border-amber-500/30 animate-pulse'
                        }`}>
                          {req.status}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(req.requestedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-white">{req.name}</h3>
                      <p className="text-xs text-amber-300 font-mono mt-0.5">{req.email}</p>
                      
                      <div className="mt-3 p-3 rounded-xl bg-[#06140e] border border-slate-800 space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Aplikasi Diminta:</span>
                          <strong className="text-white">{req.appTitle || 'Seluruh Portal'}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Divisi / Unit:</span>
                          <span className="text-slate-200">{req.department}</span>
                        </div>
                        {req.proposedPassword && (
                          <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                            <span className="text-slate-400">Kata Sandi Diajukan:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-amber-400 font-bold">
                                {visiblePasswords[req.id] ? req.proposedPassword : '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setVisiblePasswords({
                                    ...visiblePasswords,
                                    [req.id]: !visiblePasswords[req.id],
                                  })
                                }
                                className="text-slate-400 hover:text-white"
                              >
                                {visiblePasswords[req.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        )}
                        {req.phoneNumber && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">No. WhatsApp:</span>
                            <span className="text-slate-200 font-mono">{req.phoneNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-amber-500/15 flex flex-wrap items-center justify-between gap-2">
                      <button
                        onClick={() => handleCopyWaMessage(req)}
                        className="px-3 py-1.5 rounded-lg bg-[#0c261e] hover:bg-[#12382c] border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        title="Salin Pesan Konfirmasi WhatsApp"
                      >
                        {copiedReqId === req.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Pesan Disalin!</span>
                          </>
                        ) : (
                          <>
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Salin Pesan WA</span>
                          </>
                        )}
                      </button>

                      {req.status === 'PENDING' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleResolveRequest(req, 'REJECTED')}
                            className="px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-300 text-xs font-bold cursor-pointer"
                          >
                            Tolak
                          </button>
                          <button
                            onClick={() => handleResolveRequest(req, 'APPROVED')}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-md cursor-pointer"
                          >
                            Setujui Akun
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ================= MODAL TAMBAH / EDIT NOTIFIKASI ================= */}
      {showNoticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-lg my-auto rounded-3xl glass-panel bg-[#091e16] border-2 border-amber-500/40 shadow-2xl p-6 overflow-hidden max-h-[90dvh] overflow-y-auto">
            <PapuanBorderCorner />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-400" />
                <span>{editingNotice ? 'Edit Notifikasi Pengumuman' : 'Buat Notifikasi Pengumuman Baru'}</span>
              </h3>
              <button onClick={() => setShowNoticeModal(false)} className="p-1.5 rounded-xl bg-slate-900 text-slate-300 hover:text-white border border-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNotice} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Judul Pengumuman</label>
                <input
                  type="text"
                  required
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder="misal: Briefing Operasional Staf Yayasan"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-amber-500/30 text-base sm:text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Isi Lengkap Informasi / Instruksi</label>
                <textarea
                  rows={4}
                  required
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  placeholder="Tuliskan detail pengumuman atau instruksi resmi..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-amber-500/30 text-base sm:text-xs text-white focus:outline-none focus:border-amber-400"
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
                    <option value="INSTRUCTION">INSTRUCTION (Instruksi Resmi)</option>
                    <option value="AGENDA">AGENDA (Jadwal & Kunjungan)</option>
                    <option value="SOP">SOP (Standar Operasional)</option>
                    <option value="UPDATE">UPDATE (Pembaruan Sistem)</option>
                    <option value="SECURITY">SECURITY (Keamanan & Akses)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Prioritas</label>
                  <select
                    value={noticePriority}
                    onChange={(e) => setNoticePriority(e.target.value as NoticePriority)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-amber-500/30 text-base sm:text-xs text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="HIGH">HIGH (Penting / Utama)</option>
                    <option value="URGENT">URGENT (Mendesak / Segera)</option>
                    <option value="NORMAL">NORMAL (Biasa)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="noticePinnedCheckbox"
                  checked={noticeIsPinned}
                  onChange={(e) => setNoticeIsPinned(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 bg-[#06140e] border-amber-500/40"
                />
                <label htmlFor="noticePinnedCheckbox" className="text-xs font-bold text-slate-200 cursor-pointer">
                  Sematkan di Beranda Utama (Pinned Notice)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNoticeModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Simpan Pengumuman
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL TAMBAH / EDIT APLIKASI ================= */}
      {showAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-lg my-auto rounded-3xl glass-panel bg-[#091e16] border-2 border-emerald-500/40 shadow-2xl p-6 overflow-hidden max-h-[90dvh] overflow-y-auto">
            <PapuanBorderCorner />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Link2 className="w-5 h-5 text-emerald-400" />
                <span>{editingApp ? 'Edit Konfigurasi Aplikasi' : 'Tambah Aplikasi Baru ke Portal'}</span>
              </h3>
              <button onClick={() => setShowAppModal(false)} className="p-1.5 rounded-xl bg-slate-900 text-slate-300 hover:text-white border border-slate-700">
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
                    placeholder="misal: Reservasi Homestay"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-emerald-500/30 text-base sm:text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Kode Singkat</label>
                  <input
                    type="text"
                    required
                    value={appShortCode}
                    onChange={(e) => setAppShortCode(e.target.value)}
                    placeholder="HOMESTAY"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-emerald-500/30 text-base sm:text-xs text-white font-mono uppercase focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">URL Target Vercel (Produksi)</label>
                <input
                  type="url"
                  required
                  value={appUrl}
                  onChange={(e) => setAppUrl(e.target.value)}
                  placeholder="https://apk-reservasi-homestay-rep.vercel.app"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-emerald-500/30 text-base sm:text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={appDescription}
                  onChange={(e) => setAppDescription(e.target.value)}
                  placeholder="Penjelasan fungsi operasional sistem..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-emerald-500/30 text-base sm:text-xs text-white focus:outline-none focus:border-emerald-400"
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
                    <option value="OPERASIONAL">OPERASIONAL (Homestay & Tamu)</option>
                    <option value="KEUANGAN">KEUANGAN (SIK-REP Pembukuan)</option>
                    <option value="GUDANG_POS">GUDANG_POS (Kasir & Suvenir)</option>
                    <option value="MEDIA_KREATIF">MEDIA_KREATIF (Zeestudio)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Status Sistem</label>
                  <select
                    value={appStatus}
                    onChange={(e) => setAppStatus(e.target.value as AppStatus)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-emerald-500/30 text-base sm:text-xs text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="ONLINE">ONLINE (Aktif)</option>
                    <option value="MAINTENANCE">MAINTENANCE (Pemeliharaan)</option>
                    <option value="OFFLINE">OFFLINE (Nonaktif)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAppModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Simpan Aplikasi
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
