import { NextResponse } from 'next/server';
import { parseHolidayIcs } from '@/lib/holidays-ics';

/**
 * GET /api/libur?year=2026
 *
 * Hari libur nasional & cuti bersama Indonesia dari kalender publik Google.
 * Diambil di server karena Google tidak mengizinkan berkas .ics dibaca langsung dari browser.
 * Data hulu disimpan di cache 1 hari; respons sukses juga di-cache CDN.
 *
 * Bila Google tak terjangkau, route menjawab 502 dan UI menulis "data libur belum tersedia"
 * — tidak pernah mengarang tanggal libur.
 */
const SOURCE =
  'https://calendar.google.com/calendar/ical/id.indonesian%23holiday%40group.v.calendar.google.com/public/basic.ics';

export async function GET(request: Request) {
  const yearParam = new URL(request.url).searchParams.get('year') ?? '';
  const year = /^\d{4}$/.test(yearParam) ? Number(yearParam) : new Date().getFullYear();

  try {
    const res = await fetch(SOURCE, { next: { revalidate: 86_400 } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const holidays = parseHolidayIcs(await res.text()).filter((h) => h.date.startsWith(`${year}-`));

    return NextResponse.json(
      { year, source: 'Kalender libur nasional Indonesia (Google)', holidays },
      { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } }
    );
  } catch (err) {
    console.error('[api/libur] gagal mengambil kalender libur:', err);
    return NextResponse.json(
      { year, holidays: [], error: 'Data libur nasional belum dapat dimuat.' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
