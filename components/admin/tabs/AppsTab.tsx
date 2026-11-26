'use client';

import React, { useState } from 'react';
import { addAppItem, updateAppItem, deleteAppItem } from '@/lib/storage';
import { AppItem, AppStatus, AppCategory } from '@/lib/types';
import { Link2, Trash2, Edit2, X, Plus, ExternalLink } from 'lucide-react';
import { PapuanBorderCorner } from '@/components/PapuanMotif';

/** Konfigurasi tautan & modul sub-aplikasi. */
export default function AppsTab({ apps, currentAdminName }: { apps: AppItem[]; currentAdminName: string }) {
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
    }
    setShowAppModal(false);
  };

  const handleDeleteApp = (id: string, title: string) => {
    if (confirm(`Hapus modul aplikasi "${title}"?`)) {
      deleteAppItem(id, currentAdminName);
    }
  };

  return (
    <>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-stone-900 dark:text-white flex items-center gap-2">
                <Link2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                <span>Konfigurasi Link & Modul Sub-Aplikasi</span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-slate-400">
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
                className="p-5 rounded-2xl bg-stone-50 dark:bg-white/5 border border-emerald-500/25 shadow-xl flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
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

                  <h3 className="text-base font-extrabold text-stone-900 dark:text-white leading-snug">{app.title}</h3>
                  <p className="text-xs text-stone-600 dark:text-slate-300 mt-1 line-clamp-2">{app.description}</p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono mt-2 truncate">{app.url}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-stone-200 dark:border-slate-800 text-[11px] text-stone-500 dark:text-slate-400">
                  <span>{app.badgeText}</span>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-stone-200 dark:bg-slate-800 hover:bg-emerald-200/60 dark:hover:bg-emerald-950/60 border border-stone-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 transition-all"
                      title="Buka Aplikasi"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => handleOpenEditApp(app)}
                      className="p-1.5 rounded-lg bg-stone-200 dark:bg-slate-800 hover:bg-emerald-200/60 dark:hover:bg-emerald-950/60 border border-stone-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-300 transition-all cursor-pointer"
                      title="Edit Aplikasi"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteApp(app.id, app.title)}
                      className="p-1.5 rounded-lg bg-stone-200 dark:bg-slate-800 hover:bg-rose-200/60 dark:hover:bg-red-950/60 border border-stone-200 dark:border-slate-700 text-rose-600 dark:text-red-400 transition-all cursor-pointer"
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

        {showAppModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
            <div
              className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#0c241b] border-2 border-emerald-500/40 shadow-2xl p-6 text-slate-100 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <PapuanBorderCorner position="top-right" />
              <PapuanBorderCorner position="bottom-left" />

              <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20 mb-4">
                <div className="flex items-center gap-2.5">
                  <Link2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                  <h3 className="text-base font-black text-stone-900 dark:text-white font-serif">
                    {editingApp ? 'Edit Konfigurasi Aplikasi' : 'Tambah Modul Aplikasi'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowAppModal(false)}
                  className="p-1.5 rounded-xl bg-stone-100 dark:bg-slate-900 text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white border border-stone-200 dark:border-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveApp} className="space-y-3.5">
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
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 text-white text-xs font-extrabold shadow-md active:scale-95"
                  >
                    {editingApp ? 'Simpan Perubahan' : 'Tambah Aplikasi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </>
  );
}
