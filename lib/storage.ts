'use client';

import { AppItem, NoticeItem, WhitelistedUser, AuditLog, AccessRequest, UserRole, FoundationInfo, CalendarEvent, FoundationDocument, ExecutiveMetrics, MetricsPeriod } from './types';
import { INITIAL_WHITELIST, INITIAL_APPS, INITIAL_NOTICES, INITIAL_LOGS, INITIAL_EVENTS, INITIAL_DOCUMENTS, INITIAL_EXECUTIVE_METRICS } from './seed-data';

const STORAGE_KEYS = {
  WHITELIST: 'portal_rep_whitelist_v1',
  APPS: 'portal_rep_apps_v2',
  NOTICES: 'portal_rep_notices_v1',
  LOGS: 'portal_rep_logs_v1',
  REQUESTS: 'portal_rep_requests_v1',
  CUSTOM_USER: 'portal_rep_current_user_v1',
  INFO: 'portal_rep_foundation_info_v1',
  EVENTS: 'portal_rep_events_v1',
  DOCUMENTS: 'portal_rep_documents_v1',
  METRICS: 'portal_rep_executive_metrics_v1',
};

// Safe LocalStorage helpers
function getItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const data = localStorage.getItem(key);
    if (!data) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(data) as T;
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    // Dispatch custom event for cross-component reactivity
    window.dispatchEvent(new CustomEvent('portal_rep_storage_update', { detail: { key } }));
  } catch (error) {
    console.error('Storage write error:', error);
  }
}

// Whitelist Operations
export function getWhitelist(): WhitelistedUser[] {
  return getItem<WhitelistedUser[]>(STORAGE_KEYS.WHITELIST, INITIAL_WHITELIST);
}

export function findWhitelistedUser(email: string): WhitelistedUser | undefined {
  const list = getWhitelist();
  const normalized = email.trim().toLowerCase();
  const found = list.find((u) => u.email.toLowerCase() === normalized && u.active);
  if (found) return found;

  return INITIAL_WHITELIST.find((u) => u.email.toLowerCase() === normalized && u.active);
}

export function addWhitelistedUser(
  user: Omit<WhitelistedUser, 'id' | 'addedAt'>,
  adminName: string
): WhitelistedUser {
  const current = getWhitelist();
  const existing = current.find((u) => u.email.toLowerCase() === user.email.toLowerCase());
  if (existing) {
    throw new Error(`Email ${user.email} sudah terdaftar dalam whitelist.`);
  }

  const newUser: WhitelistedUser = {
    ...user,
    id: `user-${Date.now()}`,
    addedAt: new Date().toISOString(),
  };

  const updated = [newUser, ...current];
  setItem(STORAGE_KEYS.WHITELIST, updated);

  addAuditLog({
    userEmail: user.email,
    userName: adminName,
    action: 'ADD_WHITELIST',
    details: `Menambahkan ${user.name} (${user.email}) dengan role ${user.roleTitle}`,
    category: 'WHITELIST',
  });

  return newUser;
}

export function updateWhitelistedUser(id: string, updates: Partial<WhitelistedUser>, adminName: string): void {
  const current = getWhitelist();
  const index = current.findIndex((u) => u.id === id);
  if (index !== -1) {
    const old = current[index];
    current[index] = { ...old, ...updates };
    setItem(STORAGE_KEYS.WHITELIST, current);

    addAuditLog({
      userEmail: old.email,
      userName: adminName,
      action: 'UPDATE_WHITELIST',
      details: `Mengubah data whitelist untuk ${old.name} (${old.email})`,
      category: 'WHITELIST',
    });
  }
}

export function removeWhitelistedUser(id: string, adminName: string): void {
  const current = getWhitelist();
  const user = current.find((u) => u.id === id);
  if (user) {
    const updated = current.filter((u) => u.id !== id);
    setItem(STORAGE_KEYS.WHITELIST, updated);

    addAuditLog({
      userEmail: user.email,
      userName: adminName,
      action: 'DELETE_WHITELIST',
      details: `Menghapus ${user.name} (${user.email}) dari daftar whitelist`,
      category: 'WHITELIST',
    });
  }
}

