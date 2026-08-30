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
  INITIAL_FOUNDATION_INFO,
  getEvents,
  addEvent,
  updateEvent,
  deleteEvent,
  getDocuments,
  addDocument,
  updateDocument,
  deleteDocument,
  getWhitelist,
  addWhitelistedUser,
  updateWhitelistedUser,
  removeWhitelistedUser,
  getAuditLogs,
  resetToDefaults
} from '@/lib/storage';
import {
  INITIAL_APPS,
  INITIAL_NOTICES,
  INITIAL_EVENTS,
  INITIAL_DOCUMENTS,
  INITIAL_WHITELIST,
  INITIAL_LOGS
} from '@/lib/seed-data';
import {
  AppItem,
  NoticeItem,
  AccessRequest,
  FoundationInfo,
  UserRole,
  AppStatus,
  AppCategory,
  NoticeCategory,
  NoticePriority,
  CalendarEvent,
  FoundationDocument,
  WhitelistedUser,
  AuditLog
} from '@/lib/types';
import Navbar from '@/components/Navbar';
import PWAInstallModal from '@/components/PWAInstallModal';
import PWAInstallBanner from '@/components/PWAInstallBanner';
import CreateEventModal from '@/components/CreateEventModal';
import EventDetailModal, { getCategoryBadge } from '@/components/EventDetailModal';
import CreateDocumentModal from '@/components/CreateDocumentModal';
import DocumentDetailModal, { getDocCategoryInfo, getDocFileBadge } from '@/components/DocumentDetailModal';
import RequestAccessModal from '@/components/RequestAccessModal';
import {
  ShieldCheck,
  ShieldAlert,
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
  MessageCircle,
  CalendarDays,
  HardDrive,
  FileText,
  FolderOpen,
  Users,
  UserCheck,
  UserX,
  History,
  Terminal,
  RotateCcw,
  Activity,
  Cpu,
  Fingerprint,
  UserPlus,
  Search,
  Filter
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PapuanBorderCorner } from '@/components/PapuanMotif';

const subscribeClient = () => () => {};

type AdminTab =
  | 'NOTICES'
  | 'EVENTS'
  | 'DOCUMENTS'
  | 'WHITELIST'
  | 'REQUESTS'
  | 'APPS'
  | 'INFO'
  | 'LOGS'
  | 'SYSTEM';

const ROLE_PERMISSIONS: Record<
  UserRole,
  {
    label: string;
    badgeColor: string;
    allowedTabs: AdminTab[];
    description: string;
  }
