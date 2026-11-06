/**
 * Kontrak integrasi Portal REP ↔ sub-aplikasi (dipakai klien & server).
 * Spesifikasi lengkap untuk tim sub-aplikasi: docs/KONTRAK_INTEGRASI.md
 */
import type { ExecutiveMetrics, MetricsPeriod } from './types';

export const CONTRACT_VERSION = 1;

export type SourceKey = 'reservasi' | 'keuangan' | 'posGudang' | 'zeeyStudio';
export const SOURCE_KEYS: SourceKey[] = ['reservasi', 'keuangan', 'posGudang', 'zeeyStudio'];

/**
 * LIVE            → data asli dari sub-aplikasi
 * NOT_CONFIGURED  → integrasi belum disiapkan (URL/secret belum diisi)
 * ERROR           → sub-aplikasi tidak merespons / format tidak sesuai kontrak
 * DEMO            → data contoh (mode demo lokal)
 * LOADING         → sedang dimuat
 */
export type SourceStatus = 'LIVE' | 'NOT_CONFIGURED' | 'ERROR' | 'DEMO' | 'LOADING';

export interface SourceState {
  status: SourceStatus;
  message?: string;
  fetchedAt?: string;
}

export type SectionData = {
  reservasi: ExecutiveMetrics['reservasi'];
  keuangan: ExecutiveMetrics['keuangan'];
  posGudang: ExecutiveMetrics['posGudang'];
  zeeyStudio: ExecutiveMetrics['zeeyStudio'];
};

/** Respons GET /api/metrics di portal. */
export interface LiveMetricsResponse {
  period: MetricsPeriod;
  generatedAt: string;
  sections: { [K in SourceKey]: SourceState & { data?: SectionData[K] } };
  operasional: ExecutiveMetrics['operasional'];
}

/** Respons yang WAJIB dikembalikan sub-aplikasi pada GET /api/portal/summary. */
export interface SubAppSummaryResponse<K extends SourceKey = SourceKey> {
  contractVersion: number;
  period: MetricsPeriod;
  generatedAt: string;
  data: SectionData[K];
}

export const SOURCE_LABELS: Record<SourceKey, string> = {
  reservasi: 'Reservasi Homestay',
  keuangan: 'SIK-REP Keuangan',
  posGudang: 'POS Kasir & Gudang OMG',
  zeeyStudio: 'Zeey Studio',
};

/** ID modul aplikasi di koleksi `apps` (untuk SSO & tautan). */
export const SOURCE_APP_IDS: Record<SourceKey, string> = {
  reservasi: 'app-reservasi',
  keuangan: 'app-sik-rep',
  posGudang: 'app-pos-omg',
  zeeyStudio: 'app-zeestudio',
};

type FieldType = 'number' | 'string' | 'array';

/** Skema minimum tiap bagian; dipakai server untuk menolak respons yang tidak sesuai kontrak. */
export const SECTION_SCHEMA: Record<SourceKey, Record<string, FieldType>> = {
  reservasi: {
    totalHomestay: 'number',
    occupiedHomestay: 'number',
    occupancyRate: 'number',
    activeGuestsToday: 'number',
    upcomingBookings: 'number',
    totalTicketsSold: 'number',
    revenueEstimated: 'number',
    trendGuests: 'string',
  },
  keuangan: {
    totalCashBalance: 'number',
    monthlyIncome: 'number',
    monthlyExpense: 'number',
    netCashFlow: 'number',
    pendingReimbursementsCount: 'number',
    pendingReimbursementTotal: 'number',
    reconciliationStatus: 'string',
    trendRevenue: 'string',
  },
  posGudang: {
    dailySalesVolume: 'number',
    dailyTransactionsCount: 'number',
    totalMonitoredItems: 'number',
    lowStockAlerts: 'array',
    popularItemToday: 'string',
    settlementStatus: 'string',
    trendSales: 'string',
  },
  zeeyStudio: {
    totalMediaAssets: 'number',
    newAssetsThisWeek: 'number',
    highResPhotosCount: 'number',
    culturalVideosCount: 'number',
    cloudStorageUsedGb: 'number',
    totalCloudStorageGb: 'number',
    latestUploadTitle: 'string',
  },
};

export function validateSection(key: SourceKey, data: unknown): string | null {
  if (!data || typeof data !== 'object') return 'data kosong';
  const record = data as Record<string, unknown>;
  for (const [field, type] of Object.entries(SECTION_SCHEMA[key])) {
    const value = record[field];
    const ok =
      type === 'array' ? Array.isArray(value) : type === 'number' ? typeof value === 'number' && Number.isFinite(value) : typeof value === 'string';
    if (!ok) return `field "${field}" harus bertipe ${type}`;
  }
  return null;
}

/** Nilai kosong untuk bagian yang belum terhubung — tidak pernah menampilkan angka karangan. */
export const EMPTY_SECTIONS: SectionData = {
  reservasi: {
    totalHomestay: 0,
    occupiedHomestay: 0,
    occupancyRate: 0,
    activeGuestsToday: 0,
    upcomingBookings: 0,
    totalTicketsSold: 0,
    revenueEstimated: 0,
    trendGuests: '—',
  },
  keuangan: {
    totalCashBalance: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    netCashFlow: 0,
    pendingReimbursementsCount: 0,
    pendingReimbursementTotal: 0,
    reconciliationStatus: 'PENDING',
    trendRevenue: '—',
  },
  posGudang: {
    dailySalesVolume: 0,
    dailyTransactionsCount: 0,
    totalMonitoredItems: 0,
    lowStockAlerts: [],
    popularItemToday: '—',
    settlementStatus: 'OPEN',
    trendSales: '—',
  },
  zeeyStudio: {
    totalMediaAssets: 0,
    newAssetsThisWeek: 0,
    highResPhotosCount: 0,
    culturalVideosCount: 0,
    cloudStorageUsedGb: 0,
    totalCloudStorageGb: 0,
    latestUploadTitle: '—',
  },
};

export const METRICS_PERIODS: MetricsPeriod[] = ['TODAY', 'THIS_WEEK', 'THIS_MONTH'];