// Apps Operations
export function getAppsList(): AppItem[] {
  return getItem<AppItem[]>(STORAGE_KEYS.APPS, INITIAL_APPS);
}

export function addAppItem(app: Omit<AppItem, 'id' | 'order'>, adminName: string): AppItem {
  const current = getAppsList();
  const newApp: AppItem = {
    ...app,
    id: `app-${Date.now()}`,
    order: current.length + 1,
  };
  const updated = [...current, newApp];
  setItem(STORAGE_KEYS.APPS, updated);

  addAuditLog({
    userEmail: 'admin@rumahetnikpapua.org',
    userName: adminName,
    action: 'CREATE_APP_ITEM',
    details: `Menambahkan modul aplikasi baru: ${newApp.title}`,
    category: 'APP_CONFIG',
  });

  return newApp;
}

export function updateAppItem(id: string, updates: Partial<AppItem>, adminName: string): void {
  const current = getAppsList();
  const index = current.findIndex((a) => a.id === id);
  if (index !== -1) {
    const old = current[index];
    current[index] = { ...old, ...updates };
    setItem(STORAGE_KEYS.APPS, current);

    addAuditLog({
      userEmail: 'admin@rumahetnikpapua.org',
      userName: adminName,
      action: 'UPDATE_APP_CONFIG',
      details: `Memperbarui konfigurasi aplikasi: ${old.title}`,
      category: 'APP_CONFIG',
    });
  }
}

export function deleteAppItem(id: string, adminName: string): void {
  const current = getAppsList();
  const target = current.find((a) => a.id === id);
  if (target) {
    const updated = current.filter((a) => a.id !== id);
    setItem(STORAGE_KEYS.APPS, updated);

    addAuditLog({
      userEmail: 'admin@rumahetnikpapua.org',
      userName: adminName,
      action: 'DELETE_APP_ITEM',
      details: `Menghapus modul aplikasi: ${target.title}`,
      category: 'APP_CONFIG',
    });
  }
}

// Notice Board Operations
export function getNotices(): NoticeItem[] {
  return getItem<NoticeItem[]>(STORAGE_KEYS.NOTICES, INITIAL_NOTICES);
}

