// Uji Firestore Security Rules terhadap emulator.
// Jalankan: npm run test:rules   (membutuhkan Java untuk Firestore Emulator)
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';

const ADMIN = 'admin@rep.test';
const INACTIVE = 'mantan@rep.test';
const NOT_ADMIN = 'staf@rep.test';

let env;

const whitelistEntry = (email, role, active = true) => ({
  email,
  name: email.split('@')[0],
  role,
  roleTitle: role,
  department: 'Uji',
  active,
  addedAt: '2026-11-27T00:00:00Z',
  addedBy: 'seed',
});

/** Konteks pengguna login. verified=false meniru akun Email/Password yang belum diverifikasi. */
const as = (email, verified = true) =>
  env.authenticatedContext(`uid-${email}`, { email, email_verified: verified }).firestore();
const anon = () => env.unauthenticatedContext().firestore();

const validEvent = {
  title: 'Pentas Tari Yospan',
  description: 'Latihan terbuka untuk umum.',
  date: '2026-12-05',
  timeStart: '19:00',
  timeEnd: '21:00',
  location: 'Panggung Utama Sanggar Tari REP',
  category: 'CULTURE_EVENT',
  status: 'UPCOMING',
  organizer: 'Sanggar REP',
  createdAt: '2026-11-27T00:00:00Z',
  createdBy: 'Pengunjung',
};

const validApp = {
  title: 'Aplikasi Kasir (POS)',
  shortCode: 'POS',
  description: 'Kasir Yaswar Cafe',
  category: 'GUDANG_POS',
  iconName: 'ShoppingBag',
  url: 'https://rep-pos-app.vercel.app',
  status: 'ONLINE',
  allowedRoles: [],
  badgeText: 'POS',
  colorTheme: { from: 'a', to: 'b', accent: 'c', border: 'd' },
  order: 1,
};

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-portal-rep',
    firestore: { rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8') },
  });
});

after(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'whitelist', ADMIN), whitelistEntry(ADMIN, 'IT_ADMIN'));
    await setDoc(doc(db, 'whitelist', INACTIVE), whitelistEntry(INACTIVE, 'IT_ADMIN', false));
    await setDoc(doc(db, 'whitelist', NOT_ADMIN), whitelistEntry(NOT_ADMIN, 'OPERATIONAL'));
    await setDoc(doc(db, 'apps', 'a1'), validApp);
    await setDoc(doc(db, 'events', 'e1'), validEvent);
    // Data fitur lama yang mungkin masih tersisa di database produksi.
    await setDoc(doc(db, 'notices', 'n1'), { title: 'Lama' });
    await setDoc(doc(db, 'auditLogs', 'l1'), { action: 'X' });
  });
});

describe('agenda — terbuka untuk siapa saja tanpa login', () => {
  test('pengunjung anonim boleh membaca agenda', async () => {
    await assertSucceeds(getDocs(collection(anon(), 'events')));
  });

  test('pengunjung anonim boleh menambah agenda yang valid', async () => {
    await assertSucceeds(setDoc(doc(anon(), 'events', 'baru'), validEvent));
  });

  test('pengunjung anonim boleh mengubah agenda', async () => {
    await assertSucceeds(updateDoc(doc(anon(), 'events', 'e1'), { title: 'Judul baru', status: 'CANCELLED' }));
  });

  test('pengunjung anonim boleh menghapus agenda', async () => {
    await assertSucceeds(deleteDoc(doc(anon(), 'events', 'e1')));
  });
});

