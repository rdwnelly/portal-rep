import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { initializeFirestore, getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';

// Emulator lokal (opsional): set NEXT_PUBLIC_FIREBASE_EMULATOR=true untuk menjalankan
// seluruh aplikasi terhadap Firebase Emulator Suite tanpa menyentuh data produksi.
const useEmulator = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === 'true';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'portal-rep.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || (useEmulator ? 'demo-portal-rep' : 'portal-rep-yayasan'),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'portal-rep.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abcdef',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

/** Firebase sungguhan (atau emulator) tersedia → data & otorisasi berjalan di Firestore. */
const isConfigured = Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY) || useEmulator;

/**
 * Mode demo (data contoh di localStorage + akun simulasi) HANYA untuk pengembangan lokal.
 * Build produksi tanpa konfigurasi Firebase tidak menyediakan login sama sekali.
 */
const isDemoMode = !isConfigured && process.env.NODE_ENV !== 'production';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

let db: Firestore;
try {
  // ignoreUndefinedProperties: field opsional bernilai undefined tidak membuat penulisan gagal.
  db = initializeFirestore(app, { ignoreUndefinedProperties: true });
} catch {
  // Sudah diinisialisasi sebelumnya (mis. saat hot reload).
  db = getFirestore(app);
}

const globalFlags = globalThis as unknown as { __portalRepEmulatorConnected?: boolean };
if (useEmulator && typeof window !== 'undefined' && !globalFlags.__portalRepEmulatorConnected) {
  globalFlags.__portalRepEmulatorConnected = true;
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}

export { app, auth, googleProvider, db, isConfigured, isDemoMode };
