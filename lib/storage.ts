'use client';

/**
 * Lapisan data PORTAL REP — link aplikasi & agenda.
 *
 * Dua backend dengan API yang sama:
 *  - Firestore (produksi / emulator): data dibaca melalui listener onSnapshot real-time ke cache
 *    di memori, sehingga getter tetap sinkron. Izin ditegakkan oleh firestore.rules:
 *    link aplikasi hanya bisa diubah IT_ADMIN, agenda bisa diubah siapa saja.
 *  - localStorage (mode demo, hanya pengembangan lokal tanpa konfigurasi Firebase).
 *
 * Setiap perubahan data memicu event `portal_rep_storage_update`; kegagalan penulisan memicu
 * `portal_rep_storage_error` agar UI dapat menampilkan pesan.
 */

import { collection, doc, onSnapshot, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db, isConfigured } from './firebase';
import type { AppItem, CalendarEvent, WhitelistedUser } from './types';
import { INITIAL_APPS, INITIAL_EVENTS, INITIAL_WHITELIST } from './seed-data';

/** true → data hidup di Firestore; false → data demo di localStorage. */
export const isRemoteStore = isConfigured;

export const STORAGE_UPDATE_EVENT = 'portal_rep_storage_update';
export const STORAGE_ERROR_EVENT = 'portal_rep_storage_error';

const STORAGE_KEYS = {
  WHITELIST: 'portal_rep_whitelist_v1',
  APPS: 'portal_rep_apps_v2',
  EVENTS: 'portal_rep_events_v1',
};

const COLLECTIONS = { APPS: 'apps', EVENTS: 'events' } as const;

/** Nilai untuk render server (SSR) & hidrasi. */
export const SSR_APPS: AppItem[] = INITIAL_APPS;
// Di produksi agenda TIDAK pernah diisi contoh: agenda bisa diedit publik, jadi agenda
// palsu akan terbaca sebagai sungguhan. Contoh hanya untuk mode demo lokal.
export const SSR_EVENTS: CalendarEvent[] = isRemoteStore ? [] : INITIAL_EVENTS;

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
      ? `${context} ditolak: isian tidak valid, atau aturan Firestore (firestore.rules) belum diterapkan di Firebase.`
      : `${context} gagal: ${(err as Error)?.message || 'kesalahan tidak diketahui'}`;
  window.dispatchEvent(new CustomEvent(STORAGE_ERROR_EVENT, { detail: { message } }));
}

function withoutId<T extends { id: string }>(item: T): Omit<T, 'id'> {
  const copy: Partial<T> = { ...item };
  delete copy.id;
  return copy as Omit<T, 'id'>;
}

const newRemoteId = (col: string) => doc(collection(db, col)).id;

