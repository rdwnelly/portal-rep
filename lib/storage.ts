'use client';

/**
 * Lapisan data PORTAL REP.
 *
 * Dua backend dengan API yang sama:
 *  - Firestore (produksi / emulator): data dibaca melalui listener onSnapshot real-time ke cache
 *    di memori, sehingga getter tetap sinkron. Penulisan dikirim ke Firestore dan otorisasinya
 *    ditegakkan oleh Security Rules (lihat firestore.rules) — bukan oleh kode klien ini.
 *  - localStorage (mode demo, hanya pengembangan lokal tanpa konfigurasi Firebase).
 *
 * Setiap perubahan data memicu event `portal_rep_storage_update`; kegagalan penulisan memicu
 * `portal_rep_storage_error` agar UI dapat menampilkan pesan.
 */

import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  writeBatch,
  increment,
  Query,
  Unsubscribe,
} from 'firebase/firestore';
import { auth, db, isConfigured } from './firebase';
import {
  AppItem,
  NoticeItem,
  WhitelistedUser,
  AuditLog,
  AccessRequest,
  UserRole,
  FoundationInfo,
  CalendarEvent,
  FoundationDocument,
  ExecutiveMetrics,
  MetricsPeriod,
  NoticeRead,
} from './types';
import {
  INITIAL_WHITELIST,
  INITIAL_APPS,
  INITIAL_NOTICES,
  INITIAL_LOGS,
  INITIAL_EVENTS,
  INITIAL_DOCUMENTS,
  INITIAL_EXECUTIVE_METRICS,
} from './seed-data';

/** true → data hidup di Firestore; false → data demo di localStorage. */
export const isRemoteStore = isConfigured;

export const STORAGE_UPDATE_EVENT = 'portal_rep_storage_update';
export const STORAGE_ERROR_EVENT = 'portal_rep_storage_error';

const STORAGE_KEYS = {
  WHITELIST: 'portal_rep_whitelist_v1',
  APPS: 'portal_rep_apps_v2',
  NOTICES: 'portal_rep_notices_v1',
  LOGS: 'portal_rep_logs_v1',
  REQUESTS: 'portal_rep_requests_v1',
  INFO: 'portal_rep_foundation_info_v1',
  EVENTS: 'portal_rep_events_v1',
  DOCUMENTS: 'portal_rep_documents_v1',
  METRICS: 'portal_rep_executive_metrics_v1',
  READS: 'portal_rep_notice_reads_v1',
};

const COLLECTIONS = {
  WHITELIST: 'whitelist',
  APPS: 'apps',
  NOTICES: 'notices',
  EVENTS: 'events',
  DOCUMENTS: 'documents',
  REQUESTS: 'accessRequests',
  LOGS: 'auditLogs',
  METRICS: 'metrics',
  SETTINGS: 'settings',
} as const;

const FOUNDATION_DOC_ID = 'foundation';

// Foundation Information default
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

/**
 * Nilai awal untuk render server (SSR) & hidrasi.
 */
export const SSR_APPS: AppItem[] = INITIAL_APPS;
export const SSR_NOTICES: NoticeItem[] = INITIAL_NOTICES;
export const SSR_EVENTS: CalendarEvent[] = INITIAL_EVENTS;
export const SSR_DOCUMENTS: FoundationDocument[] = isRemoteStore ? [] : INITIAL_DOCUMENTS;
export const SSR_WHITELIST: WhitelistedUser[] = isRemoteStore ? [] : INITIAL_WHITELIST;
export const SSR_LOGS: AuditLog[] = isRemoteStore ? [] : INITIAL_LOGS;

// ==========================================
// Utilitas umum
// ==========================================
function notify(key: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(STORAGE_UPDATE_EVENT, { detail: { key } }));
}

function reportError(context: string, err: unknown): void {
  console.error(`[PORTAL REP] ${context}:`, err);
  if (typeof window === 'undefined') return;
  const code = (err as { code?: string })?.code;
  const message =
    code === 'permission-denied'
      ? `${context} ditolak: aturan Firestore (firestore.rules) belum diterapkan di Firebase Console atau akun Anda tidak memiliki izin.`
      : `${context} gagal: ${(err as Error)?.message || 'kesalahan tidak diketahui'}`;
  window.dispatchEvent(new CustomEvent(STORAGE_ERROR_EVENT, { detail: { message } }));
}

function withoutId<T extends { id: string }>(item: T): Omit<T, 'id'> {
  const copy: Partial<T> = { ...item };
  delete copy.id;
  return copy as Omit<T, 'id'>;
}

function newRemoteId(col: string): string {
  return doc(collection(db, col)).id;
}

/** Tulis dokumen; promise selalu resolve (true = tersimpan) — error sudah dilaporkan ke UI. */
function remoteSet(col: string, id: string, data: object, context: string): Promise<boolean> {
  return setDoc(doc(db, col, id), data).then(
    () => true,
    (err) => {
      reportError(context, err);
      return false;
    }
  );
}

const pendingNoticeSaves = new Map<string, Promise<boolean>>();
const pendingWhitelistSaves = new Map<string, Promise<boolean>>();

