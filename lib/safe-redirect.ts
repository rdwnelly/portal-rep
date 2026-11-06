/**
 * Validasi tujuan redirect setelah login (?next=...). Hanya path internal portal yang diizinkan
 * untuk mencegah open redirect, mis. "//evil.com", "/\\evil.com", atau "https://evil.com".
 */
export function safeRedirectPath(next: string | null | undefined, fallback = '/dashboard/admin'): string {
  if (!next || typeof next !== 'string') return fallback;
  if (!/^\/(?![\/\\])/.test(next)) return fallback;
  // Karakter kontrol/whitespace dapat dinormalisasi browser menjadi "//" → tolak.
  if (/[\u0000-\u001f\u007f\s]/.test(next)) return fallback;
  return next;
}