> = {
  IT_ADMIN: {
    label: 'IT Superadmin',
    badgeColor: 'bg-purple-950 text-purple-300 border-purple-500/40',
    allowedTabs: [
      'NOTICES',
      'EVENTS',
      'DOCUMENTS',
      'WHITELIST',
      'REQUESTS',
      'APPS',
      'INFO',
      'LOGS',
      'SYSTEM',
    ],
    description: 'Akses penuh ke seluruh konfigurasi sistem, database, dan manajemen hak akses karyawan.',
  },
  EXECUTIVE: {
    label: 'Manajemen Eksekutif / Pimpinan',
    badgeColor: 'bg-amber-950 text-amber-300 border-amber-500/40',
    allowedTabs: ['NOTICES', 'EVENTS', 'DOCUMENTS', 'REQUESTS', 'INFO'],
    description: 'Akses pengawasan menyeluruh, otorisasi pengumuman, agenda resmi, dan persetujuan staf.',
  },
  OPERATIONAL: {
    label: 'Staf Operasional & Frontdesk',
    badgeColor: 'bg-teal-950 text-teal-300 border-teal-500/40',
    allowedTabs: ['NOTICES', 'EVENTS', 'DOCUMENTS'],
    description: 'Akses terbatas ke jadwal agenda budaya dan panduan SOP operasional homestay.',
  },
  FINANCE_WAREHOUSE: {
    label: 'Staf Keuangan & Logistik (OMG)',
    badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-500/40',
    allowedTabs: ['NOTICES', 'DOCUMENTS'],
    description: 'Akses terbatas ke arsip dokumen keuangan SIK-REP dan SOP kasir / pergudangan.',
  },
  UNAUTHORIZED: {
    label: 'Belum Terdaftar / Tamu',
    badgeColor: 'bg-stone-900 text-stone-300 border-stone-600/40',
    allowedTabs: ['NOTICES'],
    description: 'Akses publik umum.',
  },
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const {
    user,
    isInitialized,
    loginWithEmailPassword,
    isLoading: isAuthLoading,
    authError,
    clearAuthError,
  } = useAuth();
  const isClient = useSyncExternalStore(subscribeClient, () => true, () => false);

  // Active Role Simulation (Defaults to user's role or IT_ADMIN if not logged in for dev convenience)
  const actualRole: UserRole = user ? user.role : 'IT_ADMIN';
  const [simulatedRole, setSimulatedRole] = useState<UserRole>(actualRole);

  useEffect(() => {
    if (user) {
      setSimulatedRole(user.role);
    }
  }, [user]);

  // Tab State
  const [activeTab, setActiveTab] = useState<AdminTab>('NOTICES');

  // Data States (Initialized identically with seed data for SSR safety, updated in useEffect)
  const [notices, setNotices] = useState<NoticeItem[]>(INITIAL_NOTICES);
  const [events, setEvents] = useState<CalendarEvent[]>(INITIAL_EVENTS);
  const [documents, setDocuments] = useState<FoundationDocument[]>(INITIAL_DOCUMENTS);
  const [whitelist, setWhitelist] = useState<WhitelistedUser[]>(INITIAL_WHITELIST);
  const [apps, setApps] = useState<AppItem[]>(INITIAL_APPS);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_LOGS);

  const [pwaModalOpen, setPwaModalOpen] = useState(false);
  const [requestAccessModalOpen, setRequestAccessModalOpen] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedReqId, setCopiedReqId] = useState<string | null>(null);

  // Search & Filter for Whitelist
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [staffDeptFilter, setStaffDeptFilter] = useState('ALL');

  // Form States: Kelola Dokumen
  const [showDocModal, setShowDocModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<FoundationDocument | null>(null);
  const [selectedDocForDetail, setSelectedDocForDetail] = useState<FoundationDocument | null>(null);

  // Form States: Kelola Agenda
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<CalendarEvent | null>(null);

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
  const [infoForm, setInfoForm] = useState<FoundationInfo>(INITIAL_FOUNDATION_INFO);
  const [infoSavedSuccess, setInfoSavedSuccess] = useState(false);

  // Form States: Tambah Karyawan Whitelist
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setStaffRole] = useState<UserRole>('OPERATIONAL');
  const [staffRoleTitle, setStaffRoleTitle] = useState('Staf Operasional Homestay');
  const [staffDepartment, setStaffDepartment] = useState('Frontdesk & Homestay Etnik');

  const loadData = () => {
    if (typeof window === 'undefined') return;
    setNotices(getNotices());
    setEvents(getEvents());
    setDocuments(getDocuments());
    setWhitelist(getWhitelist());
    setApps(getAppsList());
    setInfoForm(getFoundationInfo());
    setRequests(getAccessRequests());
    setAuditLogs(getAuditLogs());
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentAdminName = user ? user.displayName : 'Ridwan Elly (IT Developer)';

  // Check if active tab is permitted for simulated role
  const isTabAllowed = ROLE_PERMISSIONS[simulatedRole].allowedTabs.includes(activeTab);

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
        },
        currentAdminName
      );
    } else {
      addNotice({
        title: noticeTitle.trim(),
        content: noticeContent.trim(),
        category: noticeCategory,
        priority: noticePriority,
        isPinned: noticeIsPinned,
        authorName: noticeAuthor.trim() || currentAdminName,
        authorRole: 'Administrator Yayasan REP',
      });
      if (typeof window !== 'undefined') {
        confetti({ particleCount: 25, spread: 50, origin: { y: 0.6 } });
      }
    }
    setShowNoticeModal(false);
    loadData();
  };

  const handleDeleteNotice = (id: string, title: string) => {
    if (confirm(`Hapus pengumuman "${title}"?`)) {
      deleteNotice(id, currentAdminName);
      loadData();
    }
  };

  const handleTogglePin = (id: string) => {
    togglePinNotice(id);
    loadData();
  };

  // ================= EVENTS HANDLERS =================
  const handleOpenNewEvent = () => {
    setEditingEvent(null);
    setShowEventModal(true);
  };

  const handleOpenEditEvent = (ev: CalendarEvent) => {
    setEditingEvent(ev);
    setShowEventModal(true);
  };

  const handleSaveEvent = (
    eventData: Omit<CalendarEvent, 'id' | 'createdAt'>,
    eventId?: string
  ) => {
    if (eventId) {
      updateEvent(eventId, eventData, currentAdminName);
    } else {
      addEvent(eventData, currentAdminName);
      if (typeof window !== 'undefined') {
        confetti({ particleCount: 25, spread: 50, origin: { y: 0.6 } });
      }
    }
    setShowEventModal(false);
    loadData();
  };

  const handleDeleteEvent = (id: string, title: string) => {
    if (confirm(`Hapus agenda "${title}"?`)) {
      deleteEvent(id, currentAdminName);
      loadData();
    }
  };

  // ================= DOCUMENTS HANDLERS =================
  const handleOpenNewDoc = () => {
    setEditingDoc(null);
    setShowDocModal(true);
  };

  const handleOpenEditDoc = (doc: FoundationDocument) => {
    setEditingDoc(doc);
    setShowDocModal(true);
  };

  const handleSaveDoc = (
    docData: Omit<FoundationDocument, 'id' | 'lastUpdated'>,
    docId?: string
  ) => {
    if (docId) {
      updateDocument(docId, docData, currentAdminName);
    } else {
      addDocument(docData, currentAdminName);
      if (typeof window !== 'undefined') {
        confetti({ particleCount: 25, spread: 50, origin: { y: 0.6 } });
      }
    }
    setShowDocModal(false);
    loadData();
  };

  const handleDeleteDoc = (id: string, title: string) => {
    if (confirm(`Hapus dokumen "${title}"?`)) {
      deleteDocument(id, currentAdminName);
      loadData();
    }
  };

  // ================= WHITELIST HANDLERS =================
  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffEmail.trim() || !staffName.trim()) return;

    addWhitelistedUser(
      {
        email: staffEmail.trim().toLowerCase(),
        name: staffName.trim(),
        role: staffRole,
        roleTitle: staffRoleTitle.trim(),
        department: staffDepartment.trim(),
        active: true,
        addedBy: currentAdminName,
      },
      currentAdminName
    );

    if (typeof window !== 'undefined') {
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.6 } });
    }

    setShowAddStaffModal(false);
    setStaffEmail('');
    setStaffName('');
    loadData();
  };

  const handleUpdateStaffRole = (id: string, newRole: UserRole) => {
    let roleTitle = 'Staf Yayasan';
    if (newRole === 'EXECUTIVE') roleTitle = 'Pengurus / Pimpinan';
    if (newRole === 'IT_ADMIN') roleTitle = 'IT Developer & Superadmin';
    if (newRole === 'OPERATIONAL') roleTitle = 'Staf Frontdesk & Wisata';
    if (newRole === 'FINANCE_WAREHOUSE') roleTitle = 'Staf Keuangan & Kasir OMG';

    updateWhitelistedUser(id, { role: newRole, roleTitle }, currentAdminName);
    loadData();
  };

  const handleToggleStaffActive = (id: string, currentActive: boolean) => {
    updateWhitelistedUser(id, { active: !currentActive }, currentAdminName);
    loadData();
  };

  const handleDeleteStaff = (id: string, name: string) => {
    if (confirm(`Hapus karyawan "${name}" dari whitelist akses?`)) {
      removeWhitelistedUser(id, currentAdminName);
      loadData();
    }
  };

  // ================= APPS HANDLERS =================
  const handleOpenNewApp = () => {
    setEditingApp(null);
    setAppTitle('');
    setAppShortCode('');
    setAppUrl('');
    setAppDescription('');
    setAppCategory('OPERASIONAL');
    setAppStatus('ONLINE');
    setAppBadgeText('');
    setShowAppModal(true);
  };

  const handleOpenEditApp = (app: AppItem) => {
    setEditingApp(app);
    setAppTitle(app.title);
    setAppShortCode(app.shortCode);
    setAppUrl(app.url);
    setAppDescription(app.description);
    setAppCategory(app.category);
    setAppStatus(app.status);
    setAppBadgeText(app.badgeText || '');
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
          shortCode: appShortCode.trim(),
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
          shortCode: appShortCode.trim() || 'APP',
          url: appUrl.trim(),
          description: appDescription.trim(),
          category: appCategory,
          status: appStatus,
          iconName: 'LayoutGrid',
          allowedRoles: ['EXECUTIVE', 'OPERATIONAL', 'FINANCE_WAREHOUSE', 'IT_ADMIN'],
          badgeText: appBadgeText.trim() || 'Sub-Aplikasi',
          colorTheme: {
            from: 'from-emerald-700',
            to: 'to-emerald-900',
            accent: 'text-emerald-400',
            border: 'border-emerald-500/30',
          },
        },
        currentAdminName
      );
      if (typeof window !== 'undefined') {
        confetti({ particleCount: 25, spread: 50, origin: { y: 0.6 } });
      }
    }
    setShowAppModal(false);
    loadData();
  };

  const handleDeleteApp = (id: string, title: string) => {
    if (confirm(`Hapus modul aplikasi "${title}"?`)) {
      deleteAppItem(id, currentAdminName);
      loadData();
    }
  };

  // ================= INFO HANDLER =================
  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateFoundationInfo(infoForm, currentAdminName);
    setInfoSavedSuccess(true);
    setTimeout(() => setInfoSavedSuccess(false), 3000);
    loadData();
  };

  // ================= REQUESTS HANDLERS =================
  const handleApproveRequest = (r: AccessRequest) => {
    resolveAccessRequest(
      r.id,
      'APPROVED',
      currentAdminName,
      'OPERATIONAL',
      'Disetujui oleh Administrator Portal'
    );
    loadData();
    if (typeof window !== 'undefined') {
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.6 } });
    }
  };

  const handleRejectRequest = (r: AccessRequest) => {
    if (confirm(`Tolak permohonan akses dari ${r.name}?`)) {
      resolveAccessRequest(
        r.id,
        'REJECTED',
        currentAdminName,
        undefined,
        'Ditolak: Hubungi IT Helpdesk'
      );
      loadData();
    }
  };

  const handleCopyWaMessage = (r: AccessRequest) => {
    const text = `Halo ${r.name},\n\nPendaftaran akun Anda untuk *${r.appTitle || 'PORTAL REP'}* telah DISETUJUI & DIVERIFIKASI oleh Admin IT Yayasan Rumah Etnik Papua.\n\nDetail Akun Anda:\n📧 Email: ${r.email}\n🔑 Password: ${r.proposedPassword || '(Sesuai pendaftaran)'}\n🌐 Portal: http://localhost:3008/\n\nSilakan langsung membuka dan menggunakan sistem. Terima kasih!`;
    navigator.clipboard.writeText(text);
    setCopiedReqId(r.id);
    setTimeout(() => setCopiedReqId(null), 2000);
  };

  // Filtered Whitelist
  const filteredWhitelist = whitelist.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
      u.department.toLowerCase().includes(staffSearchQuery.toLowerCase());
    const matchDept = staffDeptFilter === 'ALL' || u.department === staffDeptFilter;
    return matchSearch && matchDept;
  });

  const departmentList = Array.from(new Set(whitelist.map((u) => u.department)));

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#07130f] papuan-pattern-overlay text-slate-100 selection:bg-amber-500 selection:text-black">
      {/* Top Navbar */}
      <Navbar onOpenPwaModal={() => setPwaModalOpen(true)} />

      {/* Main Admin Command Center View */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full flex-1 pb-36 md:pb-12">
        {/* ========================================================================= */}
        {/* 1. COMMAND CENTER TELEMETRY & BANNER (DISTINCTIVE HIGH-TECH ETHNIC LOOK)  */}
        {/* ========================================================================= */}
        <div className="relative rounded-3xl overflow-hidden border-2 border-amber-500/40 shadow-2xl bg-gradient-to-r from-[#06140e] via-[#0d281e] to-[#11382b] p-5 sm:p-7 mb-6">
          <PapuanBorderCorner position="top-right" />
          <PapuanBorderCorner position="bottom-left" />

          {/* Telemetry Status Strip */}
          <div className="relative z-10 flex items-center justify-between gap-2 flex-wrap pb-4 border-b border-amber-500/20 mb-5">
            <div className="flex items-center gap-3">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                PORTAL CONTROL NODE • SORONG (WIT / UTC+9)
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <span className="px-2 py-0.5 rounded bg-black/50 border border-slate-700 text-amber-300">
                SSL 256-Bit
              </span>
              <span className="px-2 py-0.5 rounded bg-black/50 border border-slate-700 text-emerald-400">
                System: 99.8% Online
              </span>
            </div>
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold shadow-sm">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Panel Kontrol Administrator & Otorisasi Karyawan</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-black text-white tracking-tight">
                Pusat Kendali Portal REP
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                Administrator: <strong className="text-amber-400">{currentAdminName}</strong> • Hak Akses Nyata: <span className="font-mono text-emerald-300 font-bold">[{actualRole}]</span>
              </p>
            </div>

            {/* Role Simulation Switcher for Testing Access Controls */}
            <div className="p-3 rounded-2xl bg-[#06140e]/90 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center gap-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="text-left">
                  <p className="text-[10px] font-bold text-amber-400 uppercase">Simulasi Role Karyawan</p>
                  <p className="text-xs text-slate-300 font-semibold">{ROLE_PERMISSIONS[simulatedRole].label}</p>
                </div>
              </div>

              <select
                value={simulatedRole}
                onChange={(e) => setSimulatedRole(e.target.value as UserRole)}
                className="px-3 py-1.5 rounded-xl bg-[#0a2319] border border-amber-500/30 text-xs text-white font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
                title="Pilih role untuk menguji tampilan dashboard sesuai hak akses karyawan"
              >
                <option value="IT_ADMIN">👨‍💻 IT Superadmin (Semua Akses)</option>
                <option value="EXECUTIVE">👑 Pimpinan / Eksekutif</option>
                <option value="OPERATIONAL">🏡 Staf Operasional & Homestay</option>
                <option value="FINANCE_WAREHOUSE">💰 Staf Keuangan & Gudang OMG</option>
                <option value="UNAUTHORIZED">🔒 Belum Terdaftar (Tamu)</option>
              </select>
            </div>
          </div>
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
                                Tersemat
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                              n.priority === 'URGENT'
                                ? 'bg-red-950 text-red-300 border border-red-500/40'
                                : n.priority === 'HIGH'
                                ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                                : 'bg-slate-900 text-slate-300'
                            }`}
                          >
                            {n.priority}
                          </span>
                        </div>

                        <h3 className="text-base font-extrabold text-white leading-snug">{n.title}</h3>
                        <p className="text-xs text-slate-300 mt-2 line-clamp-3 leading-relaxed whitespace-pre-line">
                          {n.content}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-[11px] text-slate-400">
                        <span>Oleh: {n.authorName}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleTogglePin(n.id)}
                            className={`p-1.5 rounded-lg border transition-all ${
                              n.isPinned
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                            }`}
                            title={n.isPinned ? 'Lepas Sematan' : 'Sematkan Pengumuman'}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditNotice(n)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-950/60 border border-slate-700 text-amber-300 transition-all"
                            title="Edit Pengumuman"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteNotice(n.id, n.title)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/60 border border-slate-700 text-red-400 transition-all"
                            title="Hapus Pengumuman"
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
            {/* TAB 2: KELOLA AGENDA BUDAYA & KALENDER                                   */}
            {/* ========================================================================= */}
            {activeTab === 'EVENTS' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-amber-400" />
                      <span>Kelola Agenda, Pentas Budaya & Kunjungan Homestay</span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Jadwalkan pentas seni tari, workshop noken, reservasi homestay, dan rapat pimpinan yayasan.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href="/agenda"
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#091e16] hover:bg-[#0e2c20] border border-amber-500/30 text-amber-300 text-xs font-bold transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Lihat Kalender Publik</span>
                    </Link>
                    <button
                      onClick={handleOpenNewEvent}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold shadow-lg shadow-amber-950/60 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Agenda Baru</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {events.map((ev) => {
                    const catBadge = getCategoryBadge(ev.category);
                    return (
                      <div
                        key={ev.id}
                        className="p-5 rounded-2xl glass-panel bg-[#091b14] border border-amber-500/25 shadow-xl flex flex-col justify-between space-y-4"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${catBadge.bgColor}`}>
                              {catBadge.label}
                            </span>
                            <span className="text-[10px] font-mono text-amber-300 font-bold bg-[#06140e] px-2 py-0.5 rounded border border-amber-500/30">
                              {ev.date} • {ev.timeStart} WIT
                            </span>
                          </div>

                          <h3 className="text-base font-extrabold text-white leading-snug">{ev.title}</h3>
                          <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">{ev.description}</p>
                          <p className="text-[11px] text-amber-400 mt-2 font-medium">📍 {ev.location}</p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                          <span className="text-[10px] text-slate-400">Penyelenggara: {ev.organizer}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedEventForDetail(ev)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all"
                            >
                              Detail & WA
                            </button>
                            <button
                              onClick={() => handleOpenEditEvent(ev)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-950/60 border border-slate-700 text-amber-300 transition-all"
                              title="Edit Agenda"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(ev.id, ev.title)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/60 border border-slate-700 text-red-400 transition-all"
                              title="Hapus Agenda"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: KELOLA DOKUMEN & SOP (GOOGLE DRIVE)                                */}
            {/* ========================================================================= */}
            {activeTab === 'DOCUMENTS' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-emerald-400" />
                      <span>Kelola Dokumen, SOP & Arsip Google Drive</span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Unggah SOP resmi, tautkan file Google Drive, perbarui versi dokumen, dan kelola arsip formulir yayasan.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href="/dokumen"
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#091e16] hover:bg-[#0e2c20] border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Lihat Vault Publik</span>
                    </Link>
                    <button
                      onClick={handleOpenNewDoc}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-950/60 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Dokumen Baru</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documents.map((doc) => {
                    const categoryInfo = getDocCategoryInfo(doc.category);
                    const fileBadge = getDocFileBadge(doc.fileType);

                    return (
                      <div
                        key={doc.id}
                        className="p-5 rounded-2xl glass-panel bg-[#091b14] border border-emerald-500/25 shadow-xl flex flex-col justify-between space-y-4"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                                {doc.code}
                              </span>
                              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${categoryInfo.bgColor}`}>
                                {categoryInfo.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${fileBadge.bg}`}>
                                {fileBadge.label}
                              </span>
                              {doc.isConfidential && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/40">
                                  RAHASIA
                                </span>
                              )}
                            </div>
                          </div>

                          <h3 className="text-base font-extrabold text-white leading-snug">{doc.title}</h3>
                          <p className="text-xs text-slate-300 mt-1 line-clamp-2">{doc.description}</p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                          <span className="text-[10px] text-slate-400">Oleh: {doc.uploadedBy}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedDocForDetail(doc)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all"
                            >
                              Detail & G-Drive
                            </button>
                            <button
                              onClick={() => handleOpenEditDoc(doc)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-950/60 border border-slate-700 text-emerald-300 transition-all"
                              title="Edit Dokumen"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteDoc(doc.id, doc.title)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/60 border border-slate-700 text-red-400 transition-all"
                              title="Hapus Dokumen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: WHITELIST KARYAWAN & HAK AKSES ROLE (KHUSUS IT ADMIN)             */}
            {/* ========================================================================= */}
            {activeTab === 'WHITELIST' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-400" />
                      <span>Manajemen Karyawan & Hak Akses Whitelist (RBAC)</span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Kelola hak akses role staf yayasan, atur perizinan sub-aplikasi, dan tambahkan akun Google karyawan.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowAddStaffModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white text-xs font-bold shadow-lg shadow-purple-950/60 transition-all cursor-pointer self-start sm:self-auto"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Tambah Karyawan Baru</span>
                  </button>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#091b14] p-3 rounded-2xl border border-purple-500/20">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={staffSearchQuery}
                      onChange={(e) => setStaffSearchQuery(e.target.value)}
                      placeholder="Cari nama, email, atau divisi..."
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#06140e] border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-[11px] text-slate-400 font-bold whitespace-nowrap">Divisi:</span>
                    <select
                      value={staffDeptFilter}
                      onChange={(e) => setStaffDeptFilter(e.target.value)}
                      className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-[#06140e] border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-400 cursor-pointer"
                    >
                      <option value="ALL">Semua Divisi</option>
                      {departmentList.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Staff Table */}
                <div className="rounded-2xl border border-purple-500/25 overflow-hidden bg-[#091b14] shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-[#06140e] text-[10px] uppercase font-bold text-slate-400 border-b border-purple-500/20 tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Nama & Email Karyawan</th>
                          <th className="py-3 px-4">Divisi / Jabatan</th>
                          <th className="py-3 px-4">Hak Akses Role</th>
                          <th className="py-3 px-4">Status Akun</th>
                          <th className="py-3 px-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80 font-medium">
                        {filteredWhitelist.map((staff) => {
                          const roleInfo = ROLE_PERMISSIONS[staff.role] || ROLE_PERMISSIONS.OPERATIONAL;
                          return (
                            <tr key={staff.id} className="hover:bg-[#0c241b]/60 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center justify-center font-bold font-serif text-xs">
                                    {staff.name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="font-bold text-white text-xs">{staff.name}</p>
                                    <p className="text-[10px] text-slate-400 font-mono">{staff.email}</p>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <p className="font-semibold text-slate-200">{staff.department}</p>
                                <p className="text-[10px] text-slate-400">{staff.roleTitle}</p>
                              </td>

                              <td className="py-3.5 px-4">
                                <select
                                  value={staff.role}
                                  onChange={(e) => handleUpdateStaffRole(staff.id, e.target.value as UserRole)}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border cursor-pointer ${roleInfo.badgeColor}`}
                                >
                                  <option value="IT_ADMIN">IT Superadmin</option>
                                  <option value="EXECUTIVE">Manajemen Eksekutif</option>
                                  <option value="OPERATIONAL">Staf Operasional</option>
                                  <option value="FINANCE_WAREHOUSE">Staf Keuangan & Kasir</option>
                                </select>
                              </td>

                              <td className="py-3.5 px-4">
                                <button
                                  type="button"
                                  onClick={() => handleToggleStaffActive(staff.id, staff.active)}
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-all ${
                                    staff.active
                                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                                      : 'bg-rose-950 text-rose-300 border-rose-500/40'
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${staff.active ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                  <span>{staff.active ? 'Aktif' : 'Dinonaktifkan'}</span>
                                </button>
                              </td>

                              <td className="py-3.5 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStaff(staff.id, staff.name)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/80 border border-slate-700 text-rose-400 transition-all cursor-pointer"
                                  title="Hapus dari Whitelist"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 5: PERMOHONAN AKSES STAF BARU                                        */}
            {/* ========================================================================= */}
            {activeTab === 'REQUESTS' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-amber-400" />
                    <span>Otorisasi & Permohonan Pendaftaran Akun Staf</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Tinjau pengajuan akun karyawan baru, setujui akses, dan kirimkan kredensial otomatis ke WhatsApp staf.
                  </p>
                </div>

                <div className="space-y-3">
                  {requests.map((r) => (
                    <div
                      key={r.id}
                      className="p-4 rounded-2xl glass-panel bg-[#091b14] border border-amber-500/25 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{r.name}</span>
                          <span className="text-[10px] font-mono text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-500/30">
                            {r.email}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">
                          Mengajukan akses untuk: <strong className="text-emerald-400">{r.appTitle || 'PORTAL REP'}</strong> ({r.department})
                        </p>
                        {r.reason && <p className="text-[11px] text-slate-400 italic">"{r.reason}"</p>}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {r.status === 'PENDING' ? (
                          <>
                            <button
                              onClick={() => handleApproveRequest(r)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Setujui & Whitelist</span>
                            </button>
                            <button
                              onClick={() => handleRejectRequest(r)}
                              className="px-3 py-1.5 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-bold transition-all cursor-pointer"
                            >
                              Tolak
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                                r.status === 'APPROVED'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                              }`}
                            >
                              {r.status === 'APPROVED' ? 'Telah Disetujui' : 'Ditolak'}
                            </span>
                            {r.status === 'APPROVED' && (
                              <button
                                onClick={() => handleCopyWaMessage(r)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-all cursor-pointer"
                                title="Salin Pesan WhatsApp Akun"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>{copiedReqId === r.id ? 'Tersalin!' : 'Kirim WA'}</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {requests.length === 0 && (
                    <div className="p-8 text-center rounded-2xl bg-[#091b14] border border-dashed border-amber-500/30 text-slate-400 text-xs">
                      Belum ada permohonan akses baru dari staf.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 6: LINK APLIKASI VERCEL                                              */}
            {/* ========================================================================= */}
            {activeTab === 'APPS' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <Link2 className="w-5 h-5 text-emerald-400" />
                      <span>Konfigurasi Link & Modul Sub-Aplikasi</span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Atur tautan produksi Vercel, status operasional (Online/Maintenance), dan deskripsi modul.
                    </p>
                  </div>

                  <button
                    onClick={handleOpenNewApp}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-950/60 transition-all cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Modul Baru</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {apps.map((app) => (
                    <div
                      key={app.id}
                      className="p-5 rounded-2xl glass-panel bg-[#091b14] border border-emerald-500/25 shadow-xl flex flex-col justify-between space-y-4"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                            {app.shortCode}
                          </span>
                          <span
                            className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                              app.status === 'ONLINE'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {app.status}
                          </span>
                        </div>

                        <h3 className="text-base font-extrabold text-white leading-snug">{app.title}</h3>
                        <p className="text-xs text-slate-300 mt-1 line-clamp-2">{app.description}</p>
                        <p className="text-[11px] text-emerald-400 font-mono mt-2 truncate">{app.url}</p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-[11px] text-slate-400">
                        <span>{app.badgeText}</span>
                        <div className="flex items-center gap-1.5">
                          <a
                            href={app.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-950/60 border border-slate-700 text-emerald-400 transition-all"
                            title="Buka Aplikasi"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => handleOpenEditApp(app)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-950/60 border border-slate-700 text-emerald-300 transition-all cursor-pointer"
                            title="Edit Aplikasi"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteApp(app.id, app.title)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/60 border border-slate-700 text-red-400 transition-all cursor-pointer"
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
            {/* TAB 7: INFORMASI & PROFIL YAYASAN                                        */}
            {/* ========================================================================= */}
            {activeTab === 'INFO' && (
              <div className="max-w-3xl space-y-6">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <Info className="w-5 h-5 text-cyan-400" />
                    <span>Profil & Informasi Resmi Yayasan REP</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Data kontak helpdesk IT, alamat operasional, dan jam layanan yang tampil di portal.
                  </p>
                </div>

                <form onSubmit={handleSaveInfo} className="p-6 rounded-2xl bg-[#091b14] border border-cyan-500/25 space-y-4">
                  {infoSavedSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Informasi yayasan berhasil disimpan dan diperbarui!</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Nama Organisasi</label>
                      <input
                        type="text"
                        value={infoForm.organizationName}
                        onChange={(e) => setInfoForm({ ...infoForm, organizationName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#06140e] border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Tagline Budaya</label>
                      <input
                        type="text"
                        value={infoForm.tagline}
                        onChange={(e) => setInfoForm({ ...infoForm, tagline: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#06140e] border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Alamat Kompleks Yayasan</label>
                    <input
                      type="text"
                      value={infoForm.address}
                      onChange={(e) => setInfoForm({ ...infoForm, address: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#06140e] border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Nama Kontak IT Helpdesk</label>
                      <input
                        type="text"
                        value={infoForm.itHelpdeskName}
                        onChange={(e) => setInfoForm({ ...infoForm, itHelpdeskName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#06140e] border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Nomor WhatsApp IT Helpdesk</label>
                      <input
                        type="text"
                        value={infoForm.itHelpdeskPhone}
                        onChange={(e) => setInfoForm({ ...infoForm, itHelpdeskPhone: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#06140e] border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-700 hover:from-cyan-500 hover:to-teal-600 text-white text-xs font-bold shadow-lg transition-all active:scale-95 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Simpan Perubahan Informasi</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 8: AUDIT LOGS & JEJAK AKTIVITAS (KHUSUS IT ADMIN)                    */}
            {/* ========================================================================= */}
            {activeTab === 'LOGS' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <History className="w-5 h-5 text-slate-400" />
                    <span>Audit Trail & Jejak Aktivitas Keamanan</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Catatan otomatis setiap perubahan data, penambahan SOP, otorisasi staf, dan pembaruan sistem.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 overflow-hidden bg-[#091b14]">
                  <div className="divide-y divide-slate-800">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="p-3.5 flex items-start justify-between gap-3 text-xs hover:bg-[#0c241b]/50">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-amber-400 border border-slate-700">
                              {log.category}
                            </span>
                            <span className="font-bold text-white">{log.action}</span>
                          </div>
                          <p className="text-slate-300">{log.details}</p>
                          <p className="text-[10px] text-slate-500">
                            Oleh: <strong className="text-slate-400">{log.userName}</strong> ({log.userEmail})
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })} WIT
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODALS SECTION                                                            */}
      {/* ========================================================================= */}
      {/* Modal Tambah Karyawan Whitelist */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md rounded-3xl bg-[#091f17] border-2 border-purple-500/40 shadow-2xl p-6 text-slate-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <PapuanBorderCorner position="top-right" />
            <PapuanBorderCorner position="bottom-left" />

            <div className="flex items-center justify-between pb-3 border-b border-purple-500/20 mb-4">
              <div className="flex items-center gap-2.5">
                <UserPlus className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-black text-white font-serif">Tambah Karyawan ke Whitelist</h3>
              </div>
              <button
                onClick={() => setShowAddStaffModal(false)}
                className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Nama Lengkap Karyawan</label>
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="Contoh: Samuel Burdam"
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-[#06140e] border border-purple-500/30 text-xs text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Email Akun Google (Login)</label>
                <input
                  type="email"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="samuel@gmail.com"
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-[#06140e] border border-purple-500/30 text-xs text-purple-300 font-mono focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Hak Akses Role</label>
                  <select
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value as UserRole)}
                    className="w-full px-2.5 py-2 rounded-xl bg-[#06140e] border border-purple-500/30 text-xs text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="OPERATIONAL">Staf Operasional</option>
                    <option value="FINANCE_WAREHOUSE">Staf Keuangan & Gudang</option>
                    <option value="EXECUTIVE">Manajemen Eksekutif</option>
                    <option value="IT_ADMIN">IT Superadmin</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Jabatan / Posisi</label>
                  <input
                    type="text"
                    value={staffRoleTitle}
                    onChange={(e) => setStaffRoleTitle(e.target.value)}
                    placeholder="Staf Homestay"
                    className="w-full px-2.5 py-2 rounded-xl bg-[#06140e] border border-purple-500/30 text-xs text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Divisi / Unit Kerja</label>
                <input
                  type="text"
                  value={staffDepartment}
                  onChange={(e) => setStaffDepartment(e.target.value)}
                  placeholder="Frontdesk & Homestay Etnik"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#06140e] border border-purple-500/30 text-xs text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 text-xs font-bold border border-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-500 text-white text-xs font-extrabold shadow-md active:scale-95"
                >
                  Simpan Karyawan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Kelola Notifikasi */}
      {showNoticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-lg rounded-3xl bg-[#091f17] border-2 border-amber-500/40 shadow-2xl p-6 text-slate-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <PapuanBorderCorner position="top-right" />
            <PapuanBorderCorner position="bottom-left" />

            <div className="flex items-center justify-between pb-3 border-b border-amber-500/20 mb-4">
              <div className="flex items-center gap-2.5">
                <Bell className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white font-serif">
                  {editingNotice ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}
                </h3>
              </div>
              <button
                onClick={() => setShowNoticeModal(false)}
                className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNotice} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-400">Judul Pengumuman</label>
                <input
                  type="text"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder="Contoh: Jadwal Pentas Seni Budaya & Rapat Pleno"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-amber-500/30 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Isi Pengumuman Lengkap</label>
                <textarea
                  rows={4}
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  placeholder="Tuliskan instruksi, detail agenda, atau pengumuman resmi..."
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-[#06140e] border border-amber-500/30 text-xs text-white focus:outline-none focus:border-amber-400 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Kategori</label>
                  <select
                    value={noticeCategory}
                    onChange={(e) => setNoticeCategory(e.target.value as NoticeCategory)}
                    className="w-full px-2.5 py-2 rounded-xl bg-[#06140e] border border-amber-500/30 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="INSTRUCTION">Instruksi Pimpinan</option>
                    <option value="EVENT">Agenda / Acara</option>
                    <option value="MAINTENANCE">Pemeliharaan IT</option>
                    <option value="ANNOUNCEMENT">Pengumuman Umum</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Prioritas</label>
                  <select
                    value={noticePriority}
                    onChange={(e) => setNoticePriority(e.target.value as NoticePriority)}
                    className="w-full px-2.5 py-2 rounded-xl bg-[#06140e] border border-amber-500/30 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="CRITICAL">Kritis / Penting Sekali</option>
                    <option value="HIGH">Tinggi</option>
                    <option value="MEDIUM">Sedang</option>
                    <option value="LOW">Rendah</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={noticeIsPinned}
                  onChange={(e) => setNoticeIsPinned(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <span className="text-xs font-bold text-amber-300">Sematkan di Bilah Atas Beranda</span>
              </label>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNoticeModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 text-xs font-bold border border-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 text-white text-xs font-extrabold shadow-md active:scale-95"
                >
                  {editingNotice ? 'Simpan Perubahan' : 'Terbitkan Pengumuman'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Kelola Aplikasi */}
      {showAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-lg rounded-3xl bg-[#091f17] border-2 border-emerald-500/40 shadow-2xl p-6 text-slate-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <PapuanBorderCorner position="top-right" />
            <PapuanBorderCorner position="bottom-left" />

            <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20 mb-4">
              <div className="flex items-center gap-2.5">
                <Link2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-black text-white font-serif">
                  {editingApp ? 'Edit Konfigurasi Aplikasi' : 'Tambah Modul Aplikasi'}
                </h3>
              </div>
              <button
                onClick={() => setShowAppModal(false)}
                className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveApp} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-emerald-400">Nama Aplikasi</label>
                <input
                  type="text"
                  value={appTitle}
                  onChange={(e) => setAppTitle(e.target.value)}
                  placeholder="Contoh: Sistem Informasi Keuangan"
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-[#06140e] border border-emerald-500/30 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Tautan Produksi (URL Vercel / Domain)</label>
                <input
                  type="url"
                  value={appUrl}
                  onChange={(e) => setAppUrl(e.target.value)}
                  placeholder="https://apk-reservasi-homestay-rep.vercel.app"
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-[#06140e] border border-emerald-500/30 text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Kode Singkat</label>
                  <input
                    type="text"
                    value={appShortCode}
                    onChange={(e) => setAppShortCode(e.target.value)}
                    placeholder="RESERVASI"
                    className="w-full px-2.5 py-2 rounded-xl bg-[#06140e] border border-emerald-500/30 text-xs text-white uppercase focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Status Modul</label>
                  <select
                    value={appStatus}
                    onChange={(e) => setAppStatus(e.target.value as AppStatus)}
                    className="w-full px-2.5 py-2 rounded-xl bg-[#06140e] border border-emerald-500/30 text-xs text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value="ONLINE">Online (Aktif)</option>
                    <option value="MAINTENANCE">Dalam Pemeliharaan</option>
                    <option value="UPDATED">Pembaruan Versi</option>
                    <option value="OFFLINE">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={appDescription}
                  onChange={(e) => setAppDescription(e.target.value)}
                  placeholder="Penjelasan fungsi aplikasi..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#06140e] border border-emerald-500/30 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAppModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 text-xs font-bold border border-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 text-white text-xs font-extrabold shadow-md active:scale-95"
                >
                  {editingApp ? 'Simpan Perubahan' : 'Tambah Aplikasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Agenda CRUD */}
      <CreateEventModal
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setEditingEvent(null);
        }}
        onSave={handleSaveEvent}
        initialData={editingEvent}
        currentUserDisplayName={currentAdminName}
      />

      <EventDetailModal
        event={selectedEventForDetail}
        onClose={() => setSelectedEventForDetail(null)}
        onEdit={(ev) => {
          setSelectedEventForDetail(null);
          handleOpenEditEvent(ev);
        }}
        onDelete={(id) => {
          deleteEvent(id, currentAdminName);
          loadData();
        }}
        canManage={true}
      />

      {/* Modal Dokumen CRUD */}
      <CreateDocumentModal
        isOpen={showDocModal}
        onClose={() => {
          setShowDocModal(false);
          setEditingDoc(null);
        }}
        onSave={handleSaveDoc}
        initialData={editingDoc}
        currentUserDisplayName={currentAdminName}
      />

      <DocumentDetailModal
        doc={selectedDocForDetail}
        onClose={() => setSelectedDocForDetail(null)}
        onEdit={(doc) => {
          setSelectedDocForDetail(null);
          handleOpenEditDoc(doc);
        }}
        onDelete={(id) => {
          deleteDocument(id, currentAdminName);
          loadData();
        }}
        canManage={true}
      />

      {/* Modal Permohonan Akses / Upgrade Role */}
      <RequestAccessModal
        isOpen={requestAccessModalOpen}
        onClose={() => setRequestAccessModalOpen(false)}
      />

      {/* PWA Modal */}
      {pwaModalOpen && (
        <PWAInstallModal isOpen={pwaModalOpen} onClose={() => setPwaModalOpen(false)} />
      )}

      <PWAInstallBanner onOpenModal={() => setPwaModalOpen(true)} />
    </div>
  );
}