/**
 * Tunggu sampai dokumen whitelist karyawan benar-benar tersimpan di Firestore.
 * Penyiapan akun login dibaca server lewat Admin SDK, jadi ia harus menunggu tulisan ini
 * mendarat — kalau tidak, server melihat karyawannya "belum ada di whitelist".
 */
export function whitelistSaved(email: string): Promise<boolean> {
  return pendingWhitelistSaves.get(email.trim().toLowerCase()) ?? Promise.resolve(true);
}

/** Tunggu sampai pengumuman yang baru dibuat benar-benar tersimpan (true) atau gagal (false). */
export function noticeSaved(id: string): Promise<boolean> {
  return pendingNoticeSaves.get(id) ?? Promise.resolve(true);
}

function remoteUpdate(col: string, id: string, data: object, context: string): void {
  updateDoc(doc(db, col, id), data).catch((err) => reportError(context, err));
}

function remoteDelete(col: string, id: string, context: string): void {
  deleteDoc(doc(db, col, id)).catch((err) => reportError(context, err));
}

function currentActorEmail(): string {
  return auth.currentUser?.email?.toLowerCase() || '';
}

// ---------- localStorage (mode demo) ----------
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
    notify(key);
  } catch (error) {
    console.error('Storage write error:', error);
  }
}

// ==========================================
// Sinkronisasi Firestore (cache di memori)
// ==========================================
interface RemoteCache {
  whitelist: WhitelistedUser[];
  apps: AppItem[];
  notices: NoticeItem[];
  events: CalendarEvent[];
  documents: FoundationDocument[];
  requests: AccessRequest[];
  logs: AuditLog[];
  info: FoundationInfo;
  metrics: Record<MetricsPeriod, ExecutiveMetrics>;
}

const remote: RemoteCache = {
  whitelist: [],
  apps: [],
  notices: [],
  events: [],
  documents: [],
  requests: [],
  logs: [],
  info: INITIAL_FOUNDATION_INFO,
  metrics: INITIAL_EXECUTIVE_METRICS,
};

const byDesc = <T>(pick: (item: T) => string) => (a: T, b: T) => (pick(b) || '').localeCompare(pick(a) || '');
const eventTime = (e: CalendarEvent) => new Date(`${e.date}T${e.timeStart || '00:00'}`).getTime();

type ListKey = 'whitelist' | 'apps' | 'notices' | 'events' | 'documents' | 'requests' | 'logs';

function listenList<K extends ListKey>(
  q: Query,
  key: K,
  sorter?: (a: RemoteCache[K][number], b: RemoteCache[K][number]) => number
): Unsubscribe {
  return onSnapshot(
    q,
    (snap) => {
      let items = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as RemoteCache[K][number][];
      if (key === 'apps') items = splitLegacyPosOmg(items as AppItem[]) as RemoteCache[K][number][];
      if (sorter) items.sort(sorter);
      remote[key] = items as RemoteCache[K];
      notify(key);
    },
    (err) => reportError(`Sinkronisasi data ${key}`, err)
  );
}

let publicSyncStarted = false;
let foundationInfoLoaded = false;
let roleUnsubs: Unsubscribe[] = [];
let activeSyncRole: UserRole | null | undefined;

/** Listener untuk data publik (tanpa login). Aman dipanggil berkali-kali. */
export function startPublicSync(): void {
  if (!isRemoteStore || publicSyncStarted || typeof window === 'undefined') return;
  publicSyncStarted = true;

  listenList(collection(db, COLLECTIONS.APPS), 'apps', (a, b) => (a.order ?? 0) - (b.order ?? 0));
  listenList(collection(db, COLLECTIONS.NOTICES), 'notices', byDesc<NoticeItem>((n) => n.createdAt));
  listenList(collection(db, COLLECTIONS.EVENTS), 'events', (a, b) => eventTime(a) - eventTime(b));

  onSnapshot(
    doc(db, COLLECTIONS.SETTINGS, FOUNDATION_DOC_ID),
    (snap) => {
      remote.info = snap.exists() ? { ...INITIAL_FOUNDATION_INFO, ...(snap.data() as FoundationInfo) } : INITIAL_FOUNDATION_INFO;
      foundationInfoLoaded = true;
      notify('info');
    },
    (err) => reportError('Sinkronisasi informasi yayasan', err)
  );

  // Sebelum status login diketahui, muat dokumen publik (non-rahasia) saja.
  if (activeSyncRole === undefined) configureSync(null);
}

const STAFF_ROLES: UserRole[] = ['EXECUTIVE', 'OPERATIONAL', 'FINANCE_WAREHOUSE', 'IT_ADMIN'];

/**
 * Atur listener berdasarkan role pengguna yang sedang login (dipanggil oleh AuthProvider).
 * Ini hanya menentukan data apa yang DICOBA dimuat; izin sebenarnya diputuskan Security Rules.
 */
