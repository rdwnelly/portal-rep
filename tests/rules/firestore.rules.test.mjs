// Uji Firestore Security Rules terhadap emulator.
// Jalankan: npm run test:rules   (membutuhkan Java untuk Firestore Emulator)
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

const ADMIN = 'admin@rep.test';
const EXEC = 'ketua@rep.test';
const STAFF = 'frontdesk@rep.test';
const INACTIVE = 'mantan@rep.test';
const OUTSIDER = 'tamu@gmail.com';

let env;

const staffEntry = (email, role, active = true) => ({
  email,
  name: email.split('@')[0],
  role,
  roleTitle: role,
  department: 'Uji',
  active,
  addedAt: '2026-11-06T00:00:00Z',
  addedBy: 'seed',
});

/** Konteks pengguna login. verified=false meniru akun Email/Password yang belum diverifikasi. */
const as = (email, verified = true) =>
  env.authenticatedContext(`uid-${email}`, { email, email_verified: verified }).firestore();
const anon = () => env.unauthenticatedContext().firestore();

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
    await setDoc(doc(db, 'whitelist', ADMIN), staffEntry(ADMIN, 'IT_ADMIN'));
    await setDoc(doc(db, 'whitelist', EXEC), staffEntry(EXEC, 'EXECUTIVE'));
    await setDoc(doc(db, 'whitelist', STAFF), staffEntry(STAFF, 'OPERATIONAL'));
    await setDoc(doc(db, 'whitelist', INACTIVE), staffEntry(INACTIVE, 'IT_ADMIN', false));
    await setDoc(doc(db, 'notices', 'n1'), { title: 'Halo', createdAt: '2026-11-01' });
    await setDoc(doc(db, 'documents', 'public'), { title: 'SOP', isConfidential: false, downloadsCount: 0 });
    await setDoc(doc(db, 'documents', 'secret'), { title: 'Akta', isConfidential: true, downloadsCount: 0 });
    await setDoc(doc(db, 'metrics', 'TODAY'), { period: 'TODAY' });
    await setDoc(doc(db, 'accessRequests', 'r1'), { name: 'A', email: 'a@b.co', status: 'PENDING' });
  });
});

const validRequest = {
  name: 'Samuel',
  email: 'samuel@gmail.com',
  department: 'Frontdesk',
  reason: 'Butuh akses reservasi',
  requestedAt: '2026-11-06T00:00:00Z',
  status: 'PENDING',
};

describe('konten publik', () => {
  test('pengunjung anonim boleh membaca pengumuman', async () => {
    await assertSucceeds(getDoc(doc(anon(), 'notices', 'n1')));
  });

  test('pengunjung anonim tidak boleh menulis pengumuman', async () => {
    await assertFails(setDoc(doc(anon(), 'notices', 'x'), { title: 'spam' }));
  });

  test('staf operasional tidak boleh menulis pengumuman', async () => {
    await assertFails(setDoc(doc(as(STAFF), 'notices', 'x'), { title: 'x' }));
  });

  test('pimpinan boleh menulis pengumuman', async () => {
    await assertSucceeds(setDoc(doc(as(EXEC), 'notices', 'x'), { title: 'Instruksi' }));
  });

  test('hanya IT_ADMIN yang boleh mengubah modul aplikasi', async () => {
    await assertFails(setDoc(doc(as(EXEC), 'apps', 'a'), { title: 'x' }));
    await assertSucceeds(setDoc(doc(as(ADMIN), 'apps', 'a'), { title: 'x' }));
  });
});

describe('jalur pintas login lama tertutup', () => {
  test('email berisi kata "admin" tanpa whitelist tidak mendapat hak admin', async () => {
    await assertFails(setDoc(doc(as('superadmin@evil.com'), 'apps', 'a'), { title: 'x' }));
  });

  test('akun dengan email pimpinan yang BELUM diverifikasi ditolak', async () => {
    await assertFails(setDoc(doc(as(EXEC, false), 'notices', 'x'), { title: 'palsu' }));
    await assertFails(getDoc(doc(as(EXEC, false), 'documents', 'secret')));
  });

  test('akun whitelist yang dinonaktifkan kehilangan seluruh hak', async () => {
    await assertFails(setDoc(doc(as(INACTIVE), 'apps', 'a'), { title: 'x' }));
    await assertFails(getDoc(doc(as(INACTIVE), 'documents', 'secret')));
  });
});

