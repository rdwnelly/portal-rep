import { describe, expect, it } from 'vitest';
import { parseHolidayIcs } from '@/lib/holidays-ics';

/** Potongan ASLI dari kalender libur Indonesia milik Google (format, lipatan baris, dan escape-nya). */
const event = (start: string, end: string, summary: string, description: string) =>
  [
    'BEGIN:VEVENT',
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    'DTSTAMP:20261126T181538Z',
    `UID:${start}_x@google.com`,
    'CLASS:PUBLIC',
    description,
    'STATUS:CONFIRMED',
    `SUMMARY:${summary}`,
    'TRANSP:TRANSPARENT',
    'END:VEVENT',
  ].join('\n');

const ics = [
  'BEGIN:VCALENDAR',
  'PRODID:-//Google Inc//Google Calendar 70.9054//EN',
  event('20260101', '20260102', 'Hari Tahun Baru', 'DESCRIPTION:Hari libur nasional'),
  event('20260216', '20260217', 'Cuti Bersama Tahun Baru Imlek', 'DESCRIPTION:Hari libur nasional'),
  event(
    '20260219',
    '20260220',
    '1 Ramadan',
    'DESCRIPTION:Perayaan\\nUntuk menyembunyikan kalender perayaan\\, buka Setelan\n  Google Kalender > Hari libur di Indonesia'
  ),
  event('20260321', '20260322', 'Hari Idul Fitri', 'DESCRIPTION:Hari libur nasional'),
  'END:VCALENDAR',
].join('\n');

describe('parseHolidayIcs', () => {
  it('mengambil libur nasional & cuti bersama, urut tanggal', () => {
    expect(parseHolidayIcs(ics)).toEqual([
      { date: '2026-01-01', name: 'Hari Tahun Baru', type: 'LIBUR_NASIONAL' },
      { date: '2026-02-16', name: 'Cuti Bersama Tahun Baru Imlek', type: 'CUTI_BERSAMA' },
      { date: '2026-03-21', name: 'Hari Idul Fitri', type: 'LIBUR_NASIONAL' },
    ]);
  });

  it('membuang entri "Perayaan" — bukan hari libur resmi', () => {
    expect(parseHolidayIcs(ics).some((h) => h.name === '1 Ramadan')).toBe(false);
  });

  it('menangani akhir baris CRLF sesuai standar iCalendar', () => {
    expect(parseHolidayIcs(ics.replace(/\n/g, '\r\n'))).toHaveLength(3);
  });

  it('acara beberapa hari dipecah per tanggal', () => {
    const multi = `BEGIN:VCALENDAR\n${event('20260320', '20260323', 'Cuti Bersama Idul Fitri', 'DESCRIPTION:Hari libur nasional')}\nEND:VCALENDAR`;
    expect(parseHolidayIcs(multi).map((h) => h.date)).toEqual(['2026-03-20', '2026-03-21', '2026-03-22']);
  });

  it('isian rusak diabaikan tanpa melempar error', () => {
    expect(parseHolidayIcs('bukan kalender')).toEqual([]);
    expect(parseHolidayIcs('BEGIN:VEVENT\nSUMMARY:Tanpa tanggal\nEND:VEVENT')).toEqual([]);
  });
});