describe('agenda — validasi menolak isian sampah', () => {
  const bad = (patch) => setDoc(doc(anon(), 'events', 'x'), { ...validEvent, ...patch });

  test('field tambahan di luar daftar ditolak (mis. sisipan tautan/skrip)', async () => {
    await assertFails(bad({ html: '<script>alert(1)</script>' }));
    await assertFails(bad({ attachments: [{ name: 'a', url: 'https://spam.example' }] }));
  });

  test('judul kosong atau terlalu panjang ditolak', async () => {
    await assertFails(bad({ title: '' }));
    await assertFails(bad({ title: 'x'.repeat(151) }));
  });

  test('deskripsi raksasa ditolak', async () => {
    await assertFails(bad({ description: 'x'.repeat(2001) }));
  });

  test('format tanggal & jam wajib benar', async () => {
    await assertFails(bad({ date: '5 Desember 2026' }));
    await assertFails(bad({ timeStart: 'malam' }));
    await assertFails(bad({ timeEnd: '25:99:00' }));
  });

  test('kategori & status di luar daftar ditolak', async () => {
    await assertFails(bad({ category: 'SPAM' }));
    await assertFails(bad({ status: 'HACKED' }));
  });

  test('field wajib tidak boleh hilang', async () => {
    const withoutLocation = { ...validEvent };
    delete withoutLocation.location;
    await assertFails(setDoc(doc(anon(), 'events', 'x'), withoutLocation));
  });

  test('perubahan yang merusak dokumen ditolak', async () => {
    await assertFails(updateDoc(doc(anon(), 'events', 'e1'), { date: 'besok' }));
  });
});

describe('link aplikasi — hanya IT_ADMIN', () => {
  test('pengunjung anonim boleh membaca link aplikasi', async () => {
    await assertSucceeds(getDocs(collection(anon(), 'apps')));
  });

  test('pengunjung anonim tidak boleh mengubah atau menghapus link', async () => {
    await assertFails(updateDoc(doc(anon(), 'apps', 'a1'), { url: 'https://phishing.example' }));
    await assertFails(deleteDoc(doc(anon(), 'apps', 'a1')));
  });

  test('IT_ADMIN boleh menambah, mengubah, dan menghapus link', async () => {
    await assertSucceeds(setDoc(doc(as(ADMIN), 'apps', 'a2'), validApp));
    await assertSucceeds(updateDoc(doc(as(ADMIN), 'apps', 'a1'), { url: 'https://pos-baru.vercel.app' }));
    await assertSucceeds(deleteDoc(doc(as(ADMIN), 'apps', 'a1')));
  });

  test('akun login yang bukan IT_ADMIN tidak boleh mengubah link', async () => {
    await assertFails(updateDoc(doc(as(NOT_ADMIN), 'apps', 'a1'), { url: 'https://x.vercel.app' }));
  });

  test('admin yang dinonaktifkan atau belum terverifikasi kehilangan hak', async () => {
    await assertFails(updateDoc(doc(as(INACTIVE), 'apps', 'a1'), { url: 'https://x.vercel.app' }));
    await assertFails(updateDoc(doc(as(ADMIN, false), 'apps', 'a1'), { url: 'https://x.vercel.app' }));
  });

  test('link harus berupa URL http/https (cegah javascript:)', async () => {
    await assertFails(updateDoc(doc(as(ADMIN), 'apps', 'a1'), { url: 'javascript:alert(1)' }));
  });
});

describe('whitelist — hanya lewat Firebase Console', () => {
  test('pengguna boleh membaca entri whitelist miliknya sendiri saja', async () => {
    await assertSucceeds(getDoc(doc(as(ADMIN), 'whitelist', ADMIN)));
    await assertFails(getDoc(doc(as(NOT_ADMIN), 'whitelist', ADMIN)));
    await assertFails(getDocs(collection(as(ADMIN), 'whitelist')));
  });

  test('tidak ada yang bisa menulis whitelist dari aplikasi, termasuk admin', async () => {
    await assertFails(setDoc(doc(as(ADMIN), 'whitelist', 'baru@rep.test'), whitelistEntry('baru@rep.test', 'IT_ADMIN')));
    await assertFails(setDoc(doc(anon(), 'whitelist', 'saya@rep.test'), whitelistEntry('saya@rep.test', 'IT_ADMIN')));
  });
});

describe('koleksi fitur lama tertutup', () => {
  test('pengumuman & audit log lama tidak bisa dibaca maupun ditulis', async () => {
    await assertFails(getDoc(doc(anon(), 'notices', 'n1')));
    await assertFails(getDoc(doc(as(ADMIN), 'auditLogs', 'l1')));
    await assertFails(setDoc(doc(as(ADMIN), 'notices', 'n2'), { title: 'x' }));
  });
});
