'use client';

/**
 * Notifikasi push (Firebase Cloud Messaging) untuk pengumuman.
 * Membutuhkan: NEXT_PUBLIC_FIREBASE_VAPID_KEY (Firebase Console → Project settings → Cloud
 * Messaging → Web Push certificates) dan service worker /sw.js (aktif di build produksi).
 */
import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { app, db } from './firebase';
import { apiFetch } from './api-client';
import { isRemoteStore, noticeSaved, STORAGE_ERROR_EVENT } from './storage';
import type { NoticeItem, UserProfile } from './types';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
const TOKEN_KEY = 'portal_rep_push_token';

export type PushState = 'unavailable' | 'default' | 'granted' | 'denied';

/** Status izin notifikasi di perangkat ini (tanpa memicu prompt). */
export function getPushState(): PushState {
  if (
    typeof window === 'undefined' ||
    !isRemoteStore ||
    !VAPID_KEY ||
    !('Notification' in window) ||
    !('serviceWorker' in navigator) ||
    process.env.NODE_ENV !== 'production'
  ) {
    return 'unavailable';
  }
  return Notification.permission as PushState;
}

/** Minta izin & daftarkan perangkat ini untuk menerima notifikasi pengumuman. */
export async function enablePush(user: UserProfile): Promise<PushState> {
  if (getPushState() === 'unavailable' || !(await isSupported())) return 'unavailable';

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission as PushState;

  const registration = await navigator.serviceWorker.ready;
  const token = await getToken(getMessaging(app), { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
  await setDoc(doc(db, 'pushTokens', token), {
    email: user.email.toLowerCase(),
    role: user.role,
    userAgent: navigator.userAgent.slice(0, 300),
    updatedAt: new Date().toISOString(),
  });
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* penyimpanan lokal tidak tersedia — token tetap terdaftar */
  }
  return 'granted';
}

/** Hapus pendaftaran perangkat ini (dipanggil saat logout agar notifikasi tidak salah alamat). */
export async function unregisterPush(): Promise<void> {
  let token: string | null = null;
  try {
    token = localStorage.getItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    return;
  }
  if (token && isRemoteStore) {
    await deleteDoc(doc(db, 'pushTokens', token)).catch(() => undefined);
  }
}

export interface PushResult {
  recipients: number;
  sent: number;
  failed: number;
}

/** Kirim push untuk sebuah pengumuman (pimpinan/IT). Menunggu pengumuman tersimpan dahulu. */
export async function sendNoticePush(noticeId: string, onlyUnread = false): Promise<PushResult> {
  if (!(await noticeSaved(noticeId))) throw new Error('Pengumuman belum tersimpan.');
  return apiFetch<PushResult>('/api/notify', { method: 'POST', body: JSON.stringify({ noticeId, onlyUnread }) });
}

/** Pengumuman MENDESAK otomatis dikirim sebagai push setelah diterbitkan. */
export function pushIfUrgent(notice: Pick<NoticeItem, 'id' | 'priority'>): void {
  if (!isRemoteStore || notice.priority !== 'URGENT') return;
  sendNoticePush(notice.id).catch((err: Error) =>
    window.dispatchEvent(
      new CustomEvent(STORAGE_ERROR_EVENT, { detail: { message: `Notifikasi push gagal dikirim: ${err.message}` } })
    )
  );
}