export function configureSync(role: UserRole | null): void {
  if (!isRemoteStore || typeof window === 'undefined') return;
  if (!publicSyncStarted) {
    activeSyncRole = role;
    startPublicSync();
  } else if (role === activeSyncRole) {
    return;
  }
  activeSyncRole = role;

  roleUnsubs.forEach((unsub) => unsub());
  roleUnsubs = [];
  remote.whitelist = [];
  remote.requests = [];
  remote.logs = [];
  remote.metrics = INITIAL_EXECUTIVE_METRICS;
  notify('ALL');

  const isStaff = role !== null && STAFF_ROLES.includes(role);
  const isManager = role === 'IT_ADMIN' || role === 'EXECUTIVE';
  const isAdmin = role === 'IT_ADMIN';
  const docSort = byDesc<FoundationDocument>((d) => d.lastUpdated);

  // Dokumen rahasia hanya untuk staf terdaftar.
  roleUnsubs.push(
    isStaff
      ? listenList(collection(db, COLLECTIONS.DOCUMENTS), 'documents', docSort)
      : listenList(query(collection(db, COLLECTIONS.DOCUMENTS), where('isConfidential', '==', false)), 'documents', docSort)
  );

  if (isManager) {
    roleUnsubs.push(
      listenList(collection(db, COLLECTIONS.REQUESTS), 'requests', byDesc<AccessRequest>((r) => r.requestedAt))
    );
  }

  if (isManager) {
    // Daftar staf dibutuhkan pimpinan untuk melihat siapa yang belum membaca instruksi.
    roleUnsubs.push(
      listenList(collection(db, COLLECTIONS.WHITELIST), 'whitelist', byDesc<WhitelistedUser>((u) => u.addedAt))
    );
  }

  if (isAdmin) {
    roleUnsubs.push(
      listenList(query(collection(db, COLLECTIONS.LOGS), orderBy('timestamp', 'desc'), limit(100)), 'logs')
    );
  }
}

// ==========================================
// Whitelist Operations
// ==========================================
export function getWhitelist(): WhitelistedUser[] {
  if (isRemoteStore) return remote.whitelist;
  return getItem<WhitelistedUser[]>(STORAGE_KEYS.WHITELIST, INITIAL_WHITELIST);
}

export function findWhitelistedUser(email: string): WhitelistedUser | undefined {
  const normalized = email.trim().toLowerCase();
  return getWhitelist().find((u) => u.email.toLowerCase() === normalized && u.active);
}

export function addWhitelistedUser(
  user: Omit<WhitelistedUser, 'id' | 'addedAt'>,
  adminName: string
): WhitelistedUser {
  const email = user.email.trim().toLowerCase();
  const current = getWhitelist();
  if (current.some((u) => u.email.toLowerCase() === email)) {
    throw new Error(`Email ${email} sudah terdaftar dalam whitelist.`);
  }

  const newUser: WhitelistedUser = {
    ...user,
    email,
    // Di Firestore, ID dokumen whitelist = email (dipakai Security Rules untuk mencari role).
    id: isRemoteStore ? email : `user-${Date.now()}`,
    addedAt: new Date().toISOString(),
  };

  if (isRemoteStore) {
    const saved = remoteSet(COLLECTIONS.WHITELIST, email, withoutId(newUser), 'Menambahkan karyawan ke whitelist');
    pendingWhitelistSaves.set(email, saved);
    void saved.finally(() => {
      if (pendingWhitelistSaves.get(email) === saved) pendingWhitelistSaves.delete(email);
    });
  } else {
    setItem(STORAGE_KEYS.WHITELIST, [newUser, ...current]);
  }

  addAuditLog({
    userEmail: email,
    userName: adminName,
    action: 'ADD_WHITELIST',
    details: `Menambahkan ${user.name} (${email}) dengan role ${user.roleTitle}`,
    category: 'WHITELIST',
  });

  return newUser;
}

export function updateWhitelistedUser(id: string, updates: Partial<WhitelistedUser>, adminName: string): void {
  const current = getWhitelist();
  const index = current.findIndex((u) => u.id === id);
  if (index === -1) return;
  const old = current[index];

  if (isRemoteStore) {
    // Email adalah kunci dokumen; tidak dapat diubah lewat pembaruan.
    const rest: Partial<WhitelistedUser> = { ...updates };
    delete rest.id;
    delete rest.email;
    remoteUpdate(COLLECTIONS.WHITELIST, old.email.toLowerCase(), rest, 'Memperbarui data karyawan');
  } else {
    const next = [...current];
    next[index] = { ...old, ...updates };
    setItem(STORAGE_KEYS.WHITELIST, next);
  }

  addAuditLog({
    userEmail: old.email,
    userName: adminName,
    action: 'UPDATE_WHITELIST',
    details: `Mengubah data whitelist untuk ${old.name} (${old.email})`,
    category: 'WHITELIST',
  });
}

export function removeWhitelistedUser(id: string, adminName: string): void {
  const current = getWhitelist();
  const user = current.find((u) => u.id === id);
  if (!user) return;

  if (isRemoteStore) {
    remoteDelete(COLLECTIONS.WHITELIST, user.email.toLowerCase(), 'Menghapus karyawan dari whitelist');
  } else {
    setItem(STORAGE_KEYS.WHITELIST, current.filter((u) => u.id !== id));
  }

  addAuditLog({
    userEmail: user.email,
    userName: adminName,
    action: 'DELETE_WHITELIST',
    details: `Menghapus ${user.name} (${user.email}) dari daftar whitelist`,
    category: 'WHITELIST',
  });
}

