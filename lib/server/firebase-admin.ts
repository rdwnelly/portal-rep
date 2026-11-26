/**
 * Firebase Admin SDK untuk Route Handler (HANYA dipakai di server).
 *
 * Kredensial dari environment (jangan pernah dari file di dalam repo):
 *   FIREBASE_SERVICE_ACCOUNT_JSON   → seluruh isi JSON service account (disarankan untuk Vercel)
 *   GOOGLE_APPLICATION_CREDENTIALS  → path ke file JSON di luar repo
 * Saat NEXT_PUBLIC_FIREBASE_EMULATOR=true, Admin SDK diarahkan ke emulator tanpa kredensial.
 */
import { cert, getApps, initializeApp, type App, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

const ADMIN_APP = 'portal-admin';
const useEmulator = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === 'true';

export const PORTAL_PROJECT_ID =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || (useEmulator ? 'demo-portal-rep' : 'portal-rep-7d456');

export class AdminNotConfiguredError extends Error {}

function getAdminApp(): App {
  const existing = getApps().find((a) => a.name === ADMIN_APP);
  if (existing) return existing;

  if (useEmulator) {
    process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080';
    process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
    return initializeApp({ projectId: PORTAL_PROJECT_ID }, ADMIN_APP);
  }

  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (inline) {
    return initializeApp({ credential: cert(JSON.parse(inline) as ServiceAccount), projectId: PORTAL_PROJECT_ID }, ADMIN_APP);
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return initializeApp({ projectId: PORTAL_PROJECT_ID }, ADMIN_APP);
  }
  throw new AdminNotConfiguredError(
    'Kredensial server belum diset: isi FIREBASE_SERVICE_ACCOUNT_JSON di environment portal.'
  );
}

export const adminAuth = () => getAuth(getAdminApp());
export const adminDb = () => getFirestore(getAdminApp());
export const adminMessaging = () => getMessaging(getAdminApp());
