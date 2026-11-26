/**
 * Pengurai berkas iCalendar (.ics) kalender libur Indonesia milik Google.
 * Fungsi murni — tanpa jaringan — agar mudah diuji.
 */

export type HolidayType = 'LIBUR_NASIONAL' | 'CUTI_BERSAMA';

export interface Holiday {
  /** YYYY-MM-DD */
  date: string;
  name: string;
  type: HolidayType;
}

/** Baris panjang di .ics dilipat dengan baris baru + spasi/tab; satukan kembali. */
const unfold = (ics: string) => ics.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '');

const unescapeText = (v: string) =>
  v.replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\').trim();

const isoDate = (ymd: string) => `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;

function field(block: string, name: string): string | undefined {
  const m = block.match(new RegExp(`^${name}(?:;[^:\\n]*)?:(.*)$`, 'm'));
  return m ? m[1] : undefined;
}

/** Tanggal-tanggal yang dicakup acara: DTSTART sampai sebelum DTEND (all-day). */
function coveredDates(start: string, end?: string): string[] {
  const first = new Date(`${isoDate(start)}T00:00:00Z`);
  const last = end ? new Date(`${isoDate(end)}T00:00:00Z`) : new Date(first.getTime() + 86_400_000);
  const days: string[] = [];
  for (let t = first.getTime(); t < last.getTime() && days.length < 14; t += 86_400_000) {
    days.push(new Date(t).toISOString().slice(0, 10));
  }
  return days.length ? days : [isoDate(start)];
}

/**
 * Ambil hari libur nasional & cuti bersama. Entri berstatus "Perayaan" (mis. 1 Ramadan,
 * Malam Tahun Baru, Diwali) dibuang — itu bukan hari libur resmi.
 */
export function parseHolidayIcs(ics: string): Holiday[] {
  const text = unfold(ics);
  const seen = new Set<string>();
  const result: Holiday[] = [];

  for (const [, block] of text.matchAll(/BEGIN:VEVENT\n([\s\S]*?)END:VEVENT/g)) {
    const start = field(block, 'DTSTART')?.trim();
    const summary = field(block, 'SUMMARY');
    const description = unescapeText(field(block, 'DESCRIPTION') ?? '');
    if (!start || !/^\d{8}$/.test(start) || !summary) continue;
    if (!description.toLowerCase().startsWith('hari libur nasional')) continue;

    const name = unescapeText(summary);
    const type: HolidayType = /^cuti bersama/i.test(name) ? 'CUTI_BERSAMA' : 'LIBUR_NASIONAL';
    const end = field(block, 'DTEND')?.trim();

    for (const date of coveredDates(start, end && /^\d{8}$/.test(end) ? end : undefined)) {
      const key = `${date}|${name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({ date, name, type });
    }
  }

  return result.sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
}
