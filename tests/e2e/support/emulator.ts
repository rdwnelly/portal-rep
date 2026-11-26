/** Helper Firebase Emulator untuk uji e2e (akses "owner" melewati Security Rules). */
import { expect, type Page } from '@playwright/test';
import { INITIAL_APPS } from '../../../lib/seed-data';
import type { UserRole } from '../../../lib/types';

const PROJECT = 'demo-portal-rep';
const AUTH = 'http://127.0.0.1:9099';
const FS = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`;
const OWNER = { Authorization: 'Bearer owner', 'Content-Type': 'application/json' };
export const PASSWORD = 'RahasiaUji#2026';

type FsValue = Record<string, unknown>;
const enc = (v: unknown): FsValue => {
  if (v === null) return { nullValue: null };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(enc) } };
  if (typeof v === 'object') return { mapValue: { fields: fields(v as object) } };
  return { stringValue: String(v) };
};
const fields = (obj: object) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined).map(([k, v]) => [k, enc(v)]));

export async function putDoc(path: string, data: object) {
  const res = await fetch(`${FS}/${path}`, { method: 'PATCH', headers: OWNER, body: JSON.stringify({ fields: fields(data) }) });
  if (!res.ok) throw new Error(`putDoc ${path}: ${await res.text()}`);
}

/** Baca satu dokumen Firestore (akses owner) — untuk memastikan perubahan benar-benar tersimpan. */
export async function readDoc(path: string): Promise<Record<string, unknown> | null> {
  const res = await fetch(`${FS}/${path}`, { headers: OWNER });
  if (res.status === 404) return null;
  const body = (await res.json()) as { fields?: Record<string, { stringValue?: string }> };
  return Object.fromEntries(Object.entries(body.fields ?? {}).map(([k, v]) => [k, v.stringValue ?? v]));
}

/** Jumlah dokumen dalam satu koleksi. */
export async function countDocs(collectionPath: string): Promise<number> {
  const res = await fetch(`${FS}/${collectionPath}?pageSize=300`, { headers: OWNER });
  const body = (await res.json()) as { documents?: unknown[] };
  return body.documents?.length ?? 0;
}

export async function resetEmulators() {
  await fetch(`http://127.0.0.1:8080/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: 'DELETE' });
  await fetch(`${AUTH}/emulator/v1/projects/${PROJECT}/accounts`, { method: 'DELETE' });
}

export async function createUser(email: string, verified = true, password = PASSWORD) {
  const res = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/projects/${PROJECT}/accounts`, {
    method: 'POST',
    headers: OWNER,
    body: JSON.stringify({ email, password, emailVerified: verified }),
  });
  if (!res.ok) throw new Error(`createUser ${email}: ${await res.text()}`);
}

export const whitelist = (email: string, role: UserRole, active = true) =>
  putDoc(`whitelist/${email}`, {
    email,
    name: email.split('@')[0],
    role,
    roleTitle: `Uji ${role}`,
    department: 'Uji',
    active,
    addedAt: new Date().toISOString(),
    addedBy: 'e2e',
  });

/** Link aplikasi awal langsung ke Firestore. Agenda sengaja tidak diisi: tiap uji membuatnya sendiri. */
export async function seedContent() {
  await Promise.all(INITIAL_APPS.map(({ id, ...rest }) => putDoc(`apps/${id}`, rest)));
}

/** Akun standar: satu admin, dan satu akun terdaftar yang BUKAN admin (untuk uji penolakan). */
export async function seedStandardUsers() {
  await createUser('admin@rep.test');
  await createUser('staf@rep.test');
  await whitelist('admin@rep.test', 'IT_ADMIN');
  await whitelist('staf@rep.test', 'OPERATIONAL');
}

export async function login(page: Page, email: string, opts: { password?: string; next?: string } = {}) {
  await page.goto(`/masuk${opts.next ? `?next=${encodeURIComponent(opts.next)}` : ''}`);
  await page.fill('input[type=email]', email);
  await page.fill('input[type=password]', opts.password ?? PASSWORD);
  await page.click('button:has-text("Masuk Sekarang")');
}

/** Beranda — tujuan setelah login bagi akun yang bukan admin. */
export const HOME_URL = /\/(?:[?#].*)?$/;

export async function loginAndWait(page: Page, email: string, path: string | RegExp = '**/dashboard/admin') {
  await login(page, email);
  await page.waitForURL(path);
  await expect(page.getByText('Memeriksa akun')).toHaveCount(0);
}