describe('dokumen', () => {
  test('anonim boleh membaca dokumen non-rahasia, tidak boleh yang rahasia', async () => {
    await assertSucceeds(getDoc(doc(anon(), 'documents', 'public')));
    await assertFails(getDoc(doc(anon(), 'documents', 'secret')));
  });

  test('anonim boleh query dokumen dengan filter isConfidential == false', async () => {
    await assertSucceeds(getDocs(query(collection(anon(), 'documents'), where('isConfidential', '==', false))));
  });

  test('anonim tidak boleh query seluruh koleksi dokumen', async () => {
    await assertFails(getDocs(collection(anon(), 'documents')));
  });

  test('staf boleh membaca dokumen rahasia', async () => {
    await assertSucceeds(getDoc(doc(as(STAFF), 'documents', 'secret')));
    await assertSucceeds(getDocs(collection(as(STAFF), 'documents')));
  });

  test('penghitung unduhan hanya boleh +1, field lain tidak', async () => {
    await assertSucceeds(updateDoc(doc(anon(), 'documents', 'public'), { downloadsCount: increment(1) }));
    await assertFails(updateDoc(doc(anon(), 'documents', 'public'), { downloadsCount: 999 }));
    await assertFails(updateDoc(doc(anon(), 'documents', 'public'), { downloadsCount: increment(1), title: 'x' }));
    await assertFails(updateDoc(doc(anon(), 'documents', 'secret'), { downloadsCount: increment(1) }));
  });

  test('staf operasional tidak boleh mengubah dokumen', async () => {
    await assertFails(updateDoc(doc(as(STAFF), 'documents', 'public'), { title: 'x', isConfidential: false }));
  });
});

describe('whitelist (sumber role)', () => {
  test('pengguna boleh membaca entri whitelist miliknya sendiri saja', async () => {
    await assertSucceeds(getDoc(doc(as(STAFF), 'whitelist', STAFF)));
    await assertFails(getDoc(doc(as(STAFF), 'whitelist', ADMIN)));
    await assertFails(getDocs(collection(as(STAFF), 'whitelist')));
  });

  test('pimpinan boleh melihat daftar staf (untuk status baca), tetapi tidak mengubahnya', async () => {
    await assertSucceeds(getDocs(collection(as(EXEC), 'whitelist')));
    await assertFails(updateDoc(doc(as(EXEC), 'whitelist', STAFF), { active: false }));
  });

  test('orang luar dapat mengecek dirinya (hasil: tidak terdaftar)', async () => {
    await assertSucceeds(getDoc(doc(as(OUTSIDER), 'whitelist', OUTSIDER)));
  });

  test('staf tidak bisa mendaftarkan / menaikkan role dirinya sendiri', async () => {
    await assertFails(setDoc(doc(as(OUTSIDER), 'whitelist', OUTSIDER), staffEntry(OUTSIDER, 'IT_ADMIN')));
    await assertFails(updateDoc(doc(as(STAFF), 'whitelist', STAFF), { role: 'IT_ADMIN' }));
  });

  test('pimpinan boleh menambah staf biasa, tidak boleh menambah IT_ADMIN/EXECUTIVE', async () => {
    const e = 'baru@rep.test';
    await assertSucceeds(setDoc(doc(as(EXEC), 'whitelist', e), staffEntry(e, 'OPERATIONAL')));
    const e2 = 'baru2@rep.test';
    await assertFails(setDoc(doc(as(EXEC), 'whitelist', e2), staffEntry(e2, 'IT_ADMIN')));
  });

  test('pimpinan tidak boleh mengubah entri yang sudah ada', async () => {
    await assertFails(setDoc(doc(as(EXEC), 'whitelist', STAFF), staffEntry(STAFF, 'FINANCE_WAREHOUSE')));
  });

  test('ID dokumen whitelist wajib sama dengan email', async () => {
    await assertFails(setDoc(doc(as(ADMIN), 'whitelist', 'lain@rep.test'), staffEntry('beda@rep.test', 'OPERATIONAL')));
  });

  test('admin boleh mengubah role staf lain', async () => {
    await assertSucceeds(updateDoc(doc(as(ADMIN), 'whitelist', STAFF), { role: 'FINANCE_WAREHOUSE' }));
  });

  test('admin tidak bisa menonaktifkan / menurunkan / menghapus dirinya sendiri', async () => {
    await assertFails(updateDoc(doc(as(ADMIN), 'whitelist', ADMIN), { active: false }));
    await assertFails(updateDoc(doc(as(ADMIN), 'whitelist', ADMIN), { role: 'OPERATIONAL' }));
    await assertFails(deleteDoc(doc(as(ADMIN), 'whitelist', ADMIN)));
    await assertSucceeds(updateDoc(doc(as(ADMIN), 'whitelist', ADMIN), { name: 'Nama Baru' }));
  });
});

