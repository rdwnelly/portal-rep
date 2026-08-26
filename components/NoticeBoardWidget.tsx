'use client';

import React from 'react';
import Link from 'next/link';
import { NoticeItem, UserProfile } from '@/lib/types';
import {
  Bell,
  Pin,
  AlertTriangle,
  ArrowRight,
  PlusCircle
} from 'lucide-react';
import Image from 'next/image';

interface NoticeBoardWidgetProps {
  notices: NoticeItem[];
  user: UserProfile | null;
  onSelectNotice: (notice: NoticeItem) => void;
  onOpenCreateModal?: () => void;
}

export default function NoticeBoardWidget({
  notices,
  user,
  onSelectNotice,
  onOpenCreateModal,
}: NoticeBoardWidgetProps) {
  const canPostNotice = user?.role === 'EXECUTIVE' || user?.role === 'IT_ADMIN';

  // Sort pinned first, then by date
  const sortedNotices = [...notices].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const getCategoryBadge = (cat: string, prio: string) => {
    if (prio === 'URGENT') {
      return (
        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-500/40">
          <AlertTriangle className="w-3 h-3 text-red-400" />
          PENTING & MENDESAK
        </span>
      );
    }
    switch (cat) {
      case 'INSTRUCTION':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/40">
            Instruksi Pimpinan
          </span>
        );
      case 'AGENDA':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
            Agenda Harian
          </span>
        );
      case 'SOP':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-500/40">
            SOP & Kebijakan
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
            Pengumuman
          </span>
        );
    }
  };

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
    <div className="rounded-2xl glass-panel bg-[#0a1f17]/90 border border-amber-500/25 p-5 md:p-6 shadow-xl relative overflow-hidden">
      {/* Header Section */}
      <div className="flex items-center justify-between gap-3 mb-5 border-b border-amber-500/15 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Papan Pengumuman Internal</h2>
              <span className="text-[10px] bg-amber-950 text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                Real-Time
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Instruksi Direksi, Agenda Wisata Budaya, dan SOP Rumah Etnik Papua
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canPostNotice && onOpenCreateModal && (
            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Buat Instruksi</span>
            </button>
          )}

          <Link
            href="/dashboard/notices"
            className="flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-amber-950/40"
          >
            <span>Semua</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Notices List */}
      <div className="space-y-3">
        {sortedNotices.slice(0, 3).map((notice) => (
          <div
            key={notice.id}
            onClick={() => onSelectNotice(notice)}
            className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border ${
              notice.isPinned
                ? 'bg-[#0f2e22]/90 border-amber-500/40 hover:border-amber-400 hover:bg-[#143a2b]'
                : 'bg-[#091a13]/80 border-amber-500/15 hover:border-amber-500/30 hover:bg-[#0c241b]'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                {notice.isPinned && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30">
                    <Pin className="w-3 h-3 rotate-45" /> Pinned
                  </span>
                )}
                {getCategoryBadge(notice.category, notice.priority)}
              </div>
              <span className="text-[10px] text-slate-400 shrink-0">
                {formatDate(notice.createdAt)} WIT
              </span>
            </div>

            <h3 className="text-sm font-bold text-slate-100 hover:text-amber-300 transition-colors line-clamp-1 mb-1">
              {notice.title}
            </h3>

            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
              {notice.content}
            </p>

            <div className="mt-3 pt-2.5 border-t border-amber-500/10 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full overflow-hidden bg-amber-900/40 border border-amber-400/30 flex items-center justify-center text-[10px] text-amber-300">
                  {notice.authorAvatar ? (
                    <Image
                      src={notice.authorAvatar}
                      alt={notice.authorName}
                      width={20}
                      height={20}
                      className="object-cover"
                    />
                  ) : (
                    notice.authorName.charAt(0)
                  )}
                </div>
                <span className="font-semibold text-slate-300">{notice.authorName}</span>
                <span className="text-[10px] text-slate-500">• {notice.authorRole}</span>
              </div>

              <span className="text-amber-400 font-semibold text-[10px] hover:underline flex items-center gap-1">
                Baca Lengkap <ArrowRight className="w-2.5 h-2.5" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
