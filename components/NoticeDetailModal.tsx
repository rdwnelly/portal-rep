'use client';

import React from 'react';
import { NoticeItem } from '@/lib/types';
import {
  X,
  Pin,
  Calendar,
  User,
  Paperclip,
  Download,
  AlertTriangle,
  FileCheck
} from 'lucide-react';
import Image from 'next/image';

interface NoticeDetailModalProps {
  notice: NoticeItem | null;
  onClose: () => void;
}

export default function NoticeDetailModal({ notice, onClose }: NoticeDetailModalProps) {
  if (!notice) return null;

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-xl my-auto rounded-3xl glass-panel bg-[#091c15] border-2 border-amber-500/35 shadow-2xl p-6 overflow-hidden max-h-[90dvh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-all border border-slate-700 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-4 pr-10">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {notice.isPinned && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-500/40">
                <Pin className="w-3 h-3 rotate-45" /> Pengumuman Disematkan
              </span>
            )}
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 uppercase">
              {notice.category}
            </span>
            {notice.priority === 'URGENT' && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-500/40">
                <AlertTriangle className="w-3 h-3" /> MENDESAK
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-white leading-snug">{notice.title}</h2>
        </div>

        {/* Author & Timestamp Bar */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0c241b] border border-amber-500/20 mb-4">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-amber-950 border border-amber-400/30 flex items-center justify-center text-amber-300 font-bold">
            {notice.authorAvatar ? (
              <Image
                src={notice.authorAvatar}
                alt={notice.authorName}
                width={40}
                height={40}
                className="object-cover"
              />
            ) : (
              <User className="w-5 h-5" />
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-white">{notice.authorName}</p>
            <p className="text-[11px] text-amber-400/90">{notice.authorRole}</p>
            <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-500" />
              {formatDate(notice.createdAt)} WIT
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-xs sm:text-sm text-slate-200 leading-relaxed bg-[#06140e] p-4 rounded-xl border border-slate-800/80">
          <p className="whitespace-pre-line">{notice.content}</p>

          {/* Attachments if any */}
          {notice.attachments && notice.attachments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-700/60">
              <p className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5" />
                Lampiran Dokumen Resmi:
              </p>
              <div className="space-y-2">
                {notice.attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-400" />
                      <span className="text-slate-200 font-medium">{att.name}</span>
                      {att.size && <span className="text-[10px] text-slate-500">({att.size})</span>}
                    </div>
                    <button
                      onClick={() => alert(`Mengunduh dokumen: ${att.name}`)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-600/80 hover:bg-amber-600 text-white text-[11px] font-semibold transition-all"
                    >
                      <Download className="w-3 h-3" />
                      <span>Unduh</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
