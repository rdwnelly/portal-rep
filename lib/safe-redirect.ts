import type { UserRole } from './types';

/** Halaman tujuan default setelah login: admin ke Panel Admin, selain itu ke Beranda. */
export function landingPathForRole(role: UserRole | undefined | null): string {
  return role === 'IT_ADMIN' ? '/dashboard/admin' : '/';
}

/**
 * Validasi tujuan redirect setelah login (?next=...). Hanya path internal portal yang diizinkan
 * untuk mencegah open redirect, mis. "//evil.com", "/\\evil.com", atau "https://evil.com".
 */
export function safeRedirectPath(next: string | null | undefined, fallback = '/'): string {
  if (!next || typeof next !== 'string') return fallback;
  if (!/^\/(?![\/\\])/.test(next)) return fallback;
  // Karakter kontrol/whitespace dapat dinormalisasi browser menjadi "//" → tolak.
  if (/[\u0000-\u001f\u007f\s]/.test(next)) return fallback;
  // Halaman login itu sendiri bukan tujuan yang masuk akal (bisa menjadi putaran).
  if (next === '/masuk' || next.startsWith('/masuk?') || next.startsWith('/dashboard/admin/login')) return fallback;
  return next;
}
