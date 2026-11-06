/**
 * Verifikasi pemanggil Route Handler portal.
 * Klien mengirim `Authorization: Bearer <Firebase ID token>`; server memverifikasi token,
 * memastikan email terverifikasi, lalu membaca role dari whitelist/{email} (sumber kebenaran
 * yang sama dengan Firestore Security Rules).
 */
import { NextResponse } from 'next/server';
import { adminAuth, adminDb, AdminNotConfiguredError } from './firebase-admin';
import type { UserRole } from '../types';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export interface StaffIdentity {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
}

export async function requireStaff(req: Request, allowed?: UserRole[]): Promise<StaffIdentity> {
  const header = req.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) throw new HttpError(401, 'Sesi login tidak ditemukan. Silakan masuk kembali.');

  let decoded;
  try {
    decoded = await adminAuth().verifyIdToken(token);
  } catch (err) {
    if (err instanceof AdminNotConfiguredError) throw err;
    throw new HttpError(401, 'Sesi login tidak valid atau kedaluwarsa. Silakan masuk kembali.');
  }

  const email = decoded.email?.toLowerCase();
  if (!email || decoded.email_verified !== true) {
    throw new HttpError(403, 'Email akun belum terverifikasi.');
  }

  const snap = await adminDb().doc(`whitelist/${email}`).get();
  const data = snap.data();
  if (!snap.exists || data?.active !== true) {
    throw new HttpError(403, 'Akun tidak terdaftar sebagai staf aktif.');
  }

  const role = data.role as UserRole;
  if (allowed && !allowed.includes(role)) {
    throw new HttpError(403, 'Role Anda tidak memiliki izin untuk aksi ini.');
  }

  return { uid: decoded.uid, email, name: String(data.name || email), role };
}

/** Ubah error menjadi respons JSON yang aman (tanpa membocorkan detail internal di produksi). */
export function errorResponse(err: unknown): NextResponse {
  if (err instanceof HttpError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof AdminNotConfiguredError) {
    return NextResponse.json({ error: err.message }, { status: 503 });
  }
  console.error('[PORTAL REP API]', err);
  const message =
    process.env.NODE_ENV === 'production' ? 'Terjadi kesalahan server.' : (err as Error)?.message || String(err);
  return NextResponse.json({ error: message }, { status: 500 });
}
