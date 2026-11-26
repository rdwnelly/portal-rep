import { describe, expect, it } from 'vitest';
import { landingPathForRole, safeRedirectPath } from '@/lib/safe-redirect';

describe('safeRedirectPath (anti open-redirect setelah login)', () => {
  it.each(['/eksekutif', '/apps', '/'])('menerima path internal %s', (path) => {
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
    expect(safeRedirectPath(path)).toBe('/');
  });

  it.each(['/masuk', '/masuk?next=%2Fapps', '/dashboard/admin/login'])(
    'menolak halaman login itu sendiri (%s) agar tidak berputar',
    (path) => {
      expect(safeRedirectPath(path, '/apps')).toBe('/apps');
    },
  );

  it('memakai fallback bila parameter tidak ada', () => {
    expect(safeRedirectPath(null, '/dashboard/admin')).toBe('/dashboard/admin');
  });
});

describe('landingPathForRole (tujuan default sesuai kewenangan)', () => {
  it('IT_ADMIN mendarat di panel admin', () => {
    expect(landingPathForRole('IT_ADMIN')).toBe('/dashboard/admin');
  });

  it.each(['EXECUTIVE', 'OPERATIONAL', 'FINANCE_WAREHOUSE', 'UNAUTHORIZED', null, undefined] as const)(
    'role %s mendarat di beranda (bukan layar akses terbatas)',
    (role) => {
      expect(landingPathForRole(role)).toBe('/');
    },
  );
});
