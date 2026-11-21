'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { BellRing, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { enablePush, getPushState, PushState } from '@/lib/push';

const DISMISS_KEY = 'portal_rep_push_optin_dismissed';
const noopSubscribe = () => () => {};

const readDismissed = () => {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
};

/**
 * Ajakan kecil bagi staf yang login untuk mengaktifkan notifikasi pengumuman di perangkatnya.
 * Tidak tampil bila push tidak tersedia, izin sudah diputuskan, atau ajakan pernah ditutup.
 */
export default function PushOptIn() {
  const { user } = useAuth();
  const initialState = useSyncExternalStore(noopSubscribe, getPushState, () => 'unavailable' as PushState);
  const initiallyDismissed = useSyncExternalStore(noopSubscribe, readDismissed, () => true);

  const [override, setOverride] = useState<PushState | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const state = override ?? initialState;
  if (!user || state !== 'default' || initiallyDismissed || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* abaikan */
    }
  };

  const handleEnable = async () => {
    setBusy(true);
    setError(null);
    try {
      setOverride(await enablePush(user));
    } catch (err) {
      setError((err as Error).message || 'Gagal mengaktifkan notifikasi.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed bottom-[calc(var(--dock-space)+0.5rem)] right-4 z-[55] w-[calc(100%-2rem)] max-w-sm p-4 rounded-2xl bg-white dark:bg-[#0c241b] border border-stone-200 dark:border-amber-500/40 shadow-2xl text-slate-100">
      <button
        type="button"
        onClick={dismiss}
        className="absolute top-2 right-2 p-1 rounded-lg text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white cursor-pointer"
        aria-label="Tutup"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-3 pr-5">
        <BellRing className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-2">
          <p className="text-xs font-bold">Terima instruksi mendesak di perangkat ini?</p>
          <p className="text-[11px] text-stone-600 dark:text-slate-300 leading-relaxed">
            Notifikasi muncul walau portal sedang tidak dibuka. Bisa dimatikan kapan saja dari pengaturan browser.
          </p>
          {error && <p className="text-[11px] text-rose-700 dark:text-rose-300">{error}</p>}
          <button
            type="button"
            onClick={handleEnable}
            disabled={busy}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold disabled:opacity-60 cursor-pointer"
          >
            {busy ? 'Mengaktifkan…' : 'Aktifkan notifikasi'}
          </button>
        </div>
      </div>
    </div>
  );
}
