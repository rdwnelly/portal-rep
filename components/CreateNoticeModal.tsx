'use client';

import React, { useState } from 'react';
import { NoticeItem, NoticeCategory, NoticePriority, UserProfile } from '@/lib/types';
import { addNotice } from '@/lib/storage';
import { X, Send, Pin, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CreateNoticeModalProps {
  user: UserProfile | null;
  onClose: () => void;
  onNoticeCreated: (notice: NoticeItem) => void;
}

export default function CreateNoticeModal({ user, onClose, onNoticeCreated }: CreateNoticeModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<NoticeCategory>('INSTRUCTION');
  const [priority, setPriority] = useState<NoticePriority>('NORMAL');
  const [isPinned, setIsPinned] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Judul dan isi pengumuman wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newNotice = addNotice({
        title: title.trim(),
        content: content.trim(),
        category,
        priority,
        isPinned,
        authorName: user?.displayName || 'Manajemen Yayasan',
        authorRole: user?.roleTitle || 'Pengurus',
        authorAvatar: user?.photoURL,
      });

      if (typeof window !== 'undefined') {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#e5a93c', '#10b981', '#3b82f6'],
        });
      }

      onNoticeCreated(newNotice);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menerbitkan pengumuman.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl glass-panel bg-[#091c15] border border-amber-500/40 shadow-2xl p-6 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-all border border-slate-700"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-500/30">
              MODUL MANAJEMEN
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">Siarkan Instruksi / Pengumuman</h2>
          <p className="text-xs text-slate-400">
            Pengumuman akan langsung disiarkan secara real-time ke seluruh staf Rumah Etnik Papua.
          </p>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-950/80 border border-red-500/40 text-xs text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Judul Pengumuman *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Arahan Operasional Homestay Menjelang Akhir Pekan"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-amber-500/30 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as NoticeCategory)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#06140e] border border-amber-500/30 text-white focus:outline-none focus:border-amber-400 text-xs"
              >
                <option value="INSTRUCTION">Instruksi Pimpinan</option>
                <option value="AGENDA">Agenda Harian</option>
                <option value="SOP">SOP & Kebijakan</option>
                <option value="ANNOUNCEMENT">Pengumuman Umum</option>
                <option value="URGENT">Pemberitahuan Darurat</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Prioritas</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as NoticePriority)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#06140e] border border-amber-500/30 text-white focus:outline-none focus:border-amber-400 text-xs"
              >
                <option value="NORMAL">Normal</option>
                <option value="HIGH">Tinggi</option>
                <option value="URGENT">Mendesak (Merah)</option>
                <option value="LOW">Rendah / Info</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Isi Lengkap Pesan / Arahan *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="Tuliskan arahan, instruksi SOP, atau rincian agenda di sini..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-amber-500/30 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 text-xs leading-relaxed"
              required
            />
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-[#0c241b] border border-amber-500/20">
            <input
              type="checkbox"
              id="pinNotice"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="rounded accent-amber-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="pinNotice" className="text-slate-200 cursor-pointer flex items-center gap-1.5 font-medium">
              <Pin className="w-3.5 h-3.5 text-amber-400" />
              Sematkan di posisi teratas (Pinned Notice)
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold shadow-lg shadow-amber-950/60 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Menerbitkan...' : 'Siarkan Pengumuman'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