describe('permohonan akses', () => {
  test('anonim boleh mengirim permohonan yang valid', async () => {
    await assertSucceeds(setDoc(doc(anon(), 'accessRequests', 'new'), validRequest));
  });

  test('permohonan berisi password ditolak', async () => {
    await assertFails(setDoc(doc(anon(), 'accessRequests', 'new'), { ...validRequest, proposedPassword: 'rahasia' }));
  });

  test('permohonan yang langsung berstatus APPROVED ditolak', async () => {
    await assertFails(setDoc(doc(anon(), 'accessRequests', 'new'), { ...validRequest, status: 'APPROVED' }));
  });

  test('anonim & staf biasa tidak boleh membaca permohonan', async () => {
    await assertFails(getDoc(doc(anon(), 'accessRequests', 'r1')));
    await assertFails(getDoc(doc(as(STAFF), 'accessRequests', 'r1')));
  });

  test('pimpinan boleh menyetujui, tetapi hanya field status/persetujuan', async () => {
    await assertSucceeds(
      updateDoc(doc(as(EXEC), 'accessRequests', 'r1'), { status: 'APPROVED', approvedBy: 'Ketua', approvedAt: 'now' })
    );
    await assertFails(updateDoc(doc(as(EXEC), 'accessRequests', 'r1'), { email: 'lain@x.co' }));
  });
});

describe('konfirmasi baca pengumuman', () => {
  const read = (email, role) => ({ email, name: 'x', role, readAt: '2026-11-06T00:00:00Z' });

  test('staf boleh mengonfirmasi atas namanya sendiri dengan role aslinya', async () => {
    await assertSucceeds(setDoc(doc(as(STAFF), 'notices', 'n1', 'reads', STAFF), read(STAFF, 'OPERATIONAL')));
  });

  test('staf tidak boleh mengonfirmasi atas nama orang lain atau memalsukan role', async () => {
    await assertFails(setDoc(doc(as(STAFF), 'notices', 'n1', 'reads', EXEC), read(EXEC, 'EXECUTIVE')));
    await assertFails(setDoc(doc(as(STAFF), 'notices', 'n1', 'reads', STAFF), read(STAFF, 'IT_ADMIN')));
  });

  test('orang luar & anonim tidak boleh mengonfirmasi', async () => {
    await assertFails(setDoc(doc(as(OUTSIDER), 'notices', 'n1', 'reads', OUTSIDER), read(OUTSIDER, 'OPERATIONAL')));
    await assertFails(setDoc(doc(anon(), 'notices', 'n1', 'reads', 'x@y.z'), read('x@y.z', 'OPERATIONAL')));
  });

  test('staf hanya membaca status miliknya; pimpinan membaca semua', async () => {
    await env.withSecurityRulesDisabled((ctx) =>
      setDoc(doc(ctx.firestore(), 'notices', 'n1', 'reads', ADMIN), read(ADMIN, 'IT_ADMIN'))
    );
    await assertFails(getDoc(doc(as(STAFF), 'notices', 'n1', 'reads', ADMIN)));
    await assertFails(getDocs(collection(as(STAFF), 'notices', 'n1', 'reads')));
    await assertSucceeds(getDocs(collection(as(EXEC), 'notices', 'n1', 'reads')));
  });

  test('konfirmasi baca tidak dapat dihapus', async () => {
    await env.withSecurityRulesDisabled((ctx) =>
      setDoc(doc(ctx.firestore(), 'notices', 'n1', 'reads', STAFF), read(STAFF, 'OPERATIONAL'))
    );
    await assertFails(deleteDoc(doc(as(STAFF), 'notices', 'n1', 'reads', STAFF)));
  });
});