/** Jalankan penulisan Firestore; selalu resolve (true = tersimpan), error dilaporkan ke UI. */
function attempt(context: string, write: () => Promise<unknown>): Promise<boolean> {
  return write().then(
    () => true,
    (err) => {
      reportError(context, err);
      return false;
    }
  );
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
const remote: { apps: AppItem[]; events: CalendarEvent[] } = { apps: [], events: [] };
const loaded = { apps: false, events: false };

const eventTime = (e: CalendarEvent) => new Date(`${e.date}T${e.timeStart || '00:00'}`).getTime();

/** Selesai saat snapshot pertama koleksi apps tiba — dibutuhkan sebelum menulis link. */
let resolveAppsReady: () => void = () => {};
const appsReady = new Promise<void>((resolve) => {
  resolveAppsReady = resolve;
});

let syncStarted = false;

/** Listener data publik. Aman dipanggil berkali-kali. */
function startSync(): void {
  if (!isRemoteStore || syncStarted || typeof window === 'undefined') return;
  syncStarted = true;

  onSnapshot(
    collection(db, COLLECTIONS.APPS),
    (snap) => {
      remote.apps = snap.docs
        .map((d) => ({ ...d.data(), id: d.id }) as AppItem)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      loaded.apps = true;
      resolveAppsReady();
      notify('apps');
    },
    (err) => {
      resolveAppsReady();
      reportError('Memuat daftar aplikasi', err);
    }
  );

  onSnapshot(
    collection(db, COLLECTIONS.EVENTS),
    (snap) => {
      remote.events = snap.docs
        .map((d) => ({ ...d.data(), id: d.id }) as CalendarEvent)
        .sort((a, b) => eventTime(a) - eventTime(b));
      loaded.events = true;
      notify('events');
    },
    (err) => reportError('Memuat agenda', err)
  );
}

// ==========================================
// Whitelist (hanya mode demo — di produksi dibaca langsung oleh auth-context)
// ==========================================
export function findWhitelistedUser(email: string): WhitelistedUser | undefined {
  const normalized = email.trim().toLowerCase();
  return getItem<WhitelistedUser[]>(STORAGE_KEYS.WHITELIST, INITIAL_WHITELIST).find(
    (u) => u.email.toLowerCase() === normalized && u.active
  );
}

// ==========================================
// Link aplikasi (ubah: khusus IT_ADMIN)
// ==========================================

/**
 * Daftar aplikasi. Selama database belum berisi link apa pun, daftar bawaan ditampilkan
 * agar beranda tidak pernah kosong.
 */
export function getAppsList(): AppItem[] {
  if (isRemoteStore) {
    startSync();
    return remote.apps.length > 0 ? remote.apps : INITIAL_APPS;
  }
  return getItem<AppItem[]>(STORAGE_KEYS.APPS, INITIAL_APPS);
}

/** true bila yang tampil adalah daftar bawaan (belum ada link tersimpan di database). */
export function isShowingDefaultApps(): boolean {
  return isRemoteStore && loaded.apps && remote.apps.length === 0;
}

/**
 * Daftar bawaan hanya tampilan — belum ada dokumennya di database. Sebelum perubahan
 * pertama, seluruh daftar bawaan disimpan dulu; kalau tidak, mengubah satu link bawaan
 * akan gagal ("dokumen tidak ditemukan") dan link bawaan lainnya ikut hilang dari tampilan.
 */
async function persistDefaultAppsIfNeeded(): Promise<boolean> {
  await appsReady;
  if (remote.apps.length > 0) return true;
  const batch = writeBatch(db);
  INITIAL_APPS.forEach((app) => batch.set(doc(db, COLLECTIONS.APPS, app.id), withoutId(app)));
  return attempt('Menyimpan daftar aplikasi bawaan', () => batch.commit());
}

export async function addAppItem(app: Omit<AppItem, 'id' | 'order'>): Promise<boolean> {
  const current = getAppsList();
  const order = Math.max(0, ...current.map((a) => a.order ?? 0)) + 1;

  if (!isRemoteStore) {
    setItem(STORAGE_KEYS.APPS, [...current, { ...app, id: `app-${Date.now()}`, order }]);
    return true;
  }
  if (!(await persistDefaultAppsIfNeeded())) return false;
  const id = newRemoteId(COLLECTIONS.APPS);
  return attempt('Menambahkan aplikasi', () => setDoc(doc(db, COLLECTIONS.APPS, id), { ...app, order }));
}

export async function updateAppItem(id: string, updates: Partial<AppItem>): Promise<boolean> {
  const current = getAppsList();
  const old = current.find((a) => a.id === id);
  if (!old) return false;
  const next: AppItem = { ...old, ...updates, id, lastUpdated: new Date().toISOString() };

  if (!isRemoteStore) {
    setItem(STORAGE_KEYS.APPS, current.map((a) => (a.id === id ? next : a)));
    return true;
  }
  if (!(await persistDefaultAppsIfNeeded())) return false;
  return attempt('Memperbarui aplikasi', () => setDoc(doc(db, COLLECTIONS.APPS, id), withoutId(next)));
}

export async function deleteAppItem(id: string): Promise<boolean> {
  if (!isRemoteStore) {
    setItem(STORAGE_KEYS.APPS, getAppsList().filter((a) => a.id !== id));
    return true;
  }
  if (!(await persistDefaultAppsIfNeeded())) return false;
  return attempt('Menghapus aplikasi', () => deleteDoc(doc(db, COLLECTIONS.APPS, id)));
}

// ==========================================
// Agenda (ubah: siapa saja)
// ==========================================
export function getEvents(): CalendarEvent[] {
  if (isRemoteStore) {
    startSync();
    return remote.events;
  }
  return getItem<CalendarEvent[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
}

/** false sampai agenda pertama kali selesai dimuat dari database. */
export function areEventsLoaded(): boolean {
  if (!isRemoteStore) return true;
  startSync();
  return loaded.events;
}

export async function addEvent(event: Omit<CalendarEvent, 'id' | 'createdAt'>): Promise<boolean> {
  const createdAt = new Date().toISOString();
  if (!isRemoteStore) {
    const created: CalendarEvent = { ...event, id: `event-${Date.now()}`, createdAt };
    setItem(STORAGE_KEYS.EVENTS, [...getEvents(), created].sort((a, b) => eventTime(a) - eventTime(b)));
    return true;
  }
  const id = newRemoteId(COLLECTIONS.EVENTS);
  return attempt('Menambahkan agenda', () => setDoc(doc(db, COLLECTIONS.EVENTS, id), { ...event, createdAt }));
}

/**
 * Simpan ulang seluruh agenda (bukan updateDoc sebagian): field opsional yang dikosongkan
 * di formulir — mis. jam selesai — benar-benar terhapus, tidak tertinggal nilai lamanya.
 */
export async function updateEvent(id: string, updates: Partial<CalendarEvent>): Promise<boolean> {
  const current = getEvents();
  const old = current.find((e) => e.id === id);
  if (!old) return false;
  const next: CalendarEvent = { ...old, ...updates, id, createdAt: old.createdAt };

  if (!isRemoteStore) {
    setItem(STORAGE_KEYS.EVENTS, current.map((e) => (e.id === id ? next : e)));
    return true;
  }
  return attempt('Memperbarui agenda', () => setDoc(doc(db, COLLECTIONS.EVENTS, id), withoutId(next)));
}

export async function deleteEvent(id: string): Promise<boolean> {
  if (!isRemoteStore) {
    setItem(STORAGE_KEYS.EVENTS, getEvents().filter((e) => e.id !== id));
    return true;
  }
  return attempt('Menghapus agenda', () => deleteDoc(doc(db, COLLECTIONS.EVENTS, id)));
}
