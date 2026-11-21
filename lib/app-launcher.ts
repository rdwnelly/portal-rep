'use client';

import type { AppItem } from './types';
import { auth } from './firebase';
import { apiFetch, ApiError } from './api-client';
import { isRemoteStore, STORAGE_ERROR_EVENT } from './storage';
import { SOURCE_APP_IDS, SourceKey } from './integration-contract';

const sourceKeyForApp = (appId: string): SourceKey | undefined => {
  if (appId === 'app-pos' || appId === 'app-omg' || appId === 'app-pos-omg') return 'posGudang';
  return (Object.entries(SOURCE_APP_IDS) as [SourceKey, string][]).find(([, id]) => id === appId)?.[0];
};

const notify = (message: string) =>
  window.dispatchEvent(new CustomEvent(STORAGE_ERROR_EVENT, { detail: { message } }));

/**
 * Buka sub-aplikasi. Bila staf sedang login dan aplikasinya mendukung SSO, staf langsung masuk
 * tanpa login ulang; selain itu (atau bila SSO gagal) aplikasi dibuka seperti biasa.
 * WAJIB dipanggil langsung dari handler klik agar tab baru tidak diblokir browser.
 */
export async function launchApp(app: AppItem): Promise<void> {
  const key = sourceKeyForApp(app.id);
  if (!key || !isRemoteStore || !auth.currentUser) {
    window.open(app.url, '_blank', 'noopener,noreferrer');
    return;
  }

  // Buka tab secara sinkron (sebelum await) agar tidak dianggap popup oleh browser.
  const tab = window.open('about:blank', '_blank');
  if (tab) tab.opener = null;
  const go = (url: string) => {
    if (tab && !tab.closed) tab.location.href = url;
    else window.open(url, '_blank', 'noopener,noreferrer');
  };

  try {
    const { url } = await apiFetch<{ url: string }>(`/api/sso/${key}`, { method: 'POST' });
    go(url);
  } catch (err) {
    go(app.url);
    const code = err instanceof ApiError ? err.code : undefined;
    if (code !== 'NOT_CONFIGURED') {
      notify(`Masuk otomatis ke ${app.title} tidak tersedia: ${(err as Error).message} Halaman login aplikasi dibuka.`);
    }
  }
}
