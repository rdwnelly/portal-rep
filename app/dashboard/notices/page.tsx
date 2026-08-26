'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getNotices, togglePinNotice, deleteNotice } from '@/lib/storage';
import { NoticeItem } from '@/lib/types';
import Navbar from '@/components/Navbar';
import NoticeDetailModal from '@/components/NoticeDetailModal';
import CreateNoticeModal from '@/components/CreateNoticeModal';
import PWAInstallModal from '@/components/PWAInstallModal';
import PWAInstallBanner from '@/components/PWAInstallBanner';
import Image from 'next/image';
import {
  Bell,
  Search,
  PlusCircle,
  Pin,
  Trash2,
  AlertTriangle,
  FileText,
  Paperclip,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

const subscribeClient = () => () => {};

export default function NoticesPage() {
  const { user, isInitialized } = useAuth();
  const isClient = useSyncExternalStore(subscribeClient, () => true, () => false);

  const [notices, setNotices] = useState<NoticeItem[]>(() => (typeof window !== 'undefined' ? getNotices() : []));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);
  const [createNoticeModalOpen, setCreateNoticeModalOpen] = useState(false);
  const [pwaModalOpen, setPwaModalOpen] = useState(false);

  const canManageNotice = user?.role === 'EXECUTIVE' || user?.role === 'IT_ADMIN';

  useEffect(() => {
    const handleStorageUpdate = () => {
      setNotices(getNotices());
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

  const currentNotices = notices.length > 0 ? notices : getNotices();

  const handleTogglePin = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    togglePinNotice(id);
    setNotices(getNotices());
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) {
      deleteNotice(id, user?.displayName || 'Admin');
      setNotices(getNotices());
    }
  };

  const filteredNotices = currentNotices.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.authorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'ALL' || n.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedNotices = [...filteredNotices].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const categories = [
    { id: 'ALL', label: 'Semua Pengumuman' },
    { id: 'INSTRUCTION', label: 'Instruksi Pimpinan' },
    { id: 'AGENDA', label: 'Agenda Harian' },
    { id: 'SOP', label: 'SOP & Kebijakan' },
    { id: 'URGENT', label: 'Mendesak' },
  ];

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#07130f] papuan-pattern-overlay text-slate-100 selection:bg-amber-500 selection:text-black">
      <Navbar onOpenPwaModal={() => setPwaModalOpen(true)} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 pb-32 md:pb-8">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors mb-2 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Katalog Aplikasi
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                  Papan Pengumuman & Instruksi Internal
                </h1>
                <p className="text-xs text-slate-400">
                  Saluran komunikasi resmi jajaran pengurus Yayasan Rumah Etnik Papua
                </p>
              </div>
            </div>
          </div>

          {canManageNotice && (
            <button
              onClick={() => setCreateNoticeModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold shadow-lg shadow-amber-950/60 transition-all self-start sm:self-auto cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Buat Pengumuman Baru</span>
            </button>
          )}
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#091b14] p-3.5 rounded-2xl border border-amber-500/20">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-[#0e2c20]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari pengumuman atau pengirim..."
              className="w-full pl-10 pr-4 py-1.5 rounded-xl bg-[#06140e] border border-amber-500/20 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Notices Grid / Feed */}
        <div className="space-y-4">
          {sortedNotices.length === 0 ? (
            <div className="p-12 text-center rounded-2xl glass-panel bg-[#091a13] border border-amber-500/20 space-y-2">
              <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-300">Tidak ada pengumuman</h3>
              <p className="text-xs text-slate-500">
                Tidak ditemukan pengumuman sesuai filter atau pencarian Anda.
              </p>
            </div>
          ) : (
            sortedNotices.map((notice) => (
              <div
                key={notice.id}
                onClick={() => setSelectedNotice(notice)}
                className={`p-5 rounded-2xl glass-panel cursor-pointer transition-all duration-200 border relative overflow-hidden group ${
                  notice.isPinned
                    ? 'bg-[#0e2c20]/90 border-amber-500/40 hover:border-amber-400'
                    : 'bg-[#091b14]/80 border-amber-500/15 hover:border-amber-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {notice.isPinned && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-500/40">
                        <Pin className="w-3 h-3 rotate-45" /> Pinned
                      </span>
                    )}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 uppercase">
                      {notice.category}
                    </span>
                    {notice.priority === 'URGENT' && (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-500/30">
                        <AlertTriangle className="w-3 h-3" /> MENDESAK
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">
                      {formatDate(notice.createdAt)} WIT
                    </span>

                    {canManageNotice && (
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={(e) => handleTogglePin(e, notice.id)}
                          title={notice.isPinned ? 'Lepas Pin' : 'Sematkan'}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            notice.isPinned
                              ? 'bg-amber-950 text-amber-400 border-amber-500/40'
                              : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                          }`}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, notice.id)}
                          title="Hapus Pengumuman"
                          className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-400 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <h2 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors mb-2">
                  {notice.title}
                </h2>

                <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 mb-4">
                  {notice.content}
                </p>

                <div className="pt-3 border-t border-amber-500/10 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-amber-900/50 border border-amber-400/30 flex items-center justify-center text-[10px] text-amber-300 font-bold">
                      {notice.authorAvatar ? (
                        <Image
                          src={notice.authorAvatar}
                          alt={notice.authorName}
                          width={24}
                          height={24}
                          className="object-cover"
                        />
                      ) : (
                        notice.authorName.charAt(0)
                      )}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-200">{notice.authorName}</span>
                      <span className="text-[10px] text-slate-500 ml-1.5">({notice.authorRole})</span>
                    </div>
                  </div>

                  {notice.attachments && notice.attachments.length > 0 && (
                    <span className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/20">
                      <Paperclip className="w-3 h-3" />
                      {notice.attachments.length} Lampiran
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Modals */}
      <NoticeDetailModal
        notice={selectedNotice}
        onClose={() => setSelectedNotice(null)}
      />

      {createNoticeModalOpen && (
        <CreateNoticeModal
          user={user}
          onClose={() => setCreateNoticeModalOpen(false)}
          onNoticeCreated={(newNotice) => {
            setNotices((prev) => [newNotice, ...prev]);
          }}
        />
      )}

      <PWAInstallModal
        isOpen={pwaModalOpen}
        onClose={() => setPwaModalOpen(false)}
      />

      <PWAInstallBanner onOpenModal={() => setPwaModalOpen(true)} />
    </div>
  );
}
