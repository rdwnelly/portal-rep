'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, FlaskConical, X } from 'lucide-react';
import { STORAGE_ERROR_EVENT } from '@/lib/storage';
import { useAuth } from '@/lib/auth-context';

interface Toast {
  id: number;
  message: string;
}

/**
 * Menampilkan kegagalan penyimpanan data (mis. ditolak Security Rules) yang sebelumnya
 * hanya muncul di konsol, serta penanda saat aplikasi berjalan dalam mode demo lokal.
 */
export default function StorageStatusToast() {
  const { isDemoMode } = useAuth();
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const message = (e as CustomEvent<{ message: string }>).detail?.message;
      if (!message) return;
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev.slice(-2), { id, message }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 7000);
    };
    window.addEventListener(STORAGE_ERROR_EVENT, handler);
    return () => window.removeEventListener(STORAGE_ERROR_EVENT, handler);
  }, []);

  return (
    <>
      {isDemoMode && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[60] px-3 py-1 rounded-full bg-fuchsia-950/90 border border-fuchsia-400/50 text-fuchsia-200 text-[10px] font-bold flex items-center gap-1.5 shadow-lg pointer-events-none">
          <FlaskConical className="w-3 h-3" />
          <span>MODE DEMO — data contoh lokal, Firebase belum dikonfigurasi</span>
        </div>
      )}

      {toasts.length > 0 && (
        <div className="fixed bottom-[calc(var(--dock-space)+0.5rem)] left-1/2 -translate-x-1/2 z-[70] w-[calc(100%-2rem)] max-w-md space-y-2" role="status" aria-live="polite">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="p-3 rounded-xl bg-red-950/95 border border-red-500/50 text-red-100 text-xs flex items-start gap-2 shadow-2xl animate-in fade-in slide-in-from-bottom-2"
            >
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="flex-1 leading-snug">{t.message}</span>
              <button
                type="button"
                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                className="p-0.5 rounded text-red-300 hover:text-white cursor-pointer"
                aria-label="Tutup"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
