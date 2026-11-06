/** Helper Firebase Emulator untuk uji e2e (akses "owner" melewati Security Rules). */
import { expect, type Page } from '@playwright/test';
import { INITIAL_APPS, INITIAL_DOCUMENTS, INITIAL_EVENTS, INITIAL_NOTICES } from '../../../lib/seed-data';
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

/** Konten awal (modul aplikasi, pengumuman, agenda, dokumen) langsung ke Firestore. */
export async function seedContent() {
  const strip = <T extends { id: string }>({ id, ...rest }: T) => [id, rest] as const;
  await Promise.all([
    ...INITIAL_APPS.map((a) => putDoc(`apps/${a.id}`, strip(a)[1])),
    ...INITIAL_NOTICES.map((n) => putDoc(`notices/${n.id}`, strip(n)[1])),
    ...INITIAL_EVENTS.map((e) => putDoc(`events/${e.id}`, strip(e)[1])),
    ...INITIAL_DOCUMENTS.map((d) => putDoc(`documents/${d.id}`, { ...strip(d)[1], isConfidential: Boolean(d.isConfidential) })),
  ]);
}

/** Akun standar: IT_ADMIN, EXECUTIVE, staf operasional. */
export async function seedStandardUsers() {
  await createUser('admin@rep.test');
  await createUser('ketua@rep.test');
  await createUser('staf@rep.test');
  await whitelist('admin@rep.test', 'IT_ADMIN');
  await whitelist('ketua@rep.test', 'EXECUTIVE');
  await whitelist('staf@rep.test', 'OPERATIONAL');
}

export async function idToken(email: string) {
  const res = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-api-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD, returnSecureToken: true }),
  });
  return ((await res.json()) as { idToken: string }).idToken;
}

export async function login(page: Page, email: string, opts: { password?: string; next?: string } = {}) {
  await page.goto(`/dashboard/admin/login${opts.next ? `?next=${encodeURIComponent(opts.next)}` : ''}`);
  await page.fill('input[type=email]', email);
  await page.fill('input[type=password]', opts.password ?? PASSWORD);
  await page.click('button:has-text("Masuk Sekarang")');
}

export async function loginAndWait(page: Page, email: string, path = '**/dashboard/admin') {
  await login(page, email);
  await page.waitForURL(path);
  await expect(page.getByText('Memeriksa akun')).toHaveCount(0);
}
