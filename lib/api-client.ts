'use client';

import { auth } from './firebase';

export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
  }
}

/** fetch ke Route Handler portal dengan ID token Firebase pengguna yang sedang login. */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Sesi login tidak ditemukan. Silakan masuk kembali.');

  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  const body = (await res.json().catch(() => ({}))) as T & { error?: string; code?: string };
  if (!res.ok) {
    throw new ApiError(body.error || `Permintaan gagal (HTTP ${res.status}).`, res.status, body.code);
  }
  return body;
}
