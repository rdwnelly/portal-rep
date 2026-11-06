'use client';

import { useSyncExternalStore } from 'react';
import { STORAGE_UPDATE_EVENT } from './storage';

// Cache per kunci: snapshot hanya dibangun ulang saat data berubah → referensi stabil.
const cache = new Map<string, unknown>();
const readers = new Map<string, () => unknown>();

function subscribe(callback: () => void) {
  const handler = () => {
    readers.forEach((read, key) => cache.set(key, read()));
    callback();
  };
  window.addEventListener(STORAGE_UPDATE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(STORAGE_UPDATE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

/**
 * Baca data dari lapisan storage secara reaktif (lokal maupun Firestore real-time).
 * `serverValue` dipakai saat render server & hidrasi agar tidak terjadi mismatch.
 */
export function useStoreValue<T>(key: string, read: () => T, serverValue: T): T {
  readers.set(key, read);
  return useSyncExternalStore(
    subscribe,
    () => {
      if (!cache.has(key)) cache.set(key, read());
      return cache.get(key) as T;
    },
    () => serverValue
  );
}
