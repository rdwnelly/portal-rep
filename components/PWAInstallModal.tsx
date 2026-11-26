'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { canPromptInstall, promptInstall, subscribeInstall } from '@/lib/install-prompt';
import {
  X,
  Smartphone,
  Download,
  Share2,
  PlusSquare
} from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PWAInstallModal({ isOpen, onClose }: PWAInstallModalProps) {
  // Event pasang ditangkap sekali oleh lib/install-prompt dan dipakai bersama notifikasi pasang.
  const canPrompt = useSyncExternalStore(subscribeInstall, canPromptInstall, () => false);
  const [activeTab, setActiveTab] = useState<'ANDROID' | 'IOS' | 'DESKTOP'>('ANDROID');

  if (!isOpen) return null;

  const handleNativeInstallClick = async () => {
    if ((await promptInstall()) === 'accepted') onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg my-auto rounded-3xl bg-white dark:bg-[#0c241b] border-2 border-amber-500/35 shadow-2xl p-6 overflow-hidden max-h-[90dvh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-stone-100 dark:bg-slate-900/80 hover:bg-stone-200 dark:hover:bg-slate-800 text-stone-600 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white transition-all border border-stone-200 dark:border-slate-700"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-stone-200 dark:border-amber-500/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-lg">
            <Smartphone className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded border border-stone-200 dark:border-amber-500/30">
                PWA Mobile Native
              </span>
            </div>
            <h2 className="text-lg font-bold text-stone-900 dark:text-white">Pasang PORTAL REP di Perangkat</h2>
          </div>
        </div>

        {/* Tabs: Android, iOS, Desktop */}
        <div className="flex rounded-xl bg-stone-50 dark:bg-white/5 p-1 border border-stone-200 dark:border-amber-500/20 mb-5">
          <button
            onClick={() => setActiveTab('ANDROID')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'ANDROID'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-stone-500 dark:text-slate-400 hover:text-stone-800 dark:hover:text-slate-200'
            }`}
          >
            Android (Chrome)
          </button>
          <button
            onClick={() => setActiveTab('IOS')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'IOS'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-stone-500 dark:text-slate-400 hover:text-stone-800 dark:hover:text-slate-200'
            }`}
          >
            iPhone / iPad (Safari)
          </button>
          <button
            onClick={() => setActiveTab('DESKTOP')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'DESKTOP'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-stone-500 dark:text-slate-400 hover:text-stone-800 dark:hover:text-slate-200'
            }`}
          >
            PC / Macbook
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 rounded-xl bg-stone-100 dark:bg-white/10 border border-stone-200 dark:border-amber-500/20 text-xs text-slate-200 space-y-3 mb-5">
          {activeTab === 'ANDROID' && (
            <ol className="list-decimal list-inside space-y-2 leading-relaxed">
              <li>
                Buka portal ini di browser <strong>Google Chrome</strong> di smartphone Android staf.
              </li>
              <li>
                Ketuk ikon <strong>Titik Tiga (⋮)</strong> di sudut kanan atas browser.
              </li>
              <li>
                Pilih opsi <strong>&quot;Tambahkan ke Layar Utama&quot;</strong> atau <strong>&quot;Instal Aplikasi&quot;</strong>.
              </li>
              <li>
                Ikon <strong>PORTAL REP</strong> akan langsung muncul di beranda HP Anda layaknya aplikasi Play Store!
              </li>
            </ol>
          )}

          {activeTab === 'IOS' && (
            <ol className="list-decimal list-inside space-y-2 leading-relaxed">
              <li>
                Buka portal ini menggunakan browser <strong>Safari</strong> di iPhone atau iPad.
              </li>
              <li>
                Ketuk tombol <strong>Bagikan (Share)</strong> <Share2 className="w-3.5 h-3.5 inline text-amber-600 dark:text-amber-400" /> di bagian bawah layar.
              </li>
              <li>
                Gulir ke bawah dan pilih <strong>&quot;Tambahkan ke Layar Utama&quot; (Add to Home Screen)</strong> <PlusSquare className="w-3.5 h-3.5 inline text-amber-600 dark:text-amber-400" />.
              </li>
              <li>
                Ketuk <strong>Tambah (Add)</strong> di pojok kanan atas.
              </li>
            </ol>
          )}

          {activeTab === 'DESKTOP' && (
            <ol className="list-decimal list-inside space-y-2 leading-relaxed">
              <li>
                Buka portal di <strong>Google Chrome, Microsoft Edge, atau Brave</strong>.
              </li>
              <li>
                Klik tombol instalasi pada address bar browser (ikon monitor dengan panah ke bawah).
              </li>
              <li>
                Klik <strong>&quot;Install&quot;</strong> untuk menjalankan PORTAL REP sebagai aplikasi jendela terpisah tanpa URL bar.
              </li>
            </ol>
          )}
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-stone-200 dark:bg-slate-800 hover:bg-slate-700 text-stone-600 dark:text-slate-300 text-xs font-semibold"
          >
            Tutup
          </button>

          {canPrompt && (
            <button
              onClick={handleNativeInstallClick}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold shadow-lg shadow-amber-950/60 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Instal Sekarang</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
