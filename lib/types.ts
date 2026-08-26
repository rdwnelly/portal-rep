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
  category: 'AUTH' | 'NOTICE' | 'WHITELIST' | 'APP_CONFIG';
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
