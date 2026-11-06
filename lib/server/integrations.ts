/**
 * Konfigurasi & pemanggil integrasi sub-aplikasi (server-side).
 *
 * Tiap sub-aplikasi dikonfigurasi lewat environment portal:
 *   INTEGRATION_<KUNCI>_URL     → URL dasar sub-aplikasi, mis. https://rep-pos-app.vercel.app
 *   INTEGRATION_<KUNCI>_SECRET  → secret bersama (min. 32 karakter) — nilai yang SAMA diisi
 *                                 sebagai PORTAL_INTEGRATION_SECRET di sub-aplikasi.
 * KUNCI: RESERVASI, SIKREP, POS, ZEEY.
 *
 * URL diambil dari environment (bukan dari koleksi `apps` yang bisa diedit di UI) agar secret
 * tidak pernah terkirim ke alamat yang bisa diubah lewat aplikasi.
 */
import {
  CONTRACT_VERSION,
  SourceKey,
  SourceState,
  SectionData,
  SubAppSummaryResponse,
  validateSection,
} from '../integration-contract';
import type { MetricsPeriod } from '../types';

const ENV_PREFIX: Record<SourceKey, string> = {
  reservasi: 'INTEGRATION_RESERVASI',
  keuangan: 'INTEGRATION_SIKREP',
  posGudang: 'INTEGRATION_POS',
  zeeyStudio: 'INTEGRATION_ZEEY',
};

export interface IntegrationConfig {
  baseUrl: string;
  secret: string;
}

export function getIntegration(key: SourceKey): IntegrationConfig | null {
  const prefix = ENV_PREFIX[key];
  const baseUrl = process.env[`${prefix}_URL`]?.trim().replace(/\/+$/, '');
  const secret = process.env[`${prefix}_SECRET`]?.trim();
  if (!baseUrl || !secret) return null;
  return { baseUrl, secret };
}

const TIMEOUT_MS = 8000;

export async function fetchSectionSummary<K extends SourceKey>(
  key: K,
  period: MetricsPeriod
): Promise<SourceState & { data?: SectionData[K] }> {
  const config = getIntegration(key);
  if (!config) {
    return { status: 'NOT_CONFIGURED', message: 'Integrasi belum disiapkan untuk aplikasi ini.' };
  }

  try {
    const res = await fetch(`${config.baseUrl}/api/portal/summary?period=${period}`, {
      headers: { Authorization: `Bearer ${config.secret}`, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      return { status: 'ERROR', message: `Aplikasi merespons HTTP ${res.status}.` };
    }
    const body = (await res.json()) as Partial<SubAppSummaryResponse<K>>;
    if (body.contractVersion !== CONTRACT_VERSION) {
      return { status: 'ERROR', message: `Versi kontrak tidak cocok (diharapkan v${CONTRACT_VERSION}).` };
    }
    const invalid = validateSection(key, body.data);
    if (invalid) {
      return { status: 'ERROR', message: `Format data tidak sesuai kontrak: ${invalid}.` };
    }
    return { status: 'LIVE', fetchedAt: body.generatedAt || new Date().toISOString(), data: body.data as SectionData[K] };
  } catch (err) {
    const timedOut = (err as Error)?.name === 'TimeoutError';
    return {
      status: 'ERROR',
      message: timedOut ? `Aplikasi tidak merespons dalam ${TIMEOUT_MS / 1000} detik.` : 'Aplikasi tidak dapat dihubungi.',
    };
  }
}
