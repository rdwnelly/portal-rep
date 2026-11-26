export type UserRole = 'EXECUTIVE' | 'OPERATIONAL' | 'FINANCE_WAREHOUSE' | 'IT_ADMIN' | 'UNAUTHORIZED';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  roleTitle: string;
  department: string;
  isWhitelisted: boolean;
  phoneNumber?: string;
  lastLogin?: string;
}

export interface WhitelistedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  roleTitle: string;
  department: string;
  active: boolean;
  addedAt: string;
  addedBy: string;
  avatarUrl?: string;
}

export type AppCategory = 'OPERASIONAL' | 'KEUANGAN' | 'GUDANG_POS' | 'MEDIA_KREATIF' | 'ADMINISTRASI';
export type AppStatus = 'ONLINE' | 'MAINTENANCE' | 'UPDATED' | 'OFFLINE';

export interface AppItem {
  id: string;
  title: string;
  shortCode: string;
  description: string;
  fullDetails?: string;
  category: AppCategory;
  iconName: string;
  url: string;
  internalUrl?: string;
  status: AppStatus;
  allowedRoles: UserRole[];
  badgeText: string;
  colorTheme: {
    from: string;
    to: string;
    accent: string;
    border: string;
  };
  stats?: string;
  lastUpdated?: string;
  order: number;
}

export type EventCategory =
  | 'CULTURE_EVENT'      // Pentas Seni, Tarian Adat, Festival Budaya
  | 'HOMESTAY_TOUR'      // Kunjungan Rombongan Wisatawan, Tamu Homestay
  | 'EXECUTIVE_MEETING'  // Rapat Pimpinan, Rapat Pleno Yayasan
  | 'COMMUNITY_WORKSHOP' // Workshop Ukiran, Menganyam Noken, Edukasi Budaya
  | 'SYSTEM_MAINTENANCE' // Pemeliharaan Server/IT, Tutup Buku & Rekonsiliasi
  | 'GENERAL_AGENDA';    // Agenda Harian Umum

export type EventStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string; // Format: YYYY-MM-DD
  timeStart: string; // Format: HH:mm (WIT)
  timeEnd?: string; // Format: HH:mm (WIT)
  location: string;
  category: EventCategory;
  status: EventStatus;
  organizer: string;
  targetAudience?: string;
  isHighlight?: boolean;
  notes?: string;
  attachments?: { name: string; url: string; size?: string }[];
  googleCalendarUrl?: string;
  createdAt: string;
  createdBy: string;
}
