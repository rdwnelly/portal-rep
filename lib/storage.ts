'use client';

import { AppItem, NoticeItem, WhitelistedUser, AuditLog, AccessRequest, UserRole } from './types';
import { INITIAL_WHITELIST, INITIAL_APPS, INITIAL_NOTICES, INITIAL_LOGS } from './seed-data';

const STORAGE_KEYS = {
  WHITELIST: 'portal_rep_whitelist_v1',
  APPS: 'portal_rep_apps_v2',
  NOTICES: 'portal_rep_notices_v1',
  LOGS: 'portal_rep_logs_v1',
  REQUESTS: 'portal_rep_requests_v1',
  CUSTOM_USER: 'portal_rep_current_user_v1',
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

// Reset data to defaults
export function resetToDefaults(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.WHITELIST, JSON.stringify(INITIAL_WHITELIST));
  localStorage.setItem(STORAGE_KEYS.APPS, JSON.stringify(INITIAL_APPS));
  localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(INITIAL_NOTICES));
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_LOGS));
  localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify([]));
  window.dispatchEvent(new CustomEvent('portal_rep_storage_update', { detail: { key: 'ALL' } }));
}
