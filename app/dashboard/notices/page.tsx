'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { AlertTriangle, Pin, Plus, Trash2 } from 'lucide-react';
import { useAuth, isManagerRole } from '@/lib/auth-context';
import { deleteNotice, getNotices, SSR_NOTICES, togglePinNotice } from '@/lib/storage';
import { useStoreValue } from '@/lib/use-store';
import type { NoticeItem } from '@/lib/types';
import Navbar from '@/components/Navbar';
import PageHeader from '@/components/PageHeader';
import NoticeDetailModal from '@/components/NoticeDetailModal';
import CreateNoticeModal from '@/components/CreateNoticeModal';

const noopSubscribe = () => () => {};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { timeZone: 'Asia/Jayapura', day: 'numeric', month: 'short', year: 'numeric' });

/** Papan pengumuman: yang disematkan di atas, ketuk untuk membaca & mengonfirmasi. */
export default function NoticesPage() {
  const { user } = useAuth();
  const canManage = isManagerRole(user?.role);
  const notices = useStoreValue('notices', getNotices, SSR_NOTICES);

  const [selected, setSelected] = useState<NoticeItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  // Tautan dari notifikasi push: /dashboard/notices?notice=<id> langsung membuka pengumuman itu.
  // Dibaca lewat useSyncExternalStore agar render server & hidrasi tetap identik.
  const deepLinkId = useSyncExternalStore(
    noopSubscribe,
    () => new URLSearchParams(window.location.search).get('notice'),
    () => null
  );
  const [deepLinkDismissed, setDeepLinkDismissed] = useState(false);
  const deepLinked = deepLinkId && !deepLinkDismissed ? notices.find((n) => n.id === deepLinkId) ?? null : null;

  const sorted = [...notices].sort(
    (a, b) => Number(b.isPinned) - Number(a.isPinned) || b.createdAt.localeCompare(a.createdAt)
  );

  return (
    <div className="dock-safe min-h-screen bg-[#f6f4ee] dark:bg-[#07130f] text-stone-900 dark:text-slate-100">
      <Navbar />
      <main className="max-w-xl mx-auto px-4">
        <PageHeader
          title="Pengumuman"
          subtitle="Instruksi dan informasi resmi untuk staf."
          action={
            canManage && (
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="h-10 px-3 flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Buat
              </button>
            )
          }
        />

        <ul className="space-y-3">
          {sorted.map((n) => (
            <li key={n.id} className="relative">
              <button
                type="button"
                onClick={() => setSelected(n)}
                className="w-full p-4 rounded-2xl bg-white dark:bg-[#0c241b] border border-stone-200 dark:border-white/10 text-left cursor-pointer"
              >
                {(n.isPinned || n.priority === 'URGENT') && (
                  <span className="flex flex-wrap gap-1.5 mb-2">
                    {n.priority === 'URGENT' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                        <AlertTriangle className="w-3 h-3" /> Mendesak
                      </span>
                    )}
                    {n.isPinned && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                        <Pin className="w-3 h-3" /> Disematkan
                      </span>
                    )}
                  </span>
                )}
                <span className={`block text-[15px] font-semibold leading-snug ${canManage ? 'pr-20' : ''}`}>{n.title}</span>
                <span className="mt-1 text-sm text-stone-600 dark:text-slate-300 line-clamp-2">{n.content}</span>
                <span className="block mt-2 text-xs text-stone-500 dark:text-slate-400">
                  {n.authorName} · {formatDate(n.createdAt)}
                </span>
              </button>

              {canManage && (
                <span className="absolute top-3 right-3 flex gap-1">
                  <button
                    type="button"
                    onClick={() => togglePinNotice(n.id)}
                    aria-label={n.isPinned ? 'Lepas sematan' : 'Sematkan'}
                    className={`w-9 h-9 flex items-center justify-center rounded-full cursor-pointer ${
                      n.isPinned ? 'text-amber-600 dark:text-amber-400' : 'text-stone-400'
                    } hover:bg-stone-100 dark:hover:bg-white/10`}
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Hapus pengumuman ini?')) deleteNotice(n.id, user?.displayName || 'Admin');
                    }}
                    aria-label="Hapus pengumuman"
                    className="w-9 h-9 flex items-center justify-center rounded-full text-stone-400 hover:text-rose-600 hover:bg-stone-100 dark:hover:bg-white/10 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>

        {notices.length === 0 && (
          <p className="p-8 text-center text-sm text-stone-600 dark:text-slate-300 rounded-2xl bg-white dark:bg-[#0c241b] border border-dashed border-stone-300 dark:border-white/15">
            Belum ada pengumuman.
          </p>
        )}
      </main>

      <NoticeDetailModal
        notice={selected ?? deepLinked}
        onClose={() => {
          setSelected(null);
          setDeepLinkDismissed(true);
        }}
      />
      {createOpen && <CreateNoticeModal user={user} onClose={() => setCreateOpen(false)} onNoticeCreated={() => {}} />}
    </div>
  );
}
