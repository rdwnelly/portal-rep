'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import type { ExecutiveMetrics, MetricsPeriod } from './types';
import {
  EMPTY_SECTIONS,
  LiveMetricsResponse,
  SOURCE_KEYS,
  SourceKey,
  SourceState,
} from './integration-contract';
import { getAllExecutiveMetrics, isRemoteStore, STORAGE_UPDATE_EVENT } from './storage';
import { INITIAL_EXECUTIVE_METRICS } from './seed-data';
import { apiFetch } from './api-client';

export interface LiveMetricsView {
  metrics: ExecutiveMetrics;
  sources: Record<SourceKey, SourceState>;
  /** Statistik operasional portal (staf, permohonan, pengumuman) sudah dimuat. */
  operasionalReady: boolean;
  loading: boolean;
  error: string | null;
  generatedAt?: string;
  refresh: () => void;
}

const REFRESH_INTERVAL_MS = 60_000;

const EMPTY_OPERASIONAL: ExecutiveMetrics['operasional'] = {
  activeStaffOnDuty: 0,
  pendingAccessRequests: 0,
  activeNoticesCount: 0,
  systemHealthScore: 0,
};

const allSources = (state: SourceState): Record<SourceKey, SourceState> =>
  Object.fromEntries(SOURCE_KEYS.map((k) => [k, state])) as Record<SourceKey, SourceState>;

// ---------- Mode demo: data contoh lokal ----------
let demoCache = INITIAL_EXECUTIVE_METRICS;
function subscribeDemo(callback: () => void) {
  demoCache = getAllExecutiveMetrics();
  const handler = () => {
    demoCache = getAllExecutiveMetrics();
    callback();
  };
  window.addEventListener(STORAGE_UPDATE_EVENT, handler);
  return () => window.removeEventListener(STORAGE_UPDATE_EVENT, handler);
}
const noopSubscribe = () => () => {};

/**
 * Metrik eksekutif per periode.
 *  • Mode Firestore: dari GET /api/metrics (data asli sub-aplikasi), diperbarui tiap 60 detik.
 *    Bagian yang belum terhubung bernilai kosong dan berstatus NOT_CONFIGURED / ERROR.
 *  • Mode demo: data contoh lokal berstatus DEMO.
 */
export function useLiveMetrics(period: MetricsPeriod): LiveMetricsView {
  const [nonce, setNonce] = useState(0);
  const [result, setResult] = useState<{ key: string; response?: LiveMetricsResponse; error?: string } | null>(null);
  const requestKey = `${period}:${nonce}`;

  const demoMetrics = useSyncExternalStore(
    isRemoteStore ? noopSubscribe : subscribeDemo,
    () => demoCache,
    () => INITIAL_EXECUTIVE_METRICS
  );

  useEffect(() => {
    if (!isRemoteStore) return;
    let cancelled = false;
    apiFetch<LiveMetricsResponse>(`/api/metrics?period=${period}`).then(
      (response) => !cancelled && setResult({ key: requestKey, response }),
      (err: Error) => !cancelled && setResult({ key: requestKey, error: err.message })
    );
    return () => {
      cancelled = true;
    };
  }, [period, requestKey]);

  useEffect(() => {
    if (!isRemoteStore) return;
    const timer = setInterval(() => setNonce((n) => n + 1), REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const refresh = () => setNonce((n) => n + 1);

  if (!isRemoteStore) {
    return {
      metrics: demoMetrics[period] || INITIAL_EXECUTIVE_METRICS[period],
      sources: allSources({ status: 'DEMO', message: 'Data contoh (mode demo).' }),
      operasionalReady: true,
      loading: false,
      error: null,
      refresh,
    };
  }

  // Tampilkan respons terakhir untuk periode yang sama selama memuat ulang (tanpa kedip).
  const response = result?.response?.period === period ? result.response : undefined;
  const loading = result?.key !== requestKey;
  const error = !loading && result?.error ? result.error : null;

  const sources: Record<SourceKey, SourceState> = response
    ? (Object.fromEntries(
        SOURCE_KEYS.map((k) => {
          const s = response.sections[k];
          return [k, { status: s.status, message: s.message, fetchedAt: s.fetchedAt }];
        })
      ) as Record<SourceKey, SourceState>)
    : allSources(error ? { status: 'ERROR', message: error } : { status: 'LOADING' });

  const metrics: ExecutiveMetrics = {
    period,
    lastUpdated: response?.generatedAt || '',
    reservasi: response?.sections.reservasi.data ?? EMPTY_SECTIONS.reservasi,
    keuangan: response?.sections.keuangan.data ?? EMPTY_SECTIONS.keuangan,
    posGudang: response?.sections.posGudang.data ?? EMPTY_SECTIONS.posGudang,
    zeeyStudio: response?.sections.zeeyStudio.data ?? EMPTY_SECTIONS.zeeyStudio,
    operasional: response?.operasional ?? EMPTY_OPERASIONAL,
  };

  return {
    metrics,
    sources,
    operasionalReady: Boolean(response),
    loading,
    error,
    generatedAt: response?.generatedAt,
    refresh,
  };
}

/** Bagian dengan angka yang boleh ditampilkan sebagai data (asli atau contoh berlabel). */
export const hasData = (s: SourceState) => s.status === 'LIVE' || s.status === 'DEMO';