// ==========================================
// Apps Operations
// ==========================================
/**
 * Memastikan modul POS Kasir dan OMG Gudang tampil terpisah meskipun data tersimpan masih
 * menggunakan entri legacy `app-pos-omg`.
 */
export function splitLegacyPosOmg(list: AppItem[]): AppItem[] {
  if (!list.some((a) => a.id === 'app-pos-omg')) return list;
  const posTemplate = INITIAL_APPS.find((a) => a.id === 'app-pos');
  const omgTemplate = INITIAL_APPS.find((a) => a.id === 'app-omg');
  const result: AppItem[] = [];
  for (const item of list) {
    if (item.id === 'app-pos-omg') {
      if (posTemplate) result.push({ ...posTemplate, url: item.url || posTemplate.url });
      if (omgTemplate) result.push({ ...omgTemplate, url: item.url || omgTemplate.url });
    } else {
      result.push(item);
    }
  }
  return result;
}

export function getAppsList(): AppItem[] {
  if (isRemoteStore) {
    startPublicSync();
    return splitLegacyPosOmg(remote.apps.length > 0 ? remote.apps : INITIAL_APPS);
  }
  return splitLegacyPosOmg(getItem<AppItem[]>(STORAGE_KEYS.APPS, INITIAL_APPS));
}

