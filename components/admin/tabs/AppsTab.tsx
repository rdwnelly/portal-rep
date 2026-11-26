'use client';

import React, { useEffect, useState } from 'react';
import { addAppItem, updateAppItem, deleteAppItem } from '@/lib/storage';
import { AppItem, AppStatus, AppCategory } from '@/lib/types';
import { Link2, Trash2, Edit2, X, Plus, ExternalLink } from 'lucide-react';
import { PapuanBorderCorner } from '@/components/PapuanMotif';
import AppIcon from '@/components/AppIcon';

const STATUS_BADGE: Record<AppStatus, { label: string; className: string }> = {
  ONLINE: { label: 'Aktif', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300' },
  UPDATED: { label: 'Diperbarui', className: 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300' },
  MAINTENANCE: { label: 'Perbaikan', className: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300' },
  OFFLINE: { label: 'Tidak aktif', className: 'bg-stone-200 text-stone-700 dark:bg-white/10 dark:text-slate-300' },
};

/** Kelola link aplikasi kerja yang tampil di portal. */
export default function AppsTab({ apps, showingDefaults }: { apps: AppItem[]; showingDefaults: boolean }) {
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

  // Tutup formulir dengan tombol Escape.
  useEffect(() => {
    if (!showAppModal) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setShowAppModal(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showAppModal]);

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

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSaveApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!appTitle.trim() || !appUrl.trim()) return;
    // Sama dengan aturan Firestore: hanya http/https (cegah tautan javascript: dsb.).
    if (!/^https?:\/\/.+/i.test(appUrl.trim())) {
      setFormError('Link harus diawali http:// atau https://');
      return;
    }

    setSaving(true);
    const ok = editingApp
      ? await updateAppItem(editingApp.id, {
          title: appTitle.trim(),
          shortCode: appShortCode.trim(),
          url: appUrl.trim(),
          description: appDescription.trim(),
          category: appCategory,
          status: appStatus,
          badgeText: appBadgeText.trim(),
        })
      : await addAppItem({
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
        });
    setSaving(false);
    // Bila gagal, pesan kesalahan sudah tampil lewat notifikasi; formulir dibiarkan terbuka.
    if (ok) setShowAppModal(false);
  };

  const handleDeleteApp = (id: string, title: string) => {
    if (confirm(`Hapus aplikasi "${title}" dari portal?`)) void deleteAppItem(id);
  };

  return (
    <>
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <Link2 className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />
                <span>Link Aplikasi</span>
              </h1>
              <p className="mt-1 text-sm text-stone-500 dark:text-slate-400">
                Ubah aplikasi yang sudah ada atau tambahkan modul aplikasi baru ke portal.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenNewApp}
              className="h-11 flex items-center justify-center gap-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Modul Aplikasi</span>
            </button>
          </div>

          {showingDefaults && (
            <p
              role="status"
              className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/30 text-xs text-amber-800 dark:text-amber-200 leading-relaxed"
            >
              Daftar ini masih <strong>daftar bawaan</strong> dan belum tersimpan di database. Perubahan pertama
              Anda akan menyimpan seluruh daftar ini sekaligus.
            </p>
          )}

          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {apps.map((app) => {
              const status = STATUS_BADGE[app.status] ?? STATUS_BADGE.ONLINE;
              return (
                <li
                  key={app.id}
                  className="p-4 sm:p-5 rounded-2xl bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      {app.shortCode || 'APP'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.className}`}>
                      {status.label}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <AppIcon app={app} />
                      <h2 className="text-base font-bold text-stone-900 dark:text-white leading-snug">{app.title}</h2>
                    </div>
                    {app.description && (
                      <p className="text-xs text-stone-600 dark:text-slate-300 mt-1 line-clamp-2">{app.description}</p>
                    )}
                    <a
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Buka ${app.title}`}
                      className="mt-2 inline-flex max-w-full items-center gap-1 text-[11px] font-mono text-emerald-700 dark:text-emerald-400 hover:underline"
                    >
                      <span className="truncate">{app.url}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>

                  <div className="mt-auto pt-3 border-t border-stone-200 dark:border-white/10 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditApp(app)}
                      aria-label={`Edit ${app.title}`}
                      className="flex-1 h-10 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteApp(app.id, app.title)}
                      aria-label={`Hapus ${app.title}`}
                      title="Hapus aplikasi"
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-white/5 hover:bg-rose-100 dark:hover:bg-rose-950/60 border border-stone-200 dark:border-white/10 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {showAppModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="judul-form-aplikasi"
              className="relative w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-3xl bg-white dark:bg-[#0c241b] border border-stone-200 dark:border-emerald-500/40 shadow-2xl p-6 text-stone-900 dark:text-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              <PapuanBorderCorner position="top-right" />
              <PapuanBorderCorner position="bottom-left" />

              <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20 mb-4">
                <div className="flex items-center gap-2.5">
                  <Link2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                  <h2 id="judul-form-aplikasi" className="text-base font-bold text-stone-900 dark:text-white">
                    {editingApp ? `Edit ${editingApp.title}` : 'Tambah Modul Aplikasi'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAppModal(false)}
                  aria-label="Tutup"
                  className="p-1.5 rounded-xl bg-stone-100 dark:bg-slate-900 text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white border border-stone-200 dark:border-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={(e) => void handleSaveApp(e)} className="space-y-3.5">
                {formError && (
                  <p role="alert" className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-500/40 text-xs text-rose-800 dark:text-rose-200">
                    {formError}
                  </p>
                )}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Nama Aplikasi</label>
                  <input
                    type="text"
                    value={appTitle}
                    onChange={(e) => setAppTitle(e.target.value)}
                    placeholder="Contoh: Sistem Informasi Keuangan"
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-white/5 border border-emerald-500/30 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-600 dark:text-slate-300">Tautan Produksi (URL Vercel / Domain)</label>
                  <input
                    type="url"
                    value={appUrl}
                    onChange={(e) => setAppUrl(e.target.value)}
                    placeholder="https://apk-reservasi-homestay-rep.vercel.app"
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-white/5 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300 font-mono focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-600 dark:text-slate-300">Kode Singkat</label>
                    <input
                      type="text"
                      value={appShortCode}
                      onChange={(e) => setAppShortCode(e.target.value)}
                      placeholder="RESERVASI"
                      className="w-full px-2.5 py-2 rounded-xl bg-stone-50 dark:bg-white/5 border border-emerald-500/30 text-xs text-stone-900 dark:text-white uppercase focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-600 dark:text-slate-300">Status Modul</label>
                    <select
                      value={appStatus}
                      onChange={(e) => setAppStatus(e.target.value as AppStatus)}
                      className="w-full px-2.5 py-2 rounded-xl bg-stone-50 dark:bg-white/5 border border-emerald-500/30 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-emerald-400"
                    >
                      <option value="ONLINE">Online (Aktif)</option>
                      <option value="MAINTENANCE">Dalam Pemeliharaan</option>
                      <option value="UPDATED">Pembaruan Versi</option>
                      <option value="OFFLINE">Nonaktif</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-600 dark:text-slate-300">Deskripsi Singkat</label>
                  <textarea
                    rows={2}
                    value={appDescription}
                    onChange={(e) => setAppDescription(e.target.value)}
                    placeholder="Penjelasan fungsi aplikasi..."
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-white/5 border border-emerald-500/30 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAppModal(false)}
                    className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-slate-900 text-stone-600 dark:text-slate-300 text-xs font-bold border border-stone-200 dark:border-slate-700"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 text-white text-xs font-extrabold shadow-md active:scale-95 disabled:opacity-50"
                  >
                    {saving ? 'Menyimpan…' : editingApp ? 'Simpan Perubahan' : 'Tambah Modul Aplikasi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </>
  );
}
