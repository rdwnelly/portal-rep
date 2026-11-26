'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { Download, Share, SquarePlus, X } from 'lucide-react';
import {
  canPromptInstall,
  isIos,
  isMobileDevice,
  isStandalone,
  justInstalled,
  promptInstall,
  subscribeInstall,
} from '@/lib/install-prompt';

const DISMISS_KEY = 'portal_rep_install_dismissed_at';
const DISMISS_DAYS = 7;
/** Jeda sebelum muncul — pengunjung sempat melihat halaman dulu, bukan langsung disodori ajakan. */
const SHOW_DELAY_MS = 2500;

function dismissedRecently(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return Date.now() - at < DISMISS_DAYS * 86_400_000;
  } catch {
    return false;
  }
}

function rememberDismiss() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // penyimpanan diblokir (mode privat) — ajakan cukup hilang untuk sesi ini
  }
}

/**
 * Notifikasi "Pasang PORTAL REP di HP".
 *  • Android/Chrome: tombol Pasang membuka dialog pemasangan bawaan browser.
 *  • iPhone/iPad: petunjuk Bagikan → Tambah ke Layar Utama (Safari tidak punya tombol pasang).
 * Tidak muncul di desktop, bila portal sudah terpasang, atau dalam 7 hari setelah "Nanti".
 */
export default function InstallPrompt() {
  const canPrompt = useSyncExternalStore(subscribeInstall, canPromptInstall, () => false);
  const installedNow = useSyncExternalStore(subscribeInstall, justInstalled, () => false);
  const [eligible, setEligible] = useState(false);
  const [closed, setClosed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isStandalone() && isMobileDevice() && !dismissedRecently()) setEligible(true);
    }, SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  // Hanya dihitung setelah `eligible` (di klien) — render server & hidrasi selalu kosong.
  const mode = !eligible ? null : isIos() ? 'ios' : canPrompt ? 'android' : null;
  if (!mode || closed || installedNow) return null;

  const dismiss = () => {
    rememberDismiss();
    setClosed(true);
  };

  const install = async () => {
    setBusy(true);
    const outcome = await promptInstall();
    setBusy(false);
    if (outcome === 'dismissed') rememberDismiss();
    setClosed(true);
  };

  return (
    <div className="fixed inset-x-0 z-40 px-3 pointer-events-none" style={{ bottom: 'calc(var(--dock-space) + 0.25rem)' }}>
      <div
        role="dialog"
        aria-modal="false"
        aria-labelledby="judul-pasang"
        aria-describedby="isi-pasang"
        className="pointer-events-auto mx-auto max-w-[26rem] flex items-start gap-3 p-3.5 rounded-3xl bg-white/95 dark:bg-[#0f2a20]/95 ring-1 ring-stone-200 dark:ring-white/10 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.35)] backdrop-blur-xl motion-safe:animate-[pasang-muncul_0.35s_ease-out]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- ikon statis kecil dari /public */}
        <img src="/icons/icon-192x192.png" alt="" width={44} height={44} className="w-11 h-11 rounded-xl shrink-0" />

        <div className="min-w-0 flex-1">
          <p id="judul-pasang" className="text-sm font-semibold text-stone-900 dark:text-white">
            Pasang PORTAL REP di HP
          </p>
          {mode === 'android' ? (
            <p id="isi-pasang" className="mt-0.5 text-xs leading-relaxed text-stone-600 dark:text-slate-300">
              Buka lebih cepat dari layar utama, layar penuh seperti aplikasi.
            </p>
          ) : (
            <p id="isi-pasang" className="mt-0.5 text-xs leading-relaxed text-stone-600 dark:text-slate-300">
              Ketuk{' '}
              <Share aria-label="ikon Bagikan" className="inline w-3.5 h-3.5 -mt-0.5 text-sky-600 dark:text-sky-400" /> di
              Safari, lalu pilih{' '}
              <span className="font-semibold whitespace-nowrap">
                <SquarePlus aria-hidden className="inline w-3.5 h-3.5 -mt-0.5" /> Tambah ke Layar Utama
              </span>
              .
            </p>
          )}

          <div className="mt-2.5 flex items-center gap-2">
            {mode === 'android' && (
              <button
                type="button"
                onClick={() => void install()}
                disabled={busy}
                className="h-9 px-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
              >
                <Download className="w-3.5 h-3.5" />
                Pasang
              </button>
            )}
            <button
              type="button"
              onClick={dismiss}
              className="h-9 px-3 rounded-full text-xs font-semibold text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-white/10 cursor-pointer"
            >
              {mode === 'android' ? 'Nanti' : 'Mengerti'}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Tutup ajakan pasang"
          className="-mr-1 -mt-1 w-8 h-8 flex items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 dark:hover:bg-white/10 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
