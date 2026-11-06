import { describe, expect, it } from 'vitest';
import { safeRedirectPath } from '@/lib/safe-redirect';

describe('safeRedirectPath (anti open-redirect setelah login)', () => {
  it.each(['/eksekutif', '/dashboard/notices?notice=abc', '/'])('menerima path internal %s', (path) => {
    expect(safeRedirectPath(path)).toBe(path);
  });

  it.each([
    ['//evil.example.com', 'protocol-relative'],
    ['/\\evil.example.com', 'backslash'],
    ['https://evil.example.com', 'URL absolut'],
    ['javascript:alert(1)', 'skema javascript'],
    ['/\t/evil.example.com', 'karakter kontrol'],
    ['evil', 'path relatif'],
    ['', 'kosong'],
  ])('menolak %s (%s)', (path) => {
    expect(safeRedirectPath(path)).toBe('/dashboard/admin');
  });

  it('memakai fallback bila parameter tidak ada', () => {
    expect(safeRedirectPath(null, '/')).toBe('/');
  });
});