export function addAppItem(app: Omit<AppItem, 'id' | 'order'>, adminName: string): AppItem {
  const current = getAppsList();
  const newApp: AppItem = {
    ...app,
    id: isRemoteStore ? newRemoteId(COLLECTIONS.APPS) : `app-${Date.now()}`,
    order: current.length + 1,
  };

  if (isRemoteStore) {
    remoteSet(COLLECTIONS.APPS, newApp.id, withoutId(newApp), 'Menambahkan modul aplikasi');
  } else {
    setItem(STORAGE_KEYS.APPS, [...current, newApp]);
  }

  addAuditLog({
    userEmail: currentActorEmail(),
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
  if (index === -1) return;
  const old = current[index];

  if (isRemoteStore) {
    const rest: Partial<AppItem> = { ...updates };
    delete rest.id;
    remoteUpdate(COLLECTIONS.APPS, id, rest, 'Memperbarui konfigurasi aplikasi');
  } else {
    const next = [...current];
    next[index] = { ...old, ...updates };
    setItem(STORAGE_KEYS.APPS, next);
  }

  addAuditLog({
    userEmail: currentActorEmail(),
    userName: adminName,
    action: 'UPDATE_APP_CONFIG',
    details: `Memperbarui konfigurasi aplikasi: ${old.title}`,
    category: 'APP_CONFIG',
  });
}

export function deleteAppItem(id: string, adminName: string): void {
  const current = getAppsList();
  const target = current.find((a) => a.id === id);
  if (!target) return;

  if (isRemoteStore) {
    remoteDelete(COLLECTIONS.APPS, id, 'Menghapus modul aplikasi');
  } else {
    setItem(STORAGE_KEYS.APPS, current.filter((a) => a.id !== id));
  }

  addAuditLog({
    userEmail: currentActorEmail(),
    userName: adminName,
    action: 'DELETE_APP_ITEM',
    details: `Menghapus modul aplikasi: ${target.title}`,
    category: 'APP_CONFIG',
  });
}

// ==========================================
// Notice Board Operations
// ==========================================
export function getNotices(): NoticeItem[] {
  if (isRemoteStore) {
    startPublicSync();
    return remote.notices.length > 0 ? remote.notices : INITIAL_NOTICES;
  }
  return getItem<NoticeItem[]>(STORAGE_KEYS.NOTICES, INITIAL_NOTICES);
}

export function addNotice(notice: Omit<NoticeItem, 'id' | 'createdAt'>): NoticeItem {
  const newNotice: NoticeItem = {
    ...notice,
    id: isRemoteStore ? newRemoteId(COLLECTIONS.NOTICES) : `notice-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  if (isRemoteStore) {
    const saving = remoteSet(COLLECTIONS.NOTICES, newNotice.id, withoutId(newNotice), 'Menerbitkan pengumuman');
    pendingNoticeSaves.set(newNotice.id, saving);
    void saving.finally(() => setTimeout(() => pendingNoticeSaves.delete(newNotice.id), 60_000));
  } else {
    setItem(STORAGE_KEYS.NOTICES, [newNotice, ...getNotices()]);
  }

  addAuditLog({
    userEmail: currentActorEmail(),
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
  if (index === -1) return;
  const old = current[index];

  if (isRemoteStore) {
    const rest: Partial<NoticeItem> = { ...updates };
    delete rest.id;
    remoteUpdate(COLLECTIONS.NOTICES, id, rest, 'Memperbarui pengumuman');
  } else {
    const next = [...current];
    next[index] = { ...old, ...updates };
    setItem(STORAGE_KEYS.NOTICES, next);
  }

  addAuditLog({
    userEmail: currentActorEmail(),
    userName: adminName,
    action: 'UPDATE_NOTICE',
    details: `Memperbarui pengumuman: "${old.title.substring(0, 40)}..."`,
    category: 'NOTICE',
  });
}

export function togglePinNotice(id: string): void {
  const current = getNotices();
  const index = current.findIndex((n) => n.id === id);
  if (index === -1) return;

  if (isRemoteStore) {
    remoteUpdate(COLLECTIONS.NOTICES, id, { isPinned: !current[index].isPinned }, 'Menyematkan pengumuman');
  } else {
    const next = [...current];
    next[index] = { ...next[index], isPinned: !next[index].isPinned };
    setItem(STORAGE_KEYS.NOTICES, next);
  }
}

export function deleteNotice(id: string, adminName: string): void {
  const current = getNotices();
  const target = current.find((n) => n.id === id);
  if (!target) return;

  if (isRemoteStore) {
    remoteDelete(COLLECTIONS.NOTICES, id, 'Menghapus pengumuman');
  } else {
    setItem(STORAGE_KEYS.NOTICES, current.filter((n) => n.id !== id));
  }

  addAuditLog({
    userEmail: currentActorEmail(),
    userName: adminName,
    action: 'DELETE_NOTICE',
    details: `Menghapus pengumuman: "${target.title.substring(0, 40)}..."`,
    category: 'NOTICE',
  });
}

// ==========================================
// Konfirmasi Baca Pengumuman
// ==========================================
function readLocalReads(): Record<string, NoticeRead[]> {
  return getItem<Record<string, NoticeRead[]>>(STORAGE_KEYS.READS, {});
}

/** Pantau seluruh konfirmasi baca sebuah pengumuman (hanya pimpinan/IT di mode Firestore). */
export function subscribeNoticeReads(noticeId: string, callback: (reads: NoticeRead[]) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  if (isRemoteStore) {
    return onSnapshot(
      collection(db, COLLECTIONS.NOTICES, noticeId, 'reads'),
      (snap) => callback(snap.docs.map((d) => d.data() as NoticeRead).sort(byDesc<NoticeRead>((r) => r.readAt))),
      (err) => reportError('Memuat status baca pengumuman', err)
    );
  }
  const emit = () => callback(readLocalReads()[noticeId] || []);
  emit();
  window.addEventListener(STORAGE_UPDATE_EVENT, emit);
  return () => window.removeEventListener(STORAGE_UPDATE_EVENT, emit);
}

/** Pantau konfirmasi baca milik pengguna sendiri. */
export function subscribeMyNoticeRead(
  noticeId: string,
  email: string,
  callback: (read: NoticeRead | null) => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  const key = email.toLowerCase();
  if (isRemoteStore) {
    return onSnapshot(
      doc(db, COLLECTIONS.NOTICES, noticeId, 'reads', key),
      (snap) => callback(snap.exists() ? (snap.data() as NoticeRead) : null),
      (err) => reportError('Memuat status baca Anda', err)
    );
  }
  const emit = () => callback((readLocalReads()[noticeId] || []).find((r) => r.email === key) || null);
  emit();
  window.addEventListener(STORAGE_UPDATE_EVENT, emit);
  return () => window.removeEventListener(STORAGE_UPDATE_EVENT, emit);
}

export async function confirmNoticeRead(
  noticeId: string,
  reader: { email: string; name: string; role: UserRole }
): Promise<void> {
  const read: NoticeRead = {
    email: reader.email.toLowerCase(),
    name: reader.name,
    role: reader.role,
    readAt: new Date().toISOString(),
  };
  if (isRemoteStore) {
    try {
      await setDoc(doc(db, COLLECTIONS.NOTICES, noticeId, 'reads', read.email), read);
    } catch (err) {
      reportError('Mengonfirmasi pengumuman', err);
      throw err;
    }
    return;
  }
  const all = readLocalReads();
  const list = (all[noticeId] || []).filter((r) => r.email !== read.email);
  setItem(STORAGE_KEYS.READS, { ...all, [noticeId]: [read, ...list] });
}

// ==========================================
// Foundation Information
// ==========================================
export function getFoundationInfo(): FoundationInfo {
  if (isRemoteStore) {
    startPublicSync();
    return remote.info;
  }
  return getItem<FoundationInfo>(STORAGE_KEYS.INFO, INITIAL_FOUNDATION_INFO);
}

/**
 * true setelah info yayasan benar-benar dimuat. Formulir edit menunggu ini agar tidak menyimpan
 * nilai default di atas data asli yang belum sempat tiba dari Firestore.
 */
export function isFoundationInfoLoaded(): boolean {
  return !isRemoteStore || foundationInfoLoaded;
}

export function updateFoundationInfo(info: Partial<FoundationInfo>, adminName: string): FoundationInfo {
  const updated: FoundationInfo = {
    ...getFoundationInfo(),
    ...info,
    lastUpdated: new Date().toISOString(),
  };

  if (isRemoteStore) {
    remoteSet(COLLECTIONS.SETTINGS, FOUNDATION_DOC_ID, updated, 'Memperbarui informasi yayasan');
  } else {
    setItem(STORAGE_KEYS.INFO, updated);
  }

  addAuditLog({
    userEmail: currentActorEmail(),
    userName: adminName,
    action: 'UPDATE_FOUNDATION_INFO',
    details: 'Memperbarui informasi profil & pengaturan yayasan',
    category: 'APP_CONFIG',
  });

  return updated;
}

// ==========================================
// Audit Logs
// ==========================================
export function getAuditLogs(): AuditLog[] {
  if (isRemoteStore) return remote.logs;
  return getItem<AuditLog[]>(STORAGE_KEYS.LOGS, INITIAL_LOGS);
}

/**
 * Catat audit log dan tunggu hingga tersimpan. Di Firestore hanya akun yang sedang login yang
 * dapat menulis log, dan `actorEmail` wajib sama dengan email akun tersebut (dicek oleh Rules).
 */
export async function addAuditLogAsync(log: Omit<AuditLog, 'id' | 'timestamp' | 'actorEmail'>): Promise<void> {
  const timestamp = new Date().toISOString();

  if (isRemoteStore) {
    const actorEmail = currentActorEmail();
    if (!actorEmail) return; // Pengunjung anonim tidak menulis audit log.
    try {
      await setDoc(doc(db, COLLECTIONS.LOGS, newRemoteId(COLLECTIONS.LOGS)), { ...log, actorEmail, timestamp });
    } catch (err) {
      // Kegagalan mencatat log tidak boleh menggagalkan aksi utama.
      console.warn('[PORTAL REP] Audit log tidak tersimpan:', err);
    }
    return;
  }

  const newLog: AuditLog = { ...log, id: `log-${Date.now()}`, timestamp };
  setItem(STORAGE_KEYS.LOGS, [newLog, ...getAuditLogs().slice(0, 99)]);
}

export function addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp' | 'actorEmail'>): void {
  void addAuditLogAsync(log);
}

// ==========================================
// Access Requests
// ==========================================
export function getAccessRequests(): AccessRequest[] {
  if (isRemoteStore) return remote.requests;
  return getItem<AccessRequest[]>(STORAGE_KEYS.REQUESTS, []);
}

export function submitAccessRequest(request: Omit<AccessRequest, 'id' | 'requestedAt' | 'status'>): AccessRequest {
  const newReq: AccessRequest = {
    ...request,
    email: request.email.trim().toLowerCase(),
    id: isRemoteStore ? newRemoteId(COLLECTIONS.REQUESTS) : `req-${Date.now()}`,
    requestedAt: new Date().toISOString(),
    status: 'PENDING',
  };

  if (isRemoteStore) {
    remoteSet(COLLECTIONS.REQUESTS, newReq.id, withoutId(newReq), 'Mengirim permohonan akses');
  } else {
    setItem(STORAGE_KEYS.REQUESTS, [newReq, ...getAccessRequests()]);
  }
  return newReq;
}

const ROLE_TITLE_FOR_APPROVAL: Record<UserRole, string> = {
  OPERATIONAL: 'Staf Operasional',
  FINANCE_WAREHOUSE: 'Staf Keuangan/Gudang',
  EXECUTIVE: 'Pengurus Yayasan',
  IT_ADMIN: 'IT Administrator',
  UNAUTHORIZED: 'Staf Yayasan',
};

export function resolveAccessRequest(
  id: string,
  status: 'APPROVED' | 'REJECTED',
  adminName: string,
  role?: UserRole,
  adminNotes?: string
): void {
  const current = getAccessRequests();
  const index = current.findIndex((r) => r.id === id);
  if (index === -1) return;
  const req = current[index];

  const resolution: Partial<AccessRequest> = {
    status,
    approvedAt: new Date().toISOString(),
    approvedBy: adminName,
    ...(adminNotes ? { adminNotes } : {}),
  };

  if (isRemoteStore) {
    remoteUpdate(COLLECTIONS.REQUESTS, id, resolution, 'Memproses permohonan akses');
  } else {
    const next = [...current];
    next[index] = { ...req, ...resolution };
    setItem(STORAGE_KEYS.REQUESTS, next);
  }

  if (status === 'APPROVED' && role) {
    const alreadyListed = Boolean(findWhitelistedUser(req.email));
    if (!alreadyListed) {
      try {
        addWhitelistedUser(
          {
            name: req.name,
            email: req.email,
            role,
            roleTitle: ROLE_TITLE_FOR_APPROVAL[role],
            department: req.department || 'Operasional',
            active: true,
            addedBy: adminName,
          },
          adminName
        );
      } catch (err) {
        reportError('Menambahkan pemohon ke whitelist', err);
      }
    }

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

// ==========================================
// Calendar Events Operations (Master Agenda)
// ==========================================
export function getEvents(): CalendarEvent[] {
  if (isRemoteStore) {
    startPublicSync();
    return remote.events.length > 0 ? remote.events : INITIAL_EVENTS;
  }
  return getItem<CalendarEvent[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
}

export function getEventById(id: string): CalendarEvent | undefined {
  return getEvents().find((e) => e.id === id);
}

export function addEvent(event: Omit<CalendarEvent, 'id' | 'createdAt'>, authorName: string): CalendarEvent {
  const newEvent: CalendarEvent = {
    ...event,
    id: isRemoteStore ? newRemoteId(COLLECTIONS.EVENTS) : `event-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  if (isRemoteStore) {
    remoteSet(COLLECTIONS.EVENTS, newEvent.id, withoutId(newEvent), 'Menambahkan agenda');
  } else {
    const updated = [newEvent, ...getEvents()].sort((a, b) => eventTime(a) - eventTime(b));
    setItem(STORAGE_KEYS.EVENTS, updated);
  }

  addAuditLog({
    userEmail: currentActorEmail(),
    userName: authorName,
    action: 'CREATE_EVENT',
    details: `Menambahkan agenda baru: "${event.title}" pada tanggal ${event.date} (${event.timeStart} WIT)`,
    category: 'EVENT',
  });

  return newEvent;
}

export function updateEvent(id: string, updates: Partial<CalendarEvent>, authorName: string): void {
  const current = getEvents();
  const index = current.findIndex((e) => e.id === id);
  if (index === -1) return;
  const old = current[index];

  if (isRemoteStore) {
    const rest: Partial<CalendarEvent> = { ...updates };
    delete rest.id;
    remoteUpdate(COLLECTIONS.EVENTS, id, rest, 'Memperbarui agenda');
  } else {
    const next = [...current];
    next[index] = { ...old, ...updates };
    setItem(STORAGE_KEYS.EVENTS, next);
  }

  addAuditLog({
    userEmail: currentActorEmail(),
    userName: authorName,
    action: 'UPDATE_EVENT',
    details: `Memperbarui agenda: "${old.title}"`,
    category: 'EVENT',
  });
}

export function deleteEvent(id: string, authorName: string): void {
  const current = getEvents();
  const target = current.find((e) => e.id === id);

  if (isRemoteStore) {
    remoteDelete(COLLECTIONS.EVENTS, id, 'Menghapus agenda');
  } else {
    setItem(STORAGE_KEYS.EVENTS, current.filter((e) => e.id !== id));
  }

  if (target) {
    addAuditLog({
      userEmail: currentActorEmail(),
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
  if (isRemoteStore) {
    startPublicSync();
    return remote.documents;
  }
  return getItem<FoundationDocument[]>(STORAGE_KEYS.DOCUMENTS, INITIAL_DOCUMENTS);
}

export function getDocumentById(id: string): FoundationDocument | undefined {
  return getDocuments().find((d) => d.id === id);
}

export function addDocument(docData: Omit<FoundationDocument, 'id' | 'lastUpdated'>, adminName: string): FoundationDocument {
  const newDoc: FoundationDocument = {
    ...docData,
    // Selalu boolean eksplisit: query publik memfilter isConfidential == false.
    isConfidential: Boolean(docData.isConfidential),
    id: isRemoteStore ? newRemoteId(COLLECTIONS.DOCUMENTS) : `doc-${Date.now()}`,
    lastUpdated: new Date().toISOString(),
    downloadsCount: docData.downloadsCount || 0,
  };

  if (isRemoteStore) {
    remoteSet(COLLECTIONS.DOCUMENTS, newDoc.id, withoutId(newDoc), 'Menambahkan dokumen');
  } else {
    setItem(STORAGE_KEYS.DOCUMENTS, [newDoc, ...getDocuments()]);
  }

  addAuditLog({
    userEmail: currentActorEmail(),
    userName: adminName,
    action: 'UPLOAD_DOCUMENT',
    details: `Menambahkan dokumen baru: "${docData.title}" (${docData.code || 'SOP'})`,
    category: 'DOCUMENT',
  });

  return newDoc;
}

export function updateDocument(id: string, updates: Partial<FoundationDocument>, adminName: string): void {
  const current = getDocuments();
  const index = current.findIndex((d) => d.id === id);
  if (index === -1) return;
  const old = current[index];

  const patch: Partial<FoundationDocument> = { ...updates, lastUpdated: new Date().toISOString() };
  delete patch.id;
  if ('isConfidential' in patch) patch.isConfidential = Boolean(patch.isConfidential);

  if (isRemoteStore) {
    remoteUpdate(COLLECTIONS.DOCUMENTS, id, patch, 'Memperbarui dokumen');
  } else {
    const next = [...current];
    next[index] = { ...old, ...patch };
    setItem(STORAGE_KEYS.DOCUMENTS, next);
  }

  addAuditLog({
    userEmail: currentActorEmail(),
    userName: adminName,
    action: 'UPDATE_DOCUMENT',
    details: `Memperbarui dokumen: "${old.title}" (${old.code})`,
    category: 'DOCUMENT',
  });
}

export function deleteDocument(id: string, adminName: string): void {
  const current = getDocuments();
  const target = current.find((d) => d.id === id);

  if (isRemoteStore) {
    remoteDelete(COLLECTIONS.DOCUMENTS, id, 'Menghapus dokumen');
  } else {
    setItem(STORAGE_KEYS.DOCUMENTS, current.filter((d) => d.id !== id));
  }

  if (target) {
    addAuditLog({
      userEmail: currentActorEmail(),
      userName: adminName,
      action: 'DELETE_DOCUMENT',
      details: `Menghapus dokumen: "${target.title}" (${target.code})`,
      category: 'DOCUMENT',
    });
  }
}

export function incrementDocDownload(id: string): void {
  if (isRemoteStore) {
    // Penghitung unduhan bukan data kritis — kegagalan cukup dicatat di konsol.
    updateDoc(doc(db, COLLECTIONS.DOCUMENTS, id), { downloadsCount: increment(1) }).catch((err) =>
      console.warn('[PORTAL REP] Gagal menambah hitungan unduhan:', err)
    );
    return;
  }
  const current = getDocuments();
  const index = current.findIndex((d) => d.id === id);
  if (index !== -1) {
    const next = [...current];
    next[index] = { ...next[index], downloadsCount: (next[index].downloadsCount || 0) + 1 };
    setItem(STORAGE_KEYS.DOCUMENTS, next);
  }
}

// ==========================================
// Executive Metrics Operations
// ==========================================
export function getAllExecutiveMetrics(): Record<MetricsPeriod, ExecutiveMetrics> {
  if (isRemoteStore) return remote.metrics;
  return getItem<Record<MetricsPeriod, ExecutiveMetrics>>(STORAGE_KEYS.METRICS, INITIAL_EXECUTIVE_METRICS);
}

export function getExecutiveMetrics(period: MetricsPeriod = 'TODAY'): ExecutiveMetrics {
  return getAllExecutiveMetrics()[period] || INITIAL_EXECUTIVE_METRICS[period];
}

export function updateExecutiveMetrics(period: MetricsPeriod, updates: Partial<ExecutiveMetrics>): void {
  const all = getAllExecutiveMetrics();
  const updated: ExecutiveMetrics = { ...all[period], ...updates, lastUpdated: new Date().toISOString() };

  if (isRemoteStore) {
    remoteSet(COLLECTIONS.METRICS, period, updated, 'Memperbarui metrik eksekutif');
  } else {
    setItem(STORAGE_KEYS.METRICS, { ...all, [period]: updated });
  }
}

// ==========================================
// Data awal
// ==========================================

/** Pulihkan seluruh data demo (hanya mode localStorage). */
export function resetToDefaults(): void {
  if (typeof window === 'undefined' || isRemoteStore) return;
  localStorage.setItem(STORAGE_KEYS.WHITELIST, JSON.stringify(INITIAL_WHITELIST));
  localStorage.setItem(STORAGE_KEYS.APPS, JSON.stringify(INITIAL_APPS));
  localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(INITIAL_NOTICES));
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_LOGS));
  localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(INITIAL_EVENTS));
  localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(INITIAL_DOCUMENTS));
  localStorage.setItem(STORAGE_KEYS.METRICS, JSON.stringify(INITIAL_EXECUTIVE_METRICS));
  localStorage.removeItem(STORAGE_KEYS.INFO);
  notify('ALL');
}

/**
 * Isi Firestore dengan data awal (modul aplikasi, info yayasan, dan konten contoh).
 * Metrik eksekutif TIDAK diisi: di mode Firestore metrik selalu diambil langsung dari
 * sub-aplikasi melalui /api/metrics, sehingga tidak ada angka contoh yang tersimpan.
 * Hanya mengisi koleksi yang masih KOSONG — tidak pernah menimpa data yang sudah ada.
 * Whitelist sengaja tidak diisi: karyawan didaftarkan manual oleh IT Admin.
 */
export async function seedInitialData(adminName: string): Promise<string[]> {
  if (!isRemoteStore) {
    resetToDefaults();
    return ['Data demo lokal dipulihkan ke kondisi awal.'];
  }

  const results: string[] = [];

  const seedCollection = async (name: string, label: string, items: { id: string }[]) => {
    const existing = await getDocs(query(collection(db, name), limit(1)));
    if (!existing.empty) {
      results.push(`${label}: dilewati (sudah berisi data)`);
      return;
    }
    const batch = writeBatch(db);
    items.forEach((item) => batch.set(doc(db, name, item.id), withoutId(item)));
    await batch.commit();
    results.push(`${label}: ${items.length} data ditambahkan`);
  };

  await seedCollection(COLLECTIONS.APPS, 'Modul aplikasi', INITIAL_APPS);
  await seedCollection(COLLECTIONS.NOTICES, 'Pengumuman', INITIAL_NOTICES);
  await seedCollection(COLLECTIONS.EVENTS, 'Agenda', INITIAL_EVENTS);
  await seedCollection(
    COLLECTIONS.DOCUMENTS,
    'Dokumen',
    INITIAL_DOCUMENTS.map((d) => ({ ...d, isConfidential: Boolean(d.isConfidential) }))
  );

  const infoRef = doc(db, COLLECTIONS.SETTINGS, FOUNDATION_DOC_ID);
  if ((await getDoc(infoRef)).exists()) {
    results.push('Informasi yayasan: dilewati (sudah ada)');
  } else {
    await setDoc(infoRef, INITIAL_FOUNDATION_INFO);
    results.push('Informasi yayasan: ditambahkan');
  }

  addAuditLog({
    userEmail: currentActorEmail(),
    userName: adminName,
    action: 'SEED_INITIAL_DATA',
    details: `Inisialisasi data awal Firestore — ${results.join('; ')}`,
    category: 'APP_CONFIG',
  });

  return results;
}
