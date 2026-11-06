'use client';

/**
 * Autentikasi PORTAL REP.
 *
 * Mode Firestore (produksi): identitas berasal dari Firebase Auth; role & status aktif berasal
 * dari dokumen `whitelist/{email}` di Firestore yang hanya dapat diubah IT Admin (Security Rules).
 * Tidak ada data sesi/role yang dipercaya dari localStorage.
 *
 * Mode demo (hanya `next dev` tanpa konfigurasi Firebase): akun simulasi dari data contoh lokal.
 */

import React, { createContext, useCallback, useContext, useState, useSyncExternalStore } from 'react';
import {
  User as FirebaseUser,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { UserProfile, UserRole, WhitelistedUser } from './types';
import { findWhitelistedUser, addAuditLog, addAuditLogAsync, submitAccessRequest, configureSync } from './storage';
import { auth, db, googleProvider, isConfigured, isDemoMode } from './firebase';
import { unregisterPush } from './push';

type DemoKey = 'FRICKY' | 'MITSHI' | 'RIDWAN' | 'FRONTDESK' | 'FINANCE' | 'UNAUTHORIZED_DEMO';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  /** true setelah status login awal selesai diperiksa di browser. */
  isInitialized: boolean;
  isWhitelisted: boolean;
  isDemoMode: boolean;
  unauthorizedEmail: string | null;
  authError: string | null;
  loginWithGoogle: () => Promise<void>;
  loginWithEmailPassword: (email: string, pass: string) => Promise<boolean>;
  loginAsDemo: (demoKey: DemoKey) => void;
  logout: () => void;
  /** Kirim tautan buat/atur ulang kata sandi. Mengembalikan pesan untuk ditampilkan. */
  resetPassword: (email: string) => Promise<{ ok: boolean; message: string }>;
  requestAccess: (data: { name: string; email: string; department: string; reason: string }) => Promise<void>;
  clearUnauthorizedState: () => void;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_ACCOUNTS: Record<DemoKey, { email: string; displayName: string; photoURL: string }> = {
  FRICKY: {
    email: 'fricky.burdam@rumahetnikpapua.org',
    displayName: 'Bpk. Fricky Mosche Burdam',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  MITSHI: {
    email: 'mitshi.wanma@rumahetnikpapua.org',
    displayName: 'Ibu Mitshi Wanma',
    photoURL: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  RIDWAN: {
    email: 'ridwanelly123@gmail.com',
    displayName: 'Ridwan Elly',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  FRONTDESK: {
    email: 'frontdesk@rumahetnikpapua.org',
    displayName: 'Staf Frontdesk & Yaswar Cafe',
    photoURL: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  },
  FINANCE: {
    email: 'keuangan.gudang@rumahetnikpapua.org',
    displayName: 'Staf Keuangan & Gudang (OMG)',
    photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
  UNAUTHORIZED_DEMO: {
    email: 'guest.tamu@gmail.com',
    displayName: 'Tamu Luar Yayasan (Unauthorized)',
    photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  },
};

const DEMO_SESSION_KEY = 'portal_rep_demo_session_email';
const LEGACY_SESSION_KEY = 'portal_rep_session_user';
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

function buildProfile(entry: WhitelistedUser, extra: { uid: string; displayName?: string | null; photoURL?: string | null }): UserProfile {
  return {
    uid: extra.uid,
    email: entry.email.toLowerCase(),
    displayName: entry.name || extra.displayName || entry.email,
    photoURL: extra.photoURL || entry.avatarUrl || DEFAULT_AVATAR,
    role: entry.role,
    roleTitle: entry.roleTitle,
    department: entry.department,
    isWhitelisted: true,
    lastLogin: new Date().toISOString(),
  };
}

// ==========================================
// Penyimpanan status auth (external store)
// ==========================================
interface AuthSnapshot {
  user: UserProfile | null;
  resolved: boolean;
}

const SERVER_SNAPSHOT: AuthSnapshot = { user: null, resolved: false };
let authSnapshot: AuthSnapshot = SERVER_SNAPSHOT;
const authListeners = new Set<() => void>();
let authStarted = false;
let whitelistUnsub: Unsubscribe | null = null;
/** Selama proses login berlangsung, fungsi login yang menangani penolakan & pesan error. */
let loginInProgress = false;

function setAuthSnapshot(user: UserProfile | null): void {
  authSnapshot = { user, resolved: true };
  configureSync(user ? user.role : null);
  authListeners.forEach((listener) => listener());
}

function readDemoSession(): UserProfile | null {
  try {
    localStorage.removeItem(LEGACY_SESSION_KEY); // sesi lama berisi role yang bisa dimanipulasi
    const email = localStorage.getItem(DEMO_SESSION_KEY);
    if (!email) return null;
    const entry = findWhitelistedUser(email);
    if (!entry) return null;
    const demo = Object.values(DEMO_ACCOUNTS).find((d) => d.email === entry.email);
    return buildProfile(entry, { uid: `demo-${entry.id}`, photoURL: demo?.photoURL });
  } catch {
    return null;
  }
}

function startAuth(): void {
  if (authStarted || typeof window === 'undefined') return;
  authStarted = true;

  if (isDemoMode) {
    setAuthSnapshot(readDemoSession());
    window.addEventListener('storage', (e) => {
      if (e.key === DEMO_SESSION_KEY) setAuthSnapshot(readDemoSession());
    });
    return;
  }

  if (!isConfigured) {
    // Build produksi tanpa Firebase: portal publik tetap berjalan, login tidak tersedia.
    setAuthSnapshot(null);
    return;
  }

  // Lanjutkan login Google yang memakai mode redirect (popup diblokir browser).
  getRedirectResult(auth).catch((err) => console.error('Redirect result error:', err));

  onAuthStateChanged(auth, (fbUser) => {
    whitelistUnsub?.();
    whitelistUnsub = null;

    const email = fbUser?.email?.toLowerCase();
    if (!fbUser || !email || !fbUser.emailVerified) {
      setAuthSnapshot(null);
      return;
    }

    // Pantau dokumen whitelist secara real-time: perubahan role / penonaktifan langsung berlaku.
    whitelistUnsub = onSnapshot(
      doc(db, 'whitelist', email),
      (snap) => {
        const data = snap.data() as Omit<WhitelistedUser, 'id'> | undefined;
        if (snap.exists() && data?.active) {
          setAuthSnapshot(buildProfile({ ...data, id: snap.id }, fbUser));
        } else {
          setAuthSnapshot(null);
          if (!loginInProgress) void firebaseSignOut(auth);
        }
      },
      (err) => {
        console.error('Gagal membaca whitelist:', err);
        setAuthSnapshot(null);
      }
    );
  });
}

function subscribeAuth(callback: () => void): () => void {
  authListeners.add(callback);
  startAuth();
  return () => {
    authListeners.delete(callback);
  };
}

const getAuthSnapshot = () => authSnapshot;
const getServerAuthSnapshot = () => SERVER_SNAPSHOT;

type LoginResult = { ok: true } | { ok: false; error: string; unauthorizedEmail?: string };

/**
 * Validasi pasca-login Firebase: email harus terverifikasi dan terdaftar aktif di whitelist.
 * Verifikasi email mencegah orang mendaftarkan akun Email/Password memakai email pimpinan.
 */
async function completeFirebaseLogin(fbUser: FirebaseUser, method: string): Promise<LoginResult> {
  const email = fbUser.email?.toLowerCase();
  if (!email) {
    await firebaseSignOut(auth);
    return { ok: false, error: 'Akun ini tidak memiliki alamat email.' };
  }

  if (!fbUser.emailVerified) {
    try {
      await sendEmailVerification(fbUser);
    } catch (err) {
      console.warn('Gagal mengirim email verifikasi:', err);
    }
    await firebaseSignOut(auth);
    return {
      ok: false,
      error: `Email ${email} belum diverifikasi. Kami telah mengirim tautan verifikasi ke kotak masuk email tersebut — buka tautannya, lalu login kembali.`,
    };
  }

  const snap = await getDoc(doc(db, 'whitelist', email));
  const data = snap.data() as Omit<WhitelistedUser, 'id'> | undefined;

  if (!snap.exists() || !data?.active) {
    await addAuditLogAsync({
      userEmail: email,
      userName: fbUser.displayName || email,
      action: 'LOGIN_BLOCKED_UNAUTHORIZED',
      details: `Percobaan login (${method}) ditolak: email tidak terdaftar/aktif di whitelist yayasan`,
      category: 'AUTH',
    });
    await firebaseSignOut(auth);
    return {
      ok: false,
      unauthorizedEmail: email,
      error: `Email ${email} belum terdaftar sebagai staf aktif. Ajukan permohonan akses atau hubungi Admin IT.`,
    };
  }

  // Set profil segera agar halaman tujuan tidak sempat merender status "belum login".
  setAuthSnapshot(buildProfile({ ...data, id: snap.id }, fbUser));

  addAuditLog({
    userEmail: email,
    userName: data.name,
    action: 'LOGIN_SUCCESS',
    details: `Login berhasil (${method}) sebagai ${data.roleTitle}`,
    category: 'AUTH',
  });
  return { ok: true };
}

function describeFirebaseError(err: unknown): string {
  const code = (err as { code?: string })?.code;
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Email atau kata sandi tidak cocok.';
    case 'auth/invalid-email':
      return 'Format alamat email tidak valid.';
    case 'auth/too-many-requests':
      return 'Akses diblokir sementara karena terlalu banyak percobaan salah. Silakan tunggu beberapa saat.';
    case 'auth/operation-not-allowed':
      return 'Metode login ini belum diaktifkan di Firebase Console (Authentication > Sign-in method).';
    case 'auth/unauthorized-domain':
      return `Domain "${host}" belum diizinkan di Firebase Console (Authentication > Settings > Authorized domains).`;
    case 'auth/network-request-failed':
      return 'Koneksi ke server Firebase gagal. Periksa jaringan internet Anda.';
    default:
      return `Gagal autentikasi: ${(err as Error)?.message || code || 'Terjadi kesalahan sistem'}`;
  }
}

const LOGIN_UNAVAILABLE =
  'Login belum tersedia: Firebase belum dikonfigurasi untuk deployment ini. Hubungi Admin IT.';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const snapshot = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getServerAuthSnapshot);
  const user = snapshot.user;

  const [isLoading, setIsLoading] = useState(false);
  const [unauthorizedEmail, setUnauthorizedEmail] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const applyResult = useCallback((result: LoginResult): boolean => {
    if (result.ok) {
      setUnauthorizedEmail(null);
      setAuthError(null);
      return true;
    }
    setUnauthorizedEmail(result.unauthorizedEmail ?? null);
    setAuthError(result.error);
    return false;
  }, []);

  const demoLogin = useCallback(
    (email: string, method: string): boolean => {
      const entry = findWhitelistedUser(email);
      if (!entry) {
        return applyResult({
          ok: false,
          unauthorizedEmail: email,
          error: `[Mode Demo] Email ${email} tidak ada di whitelist data contoh.`,
        });
      }
      localStorage.setItem(DEMO_SESSION_KEY, entry.email);
      setAuthSnapshot(readDemoSession());
      addAuditLog({
        userEmail: entry.email,
        userName: entry.name,
        action: 'DEMO_LOGIN',
        details: `[Mode Demo] Login simulasi (${method}) sebagai ${entry.roleTitle}`,
        category: 'AUTH',
      });
      return applyResult({ ok: true });
    },
    [applyResult]
  );

  const loginWithGoogle = async () => {
    setAuthError(null);
    if (isDemoMode) {
      demoLogin(DEMO_ACCOUNTS.RIDWAN.email, 'Google');
      return;
    }
    if (!isConfigured) {
      setAuthError(LOGIN_UNAVAILABLE);
      return;
    }

    setIsLoading(true);
    loginInProgress = true;
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      applyResult(await completeFirebaseLogin(cred.user, 'Google'));
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/popup-blocked') {
        // Safari/iOS sering memblokir popup → gunakan redirect.
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        setAuthError(describeFirebaseError(err));
      }
    } finally {
      loginInProgress = false;
      setIsLoading(false);
    }
  };

  const loginWithEmailPassword = async (email: string, pass: string): Promise<boolean> => {
    setAuthError(null);
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !pass) {
      setAuthError('Silakan masukkan email dan kata sandi.');
      return false;
    }

    if (isDemoMode) return demoLogin(cleanEmail, 'Email & Password');
    if (!isConfigured) {
      setAuthError(LOGIN_UNAVAILABLE);
      return false;
    }

    setIsLoading(true);
    loginInProgress = true;
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      return applyResult(await completeFirebaseLogin(cred.user, 'Email & Password'));
    } catch (err) {
      setAuthError(describeFirebaseError(err));
      return false;
    } finally {
      loginInProgress = false;
      setIsLoading(false);
    }
  };

  const loginAsDemo = (demoKey: DemoKey) => {
    if (!isDemoMode) {
      setAuthError('Akun simulasi hanya tersedia di mode pengembangan.');
      return;
    }
    demoLogin(DEMO_ACCOUNTS[demoKey].email, 'Akun Simulasi');
  };

  const logout = async () => {
    setUnauthorizedEmail(null);
    setAuthError(null);
    if (isDemoMode) {
      localStorage.removeItem(DEMO_SESSION_KEY);
      setAuthSnapshot(null);
      return;
    }
    try {
      // Lepas perangkat ini dari notifikasi milik akun yang keluar.
      await unregisterPush();
      if (isConfigured) await firebaseSignOut(auth);
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const resetPassword = async (email: string): Promise<{ ok: boolean; message: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return { ok: false, message: 'Isi alamat email terlebih dahulu.' };
    if (isDemoMode) return { ok: true, message: '[Mode Demo] Email atur ulang kata sandi tidak dikirim.' };
    if (!isConfigured) return { ok: false, message: LOGIN_UNAVAILABLE };
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
    } catch (err) {
      const code = (err as { code?: string })?.code;
      // Jangan bocorkan apakah sebuah email terdaftar atau tidak.
      if (code !== 'auth/user-not-found') return { ok: false, message: describeFirebaseError(err) };
    }
    return {
      ok: true,
      message: `Jika ${cleanEmail} terdaftar, tautan untuk membuat kata sandi baru telah dikirim ke email tersebut.`,
    };
  };

  const requestAccess = async (data: { name: string; email: string; department: string; reason: string }) => {
    submitAccessRequest(data);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isInitialized: snapshot.resolved,
        isWhitelisted: Boolean(user?.isWhitelisted),
        isDemoMode,
        unauthorizedEmail,
        authError,
        loginWithGoogle,
        loginWithEmailPassword,
        loginAsDemo,
        logout,
        resetPassword,
        requestAccess,
        clearUnauthorizedState: () => setUnauthorizedEmail(null),
        clearAuthError: () => setAuthError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/** Helper role untuk UI (izin sebenarnya tetap ditegakkan oleh Firestore Security Rules). */
export function isManagerRole(role: UserRole | undefined | null): boolean {
  return role === 'IT_ADMIN' || role === 'EXECUTIVE';
}
