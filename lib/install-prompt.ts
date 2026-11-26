'use client';

/**
 * Penyimpan bersama untuk ajakan "Pasang aplikasi" (PWA).
 *
 * Chrome/Android hanya mengirim event `beforeinstallprompt` SEKALI per pemuatan halaman,
 * dan `prompt()`-nya hanya boleh dipanggil sekali. Event ditangkap di sini saat modul dimuat
 * (sedini mungkin), lalu notifikasi pasang & menu "Pasang di HP" memakai sumber yang sama —
 * kalau masing-masing menangkap sendiri, keduanya berebut satu event.
 *
 * iPhone/iPad (Safari) tidak punya event ini: pemasangan hanya lewat menu Bagikan → Tambah ke
 * Layar Utama, sehingga UI menampilkan petunjuk, bukan tombol.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // tahan banner bawaan browser; portal menampilkan ajakannya sendiri
    deferred = e as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    deferred = null;
    emit();
  });
}

export function subscribeInstall(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/** true bila browser siap menampilkan dialog pasang bawaan (Chrome/Edge/Samsung Internet). */
export const canPromptInstall = (): boolean => deferred !== null;

/** true bila portal baru saja dipasang di sesi ini. */
export const justInstalled = (): boolean => installed;

/** Tampilkan dialog pasang bawaan browser. */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  const event = deferred;
  if (!event) return 'unavailable';
  deferred = null; // prompt() hanya boleh dipanggil sekali
  emit();
  await event.prompt();
  const { outcome } = await event.userChoice;
  return outcome;
}

/** Portal sedang berjalan sebagai aplikasi terpasang (bukan di tab browser). */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** iPhone / iPad — termasuk iPadOS yang mengaku sebagai Mac. */
export function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

/** Perangkat HP/tablet (layar sentuh atau layar sempit). */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(pointer: coarse), (max-width: 768px)').matches ?? false;
}
