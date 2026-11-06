'use client';

import React from 'react';
import { PlugZap, AlertTriangle, Loader2, Radio, FlaskConical } from 'lucide-react';
import { SourceState } from '@/lib/integration-contract';

const formatTime = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jayapura', hour: '2-digit', minute: '2-digit' })
    : '';

/** Lencana kecil status sumber data (LIVE / DATA CONTOH / dst.). */
export function SourceBadge({ state }: { state: SourceState }) {
  const base = 'inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border';
  switch (state.status) {
    case 'LIVE':
      return (
        <span className={`${base} bg-emerald-950 text-emerald-300 border-emerald-500/40`} title="Data asli dari aplikasi">
          <Radio className="w-3 h-3" /> Live {formatTime(state.fetchedAt)}
        </span>
      );
    case 'DEMO':
      return (
        <span className={`${base} bg-fuchsia-950 text-fuchsia-300 border-fuchsia-500/40`} title={state.message}>
          <FlaskConical className="w-3 h-3" /> Data contoh
        </span>
      );
    case 'LOADING':
      return (
        <span className={`${base} bg-slate-900 text-slate-300 border-slate-600`}>
          <Loader2 className="w-3 h-3 animate-spin" /> Memuat
        </span>
      );
    case 'ERROR':
      return (
        <span className={`${base} bg-rose-950 text-rose-300 border-rose-500/40`} title={state.message}>
          <AlertTriangle className="w-3 h-3" /> Gangguan
        </span>
      );
    default:
      return (
        <span className={`${base} bg-stone-900 text-stone-300 border-stone-600`} title={state.message}>
          <PlugZap className="w-3 h-3" /> Belum terhubung
        </span>
      );
  }
}

/**
 * Lapisan penutup kartu ketika datanya belum tersedia, agar angka kosong tidak terbaca
 * sebagai data asli. Kartu induk harus `relative`.
 */
export function SourceOverlay({ state, appName, compact = false }: { state: SourceState; appName: string; compact?: boolean }) {
  if (state.status === 'LIVE' || state.status === 'DEMO') return null;

  const loading = state.status === 'LOADING';
  const isError = state.status === 'ERROR';

  return (
    <div
      className={`absolute inset-0 z-20 flex items-center justify-center bg-white/80 dark:bg-[#06140e]/85 backdrop-blur-sm ${
        compact ? 'p-2 rounded-2xl' : 'p-6 rounded-3xl'
      }`}
    >
      <div className="text-center max-w-xs space-y-2" role="status">
        {loading ? (
          <Loader2 className="w-7 h-7 mx-auto text-amber-500 animate-spin" />
        ) : isError ? (
          <AlertTriangle className="w-7 h-7 mx-auto text-rose-400" />
        ) : (
          <PlugZap className="w-7 h-7 mx-auto text-stone-400" />
        )}
        <p className={`${compact ? 'text-[11px]' : 'text-sm'} font-black text-stone-900 dark:text-white`}>
          {loading ? `Memuat data ${appName}…` : isError ? `Data ${appName} tidak dapat dimuat` : `${appName} belum terhubung`}
        </p>
        {!loading && !compact && (
          <p className="text-[11px] text-stone-600 dark:text-slate-400 leading-relaxed">
            {isError
              ? state.message
              : 'Angka akan tampil otomatis setelah aplikasi ini menerapkan kontrak integrasi portal (lihat docs/KONTRAK_INTEGRASI.md).'}
          </p>
        )}
      </div>
    </div>
  );
}