export function addNotice(notice: Omit<NoticeItem, 'id' | 'createdAt'>): NoticeItem {
  const current = getNotices();
  const newNotice: NoticeItem = {
    ...notice,
    id: `notice-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  const updated = [newNotice, ...current];
  setItem(STORAGE_KEYS.NOTICES, updated);

  addAuditLog({
    userEmail: 'system@rumahetnikpapua.org',
    userName: notice.authorName,
    action: 'CREATE_NOTICE',
    details: `Menerbitkan pengumuman baru: "${notice.title.substring(0, 40)}..."`,
    category: 'NOTICE',
  });

  return newNotice;
}

export function updateNotice(id: string, updates: Partial<NoticeItem>, adminName: string): void {
  const current = getNotices();
  const index = current.findIndex((n) => n.id === id);
  if (index !== -1) {
    const old = current[index];
    current[index] = { ...old, ...updates };
    setItem(STORAGE_KEYS.NOTICES, current);

    addAuditLog({
      userEmail: 'admin@rumahetnikpapua.org',
      userName: adminName,
      action: 'UPDATE_NOTICE',
      details: `Memperbarui pengumuman: "${old.title.substring(0, 40)}..."`,
      category: 'NOTICE',
    });
  }
}

export function togglePinNotice(id: string): void {
  const current = getNotices();
  const index = current.findIndex((n) => n.id === id);
  if (index !== -1) {
    current[index].isPinned = !current[index].isPinned;
    setItem(STORAGE_KEYS.NOTICES, current);
  }
}

export function deleteNotice(id: string, adminName: string): void {
  const current = getNotices();
  const target = current.find((n) => n.id === id);
  if (target) {
    const updated = current.filter((n) => n.id !== id);
    setItem(STORAGE_KEYS.NOTICES, updated);

    addAuditLog({
      userEmail: 'admin@rumahetnikpapua.org',
      userName: adminName,
      action: 'DELETE_NOTICE',
      details: `Menghapus pengumuman: "${target.title.substring(0, 40)}..."`,
      category: 'NOTICE',
    });
  }
}

// Foundation Information
export const INITIAL_FOUNDATION_INFO: FoundationInfo = {
  organizationName: 'Yayasan Rumah Etnik Papua',
  tagline: 'Pusat Kebudayaan, Homestay Etnik, Edukasi & Usaha Kreatif Papua',
  heroWelcome: 'Pilih & Buka Aplikasi Langsung',
  heroDescription: 'Klik salah satu kotak aplikasi di bawah untuk langsung membuka sistem kerja yang Anda butuhkan di tab baru. Verifikasi login dilakukan langsung pada masing-masing aplikasi.',
  address: 'Jalan Baru Aimas - Klamono Km. 21, Kabupaten Sorong, Papua Barat Daya',
  itHelpdeskName: 'Ridwan Elly (IT Developer)',
  itHelpdeskPhone: '0812-4800-0000',
  itHelpdeskEmail: 'ridwanelly123@gmail.com',
  operationalHours: 'Senin - Sabtu: 08.00 - 17.00 WIT',
  lastUpdated: '2026-08-26T08:00:00Z',
};

export function getFoundationInfo(): FoundationInfo {
  return getItem<FoundationInfo>(STORAGE_KEYS.INFO, INITIAL_FOUNDATION_INFO);
}

export function updateFoundationInfo(info: Partial<FoundationInfo>, adminName: string): FoundationInfo {
  const current = getFoundationInfo();
  const updated: FoundationInfo = {
    ...current,
    ...info,
    lastUpdated: new Date().toISOString(),
  };
  setItem(STORAGE_KEYS.INFO, updated);

  addAuditLog({
    userEmail: 'admin@rumahetnikpapua.org',
    userName: adminName,
    action: 'UPDATE_FOUNDATION_INFO',
    details: 'Memperbarui informasi profil & pengaturan yayasan',
    category: 'APP_CONFIG',
  });

  return updated;
}

// Audit Logs
export function getAuditLogs(): AuditLog[] {
  return getItem<AuditLog[]>(STORAGE_KEYS.LOGS, INITIAL_LOGS);
}

export function addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
  const current = getAuditLogs();
  const newLog: AuditLog = {
    ...log,
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
  const updated = [newLog, ...current.slice(0, 99)];
  setItem(STORAGE_KEYS.LOGS, updated);
}

// Access Requests
export function getAccessRequests(): AccessRequest[] {
  return getItem<AccessRequest[]>(STORAGE_KEYS.REQUESTS, []);
}

export function submitAccessRequest(request: Omit<AccessRequest, 'id' | 'requestedAt' | 'status'>): AccessRequest {
  const current = getAccessRequests();
  const newReq: AccessRequest = {
    ...request,
    id: `req-${Date.now()}`,
    requestedAt: new Date().toISOString(),
    status: 'PENDING',
  };
  const updated = [newReq, ...current];
  setItem(STORAGE_KEYS.REQUESTS, updated);
  return newReq;
}

export function resolveAccessRequest(
  id: string,
  status: 'APPROVED' | 'REJECTED',
  adminName: string,
  role?: UserRole,
  adminNotes?: string
): void {
  const current = getAccessRequests();
  const index = current.findIndex((r) => r.id === id);
  if (index !== -1) {
    const req = current[index];
    req.status = status;
    req.approvedAt = new Date().toISOString();
    req.approvedBy = adminName;
    if (adminNotes) req.adminNotes = adminNotes;
    setItem(STORAGE_KEYS.REQUESTS, current);

    if (status === 'APPROVED' && role) {
      addWhitelistedUser(
        {
          name: req.name,
          email: req.email,
          role: role,
          roleTitle:
            role === 'OPERATIONAL'
              ? 'Staf Operasional'
              : role === 'FINANCE_WAREHOUSE'
              ? 'Staf Keuangan/Gudang'
              : role === 'EXECUTIVE'
              ? 'Pengurus Yayasan'
              : 'Staf Yayasan',
          department: req.department || 'Operasional',
          active: true,
          addedBy: adminName,
        },
        adminName
      );

      addAuditLog({
        userEmail: req.email,
        userName: adminName,
        action: 'APPROVE_ACCESS_REQUEST',
        details: `Menyetujui permohonan akses aplikasi ${req.appTitle || 'PORTAL'} untuk ${req.name} (${req.email})`,
        category: 'WHITELIST',
      });
    } else if (status === 'REJECTED') {
      addAuditLog({
        userEmail: req.email,
        userName: adminName,
        action: 'REJECT_ACCESS_REQUEST',
        details: `Menolak permohonan akses untuk ${req.name} (${req.email})${adminNotes ? ': ' + adminNotes : ''}`,
        category: 'WHITELIST',
      });
    }
  }
}

// ==========================================
// Calendar Events Operations (Master Agenda)
// ==========================================
export function getEvents(): CalendarEvent[] {
  return getItem<CalendarEvent[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
}

export function getEventById(id: string): CalendarEvent | undefined {
  const list = getEvents();
  return list.find((e) => e.id === id);
}

export function addEvent(
  event: Omit<CalendarEvent, 'id' | 'createdAt'>,
  authorName: string
): CalendarEvent {
  const current = getEvents();
  const newEvent: CalendarEvent = {
    ...event,
    id: `event-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  const updated = [newEvent, ...current].sort((a, b) => {
    return new Date(`${a.date}T${a.timeStart || '00:00'}`).getTime() - new Date(`${b.date}T${b.timeStart || '00:00'}`).getTime();
  });
  setItem(STORAGE_KEYS.EVENTS, updated);

  addAuditLog({
    userEmail: 'internal@rumahetnikpapua.org',
    userName: authorName,
    action: 'CREATE_EVENT',
    details: `Menambahkan agenda baru: "${event.title}" pada tanggal ${event.date} (${event.timeStart} WIT)`,
    category: 'EVENT',
  });

  return newEvent;
}

export function updateEvent(
  id: string,
  updates: Partial<CalendarEvent>,
  authorName: string
): void {
  const current = getEvents();
  const index = current.findIndex((e) => e.id === id);
  if (index !== -1) {
    const old = current[index];
    current[index] = { ...old, ...updates };
    setItem(STORAGE_KEYS.EVENTS, current);

    addAuditLog({
      userEmail: 'internal@rumahetnikpapua.org',
      userName: authorName,
      action: 'UPDATE_EVENT',
      details: `Memperbarui agenda: "${old.title}"`,
      category: 'EVENT',
    });
  }
}

export function deleteEvent(id: string, authorName: string): void {
  const current = getEvents();
  const target = current.find((e) => e.id === id);
  const updated = current.filter((e) => e.id !== id);
  setItem(STORAGE_KEYS.EVENTS, updated);

  if (target) {
    addAuditLog({
      userEmail: 'internal@rumahetnikpapua.org',
      userName: authorName,
      action: 'DELETE_EVENT',
      details: `Menghapus agenda: "${target.title}" (tanggal ${target.date})`,
      category: 'EVENT',
    });
  }
}

// ==========================================
// Documents & SOP Operations (Google Drive)
// ==========================================
export function getDocuments(): FoundationDocument[] {
  return getItem<FoundationDocument[]>(STORAGE_KEYS.DOCUMENTS, INITIAL_DOCUMENTS);
}

export function getDocumentById(id: string): FoundationDocument | undefined {
  const list = getDocuments();
  return list.find((d) => d.id === id);
}

export function addDocument(
  doc: Omit<FoundationDocument, 'id' | 'lastUpdated'>,
  adminName: string
): FoundationDocument {
  const current = getDocuments();
  const newDoc: FoundationDocument = {
    ...doc,
    id: `doc-${Date.now()}`,
    lastUpdated: new Date().toISOString(),
    downloadsCount: doc.downloadsCount || 0,
  };

  const updated = [newDoc, ...current];
  setItem(STORAGE_KEYS.DOCUMENTS, updated);

  addAuditLog({
    userEmail: 'internal@rumahetnikpapua.org',
    userName: adminName,
    action: 'UPLOAD_DOCUMENT',
    details: `Menambahkan dokumen baru: "${doc.title}" (${doc.code || 'SOP'})`,
    category: 'DOCUMENT',
  });

  return newDoc;
}

export function updateDocument(
  id: string,
  updates: Partial<FoundationDocument>,
  adminName: string
): void {
  const current = getDocuments();
  const index = current.findIndex((d) => d.id === id);
  if (index !== -1) {
    const old = current[index];
    current[index] = {
      ...old,
      ...updates,
      lastUpdated: new Date().toISOString(),
    };
    setItem(STORAGE_KEYS.DOCUMENTS, current);

    addAuditLog({
      userEmail: 'internal@rumahetnikpapua.org',
      userName: adminName,
      action: 'UPDATE_DOCUMENT',
      details: `Memperbarui dokumen: "${old.title}" (${old.code})`,
      category: 'DOCUMENT',
    });
  }
}

export function deleteDocument(id: string, adminName: string): void {
  const current = getDocuments();
  const target = current.find((d) => d.id === id);
  const updated = current.filter((d) => d.id !== id);
  setItem(STORAGE_KEYS.DOCUMENTS, updated);

  if (target) {
    addAuditLog({
      userEmail: 'internal@rumahetnikpapua.org',
      userName: adminName,
      action: 'DELETE_DOCUMENT',
      details: `Menghapus dokumen: "${target.title}" (${target.code})`,
      category: 'DOCUMENT',
    });
  }
}

export function incrementDocDownload(id: string): void {
  const current = getDocuments();
  const index = current.findIndex((d) => d.id === id);
  if (index !== -1) {
    current[index].downloadsCount = (current[index].downloadsCount || 0) + 1;
    setItem(STORAGE_KEYS.DOCUMENTS, current);
  }
}

// ==========================================
// Executive Metrics Operations
// ==========================================
export function getAllExecutiveMetrics(): Record<MetricsPeriod, ExecutiveMetrics> {
  return getItem<Record<MetricsPeriod, ExecutiveMetrics>>(
    STORAGE_KEYS.METRICS,
    INITIAL_EXECUTIVE_METRICS
  );
}

export function getExecutiveMetrics(period: MetricsPeriod = 'TODAY'): ExecutiveMetrics {
  const all = getAllExecutiveMetrics();
  return all[period] || INITIAL_EXECUTIVE_METRICS[period];
}

export function updateExecutiveMetrics(
  period: MetricsPeriod,
  updates: Partial<ExecutiveMetrics>
): void {
  const all = getAllExecutiveMetrics();
  all[period] = {
    ...all[period],
    ...updates,
    lastUpdated: new Date().toISOString(),
  };
  setItem(STORAGE_KEYS.METRICS, all);
}

// Reset data to defaults
export function resetToDefaults(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.WHITELIST, JSON.stringify(INITIAL_WHITELIST));
  localStorage.setItem(STORAGE_KEYS.APPS, JSON.stringify(INITIAL_APPS));
  localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(INITIAL_NOTICES));
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_LOGS));
  localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(INITIAL_EVENTS));
  localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(INITIAL_DOCUMENTS));
  localStorage.setItem(STORAGE_KEYS.METRICS, JSON.stringify(INITIAL_EXECUTIVE_METRICS));
  window.dispatchEvent(new CustomEvent('portal_rep_storage_update', { detail: { key: 'ALL' } }));
}

