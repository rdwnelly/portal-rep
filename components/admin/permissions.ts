import type { UserRole } from '@/lib/types';

/** Tab panel admin & tab yang boleh dilihat tiap role (tampilan; izin data ditegakkan Security Rules). */
export type AdminTab =
  | 'EVENTS'
  | 'WHITELIST'
  | 'REQUESTS'
  | 'APPS'
  | 'INFO'
  | 'LOGS';

export const ROLE_PERMISSIONS: Record<
  UserRole,
  {
    label: string;
    badgeColor: string;
    allowedTabs: AdminTab[];
    description: string;
  }
> = {
  IT_ADMIN: {
    label: 'IT Superadmin',
    badgeColor: 'bg-purple-950 text-purple-300 border-purple-500/40',
    allowedTabs: [
      'EVENTS',
      'WHITELIST',
      'REQUESTS',
      'APPS',
      'INFO',
      'LOGS',
    ],
    description: 'Akses penuh ke seluruh konfigurasi sistem, database, dan manajemen hak akses karyawan.',
  },
  EXECUTIVE: {
    label: 'Manajemen Eksekutif / Pimpinan',
    badgeColor: 'bg-amber-950 text-amber-300 border-amber-500/40',
    allowedTabs: ['EVENTS', 'REQUESTS', 'INFO'],
    description: 'Akses pengawasan menyeluruh, agenda resmi, dan persetujuan staf.',
  },
  OPERATIONAL: {
    label: 'Staf Operasional & Frontdesk',
    badgeColor: 'bg-teal-950 text-teal-300 border-teal-500/40',
    allowedTabs: ['EVENTS'],
    description: 'Akses terbatas ke jadwal agenda budaya yayasan.',
  },
  FINANCE_WAREHOUSE: {
    label: 'Staf Keuangan & Logistik (OMG)',
    badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-500/40',
    allowedTabs: ['APPS'],
    description: 'Akses ke tautan operasional keuangan SIK-REP, kasir, dan pergudangan.',
  },
  UNAUTHORIZED: {
    label: 'Belum Terdaftar / Tamu',
    badgeColor: 'bg-stone-900 text-stone-300 border-stone-600/40',
    allowedTabs: [],
    description: 'Akses publik umum.',
  },
};
