'use client';

import React, { useState } from 'react';
import { addNotice, updateNotice, deleteNotice, togglePinNotice } from '@/lib/storage';
import { pushIfUrgent } from '@/lib/push';
import { NoticeItem, NoticeCategory, NoticePriority } from '@/lib/types';
import { Bell, Trash2, Edit2, X, Plus, Pin } from 'lucide-react';
import { PapuanBorderCorner } from '@/components/PapuanMotif';

/** Kelola notifikasi & pengumuman. */
export default function NoticesTab({ notices, currentAdminName }: { notices: NoticeItem[]; currentAdminName: string }) {
  // Form States: Kelola Notifikasi
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState<NoticeItem | null>(null);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeCategory, setNoticeCategory] = useState<NoticeCategory>('INSTRUCTION');
  const [noticePriority, setNoticePriority] = useState<NoticePriority>('HIGH');
  const [noticeIsPinned, setNoticeIsPinned] = useState(true);
  const [noticeAuthor, setNoticeAuthor] = useState('');

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
      const created = addNotice({
        title: noticeTitle.trim(),
        content: noticeContent.trim(),
        category: noticeCategory,
        priority: noticePriority,
        isPinned: noticeIsPinned,
        authorName: noticeAuthor.trim() || currentAdminName,
        authorRole: 'Administrator Yayasan REP',
      });
      // Pengumuman MENDESAK langsung dikirim sebagai notifikasi push.
      pushIfUrgent(created);
    }
    setShowNoticeModal(false);
  };

  const handleDeleteNotice = (id: string, title: string) => {
    if (confirm(`Hapus pengumuman "${title}"?`)) {
      deleteNotice(id, currentAdminName);
    }
  };

  const handleTogglePin = (id: string) => {
    togglePinNotice(id);
  };

  return (
    <>
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
    </>
  );
}