describe('token notifikasi push', () => {
  const tok = (email, role) => ({ email, role, userAgent: 'uji', updatedAt: '2026-11-06T00:00:00Z' });

  test('staf boleh mendaftarkan perangkatnya sendiri dengan role aslinya', async () => {
    await assertSucceeds(setDoc(doc(as(STAFF), 'pushTokens', 'tokenA'), tok(STAFF, 'OPERATIONAL')));
  });

  test('tidak boleh mendaftarkan token atas nama orang lain / role palsu / oleh orang luar', async () => {
    await assertFails(setDoc(doc(as(STAFF), 'pushTokens', 'tokenB'), tok(EXEC, 'EXECUTIVE')));
    await assertFails(setDoc(doc(as(STAFF), 'pushTokens', 'tokenC'), tok(STAFF, 'IT_ADMIN')));
    await assertFails(setDoc(doc(as(OUTSIDER), 'pushTokens', 'tokenD'), tok(OUTSIDER, 'OPERATIONAL')));
  });

  test('token milik orang lain tidak bisa diambil alih atau dihapus', async () => {
    await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'pushTokens', 'milikKetua'), tok(EXEC, 'EXECUTIVE')));
    await assertFails(setDoc(doc(as(STAFF), 'pushTokens', 'milikKetua'), tok(STAFF, 'OPERATIONAL')));
    await assertFails(deleteDoc(doc(as(STAFF), 'pushTokens', 'milikKetua')));
    await assertSucceeds(deleteDoc(doc(as(EXEC), 'pushTokens', 'milikKetua')));
  });

  test('token tidak dapat dibaca dari klien, bahkan oleh admin', async () => {
    await assertFails(getDocs(collection(as(ADMIN), 'pushTokens')));
  });
});

describe('metrik & audit log', () => {
  test('metrik eksekutif hanya untuk pimpinan / IT', async () => {
    await assertFails(getDoc(doc(anon(), 'metrics', 'TODAY')));
    await assertFails(getDoc(doc(as(STAFF), 'metrics', 'TODAY')));
    await assertSucceeds(getDoc(doc(as(EXEC), 'metrics', 'TODAY')));
  });

  const log = (actorEmail, category = 'NOTICE') => ({
    userEmail: actorEmail,
    userName: 'x',
    action: 'TEST',
    details: 'uji',
    category,
    timestamp: '2026-11-06T00:00:00Z',
    actorEmail,
  });

  test('staf boleh menulis log atas namanya sendiri saja', async () => {
    await assertSucceeds(setDoc(doc(as(STAFF), 'auditLogs', 'l1'), log(STAFF)));
    await assertFails(setDoc(doc(as(STAFF), 'auditLogs', 'l2'), log(ADMIN)));
  });

  test('orang luar hanya boleh mencatat log kategori AUTH miliknya', async () => {
    await assertSucceeds(setDoc(doc(as(OUTSIDER), 'auditLogs', 'l1'), log(OUTSIDER, 'AUTH')));
    await assertFails(setDoc(doc(as(OUTSIDER), 'auditLogs', 'l2'), log(OUTSIDER, 'NOTICE')));
    await assertFails(setDoc(doc(anon(), 'auditLogs', 'l3'), log('', 'AUTH')));
  });

  test('audit log tidak dapat diubah atau dihapus, bahkan oleh admin', async () => {
    await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'auditLogs', 'old'), log(ADMIN)));
    await assertFails(updateDoc(doc(as(ADMIN), 'auditLogs', 'old'), { details: 'diubah' }));
    await assertFails(deleteDoc(doc(as(ADMIN), 'auditLogs', 'old')));
  });

  test('audit log hanya dapat dibaca IT_ADMIN', async () => {
    await assertFails(getDocs(collection(as(EXEC), 'auditLogs')));
    await assertSucceeds(getDocs(collection(as(ADMIN), 'auditLogs')));
  });
});
