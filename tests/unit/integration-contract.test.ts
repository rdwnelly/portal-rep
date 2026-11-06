import { describe, expect, it } from 'vitest';
import { EMPTY_SECTIONS, SOURCE_KEYS, validateSection } from '@/lib/integration-contract';

describe('validateSection (kontrak integrasi sub-aplikasi)', () => {
  it.each(SOURCE_KEYS)('nilai kosong bawaan %s memenuhi skemanya sendiri', (key) => {
    expect(validateSection(key, EMPTY_SECTIONS[key])).toBeNull();
  });

  it('menolak data kosong', () => {
    expect(validateSection('posGudang', null)).toBe('data kosong');
  });

  it('menolak field angka yang dikirim sebagai string', () => {
    const data = { ...EMPTY_SECTIONS.posGudang, dailySalesVolume: '90000' };
    expect(validateSection('posGudang', data)).toContain('dailySalesVolume');
  });

  it('menolak NaN / Infinity', () => {
    expect(validateSection('posGudang', { ...EMPTY_SECTIONS.posGudang, dailySalesVolume: NaN })).not.toBeNull();
    expect(validateSection('keuangan', { ...EMPTY_SECTIONS.keuangan, netCashFlow: Infinity })).not.toBeNull();
  });

  it('menolak lowStockAlerts yang bukan array', () => {
    expect(validateSection('posGudang', { ...EMPTY_SECTIONS.posGudang, lowStockAlerts: {} })).toContain('lowStockAlerts');
  });

  it('menolak field wajib yang hilang', () => {
    const { trendGuests: _omit, ...rest } = EMPTY_SECTIONS.reservasi;
    void _omit;
    expect(validateSection('reservasi', rest)).toContain('trendGuests');
  });
});
