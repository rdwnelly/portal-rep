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

export type NoticeCategory = 'INSTRUCTION' | 'AGENDA' | 'SOP' | 'ANNOUNCEMENT' | 'URGENT';
export type NoticePriority = 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';

export interface NoticeItem {
  id: string;
  title: string;
  content: string;
  category: NoticeCategory;
  priority: NoticePriority;
  authorName: string;
  authorRole: string;
  authorAvatar?: string;
  createdAt: string;
  isPinned: boolean;
  targetRoles?: UserRole[];
  attachments?: { name: string; url: string; size?: string }[];
}

export interface AccessRequest {
  id: string;
  name: string;
  email: string;
  proposedPassword?: string;
  appId?: string;
  appTitle?: string;
  department: string;
  phoneNumber?: string;
  reason: string;
  requestedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes?: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userEmail: string;
  userName: string;
  action: string;
  details: string;
  category: 'AUTH' | 'NOTICE' | 'WHITELIST' | 'APP_CONFIG' | 'EVENT' | 'DOCUMENT';
}

export interface FoundationInfo {
  organizationName: string;
  tagline: string;
  heroWelcome: string;
  heroDescription: string;
  address: string;
  itHelpdeskName: string;
  itHelpdeskPhone: string;
  itHelpdeskEmail: string;
  operationalHours: string;
  lastUpdated: string;
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

export type DocumentCategory =
  | 'SOP_OPERASIONAL'    // SOP Homestay, Reservasi & Layanan Tamu
  | 'SOP_KEUANGAN'       // SOP SIK-REP, Pembukuan & Pengajuan Kas
  | 'SOP_GUDANG_KASIR'   // SOP Kasir Yaswar & Gudang Suvenir OMG
  | 'SOP_MEDIA_KREATIF'  // SOP Zeey Studio & Hak Cipta Konten
  | 'TEMPLATE_SURAT'     // Template Surat Resmi, SK, Form Izin / Cuti
  | 'LEGALITAS_YAYASAN'  // Akta Notaris, NPWP, NIB Pariwisata, AD/ART
  | 'PANDUAN_IT';        // Panduan SSO Portal REP & Keamanan Akun

export type DocumentFileType = 'PDF' | 'DOCX' | 'XLSX' | 'PPTX' | 'GDRIVE_FOLDER' | 'ARCHIVE_ZIP';

export interface FoundationDocument {
  id: string;
  title: string;
  code: string; // e.g. "SOP-REP-OPS-001"
  description: string;
  category: DocumentCategory;
  department: string;
  fileType: DocumentFileType;
  fileSize?: string; // e.g. "1.4 MB"
  version: string; // e.g. "v2.1 (2026)"
  gdriveUrl: string; // Google Drive View/Open Link
  gdriveFileId?: string; // Google Drive File ID for direct preview
  isConfidential?: boolean;
  isFavorite?: boolean;
  downloadsCount?: number;
  lastUpdated: string;
  uploadedBy: string;
  tags: string[];
}

export type MetricsPeriod = 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH';

export interface LowStockItem {
  itemName: string;
  currentStock: number;
  minThreshold: number;
  category: string;
  unit: string;
}

export interface ExecutiveMetrics {
  period: MetricsPeriod;
  lastUpdated: string;
  // 1. Reservasi Homestay & Destinasi Wisata
  reservasi: {
    totalHomestay: number;
    occupiedHomestay: number;
    occupancyRate: number; // e.g. 91.6 (%)
    activeGuestsToday: number;
    upcomingBookings: number;
    totalTicketsSold: number;
    revenueEstimated: number; // e.g. 14500000 (IDR)
    trendGuests: string; // e.g. "+14.2% vs pekan lalu"
  };
  // 2. SIK-REP Keuangan & Arus Kas
  keuangan: {
    totalCashBalance: number; // Saldo Kas Yayasan (IDR)
    monthlyIncome: number; // Penerimaan Kas Bulan Ini
    monthlyExpense: number; // Pengeluaran Kas Bulan Ini
    netCashFlow: number; // Arus Kas Bersih
    pendingReimbursementsCount: number;
    pendingReimbursementTotal: number;
    reconciliationStatus: 'RECONCILED' | 'PENDING' | 'IN_PROGRESS';
    trendRevenue: string; // e.g. "+18.5% vs bulan lalu"
  };
  // 3. POS Kasir Yaswar Cafe & Gudang Suvenir OMG
  posGudang: {
    dailySalesVolume: number; // Omset Kasir Hari Ini (IDR)
    dailyTransactionsCount: number; // Jumlah Transaksi Kasir
    totalMonitoredItems: number; // Total Item Terdata
    lowStockAlerts: LowStockItem[];
    popularItemToday: string;
    settlementStatus: 'SETTLED' | 'OPEN' | 'SHIFT_2_ACTIVE';
    trendSales: string; // e.g. "+8.4% vs kemarin"
  };
  // 4. Zeey Studio (Dokumentasi & Media Budaya)
  zeeyStudio: {
    totalMediaAssets: number;
    newAssetsThisWeek: number;
    highResPhotosCount: number;
    culturalVideosCount: number;
    cloudStorageUsedGb: number;
    totalCloudStorageGb: number;
    latestUploadTitle: string;
  };
  // 5. Keseluruhan Operasional Yayasan
  operasional: {
    activeStaffOnDuty: number;
    pendingAccessRequests: number;
    activeNoticesCount: number;
    systemHealthScore: number; // e.g. 99.8 (%)
  };
}



