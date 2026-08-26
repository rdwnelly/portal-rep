'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UserProfile, UserRole } from './types';
import { findWhitelistedUser, addAuditLog, submitAccessRequest } from './storage';
import { auth, googleProvider, isConfigured } from './firebase';
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isWhitelisted: boolean;
  unauthorizedEmail: string | null;
  authError: string | null;
  loginWithGoogle: () => Promise<void>;
  loginAsDemo: (demoKey: 'FRICKY' | 'MITSHI' | 'RIDWAN' | 'FRONTDESK' | 'FINANCE' | 'UNAUTHORIZED_DEMO') => void;
  logout: () => void;
  requestAccess: (data: { name: string; email: string; department: string; reason: string }) => Promise<void>;
  clearUnauthorizedState: () => void;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_ACCOUNTS = {
  FRICKY: {
    email: 'fricky.burdam@rumahetnikpapua.org',
    displayName: 'Bpk. Fricky Mosche Burdam',
    role: 'EXECUTIVE' as UserRole,
    roleTitle: 'Ketua Yayasan',
    department: 'Manajemen Eksekutif',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  MITSHI: {
    email: 'mitshi.wanma@rumahetnikpapua.org',
    displayName: 'Ibu Mitshi Wanma',
    role: 'EXECUTIVE' as UserRole,
    roleTitle: 'Pengurus Yayasan',
    department: 'Manajemen Eksekutif',
    photoURL: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  RIDWAN: {
    email: 'ridwanelly123@gmail.com',
    displayName: 'Ridwan Elly',
    role: 'IT_ADMIN' as UserRole,
    roleTitle: 'IT Developer Internal',
    department: 'Teknologi Informasi & Sistem',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  FRONTDESK: {
    email: 'frontdesk@rumahetnikpapua.org',
    displayName: 'Staf Frontdesk & Yaswar Cafe',
    role: 'OPERATIONAL' as UserRole,
    roleTitle: 'Frontdesk & Kasir Cafe',
    department: 'Operasional & Layanan Tamu',
    photoURL: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  },
  FINANCE: {
    email: 'keuangan.gudang@rumahetnikpapua.org',
    displayName: 'Staf Keuangan & Gudang (OMG)',
    role: 'FINANCE_WAREHOUSE' as UserRole,
    roleTitle: 'Staf Pembukuan & Logistik',
    department: 'Keuangan & Logistik (SIK-REP / OMG)',
    photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
  UNAUTHORIZED_DEMO: {
    email: 'guest.tamu@gmail.com',
    displayName: 'Tamu Luar Yayasan (Unauthorized)',
    role: 'UNAUTHORIZED' as UserRole,
    roleTitle: 'Akun Belum Terdaftar',
    department: 'Eksternal',
    photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  },
};

const SESSION_KEY = 'portal_rep_session_user';

function getInitialUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const savedSession = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    if (savedSession) {
      const parsed = JSON.parse(savedSession) as UserProfile;
      const whitelisted = findWhitelistedUser(parsed.email);
      if (whitelisted) {
        return {
          ...parsed,
          role: whitelisted.role,
          roleTitle: whitelisted.roleTitle,
          department: whitelisted.department,
          isWhitelisted: true,
        };
      } else if (parsed.role === 'IT_ADMIN' || parsed.role === 'EXECUTIVE') {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Session load error:', e);
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(getInitialUser);
  const [isLoading, setIsLoading] = useState(false);
  const [unauthorizedEmail, setUnauthorizedEmail] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleAuthUserEmail = useCallback((email: string, displayName: string, photoURL?: string, shouldRedirect: boolean = true) => {
    const whitelisted = findWhitelistedUser(email);
    if (whitelisted) {
      const profile: UserProfile = {
        uid: `uid-${Date.now()}`,
        email: email,
        displayName: whitelisted.name || displayName,
        photoURL: photoURL || whitelisted.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        role: whitelisted.role,
        roleTitle: whitelisted.roleTitle,
        department: whitelisted.department,
        isWhitelisted: true,
        lastLogin: new Date().toISOString(),
      };
      setUser(profile);
      setUnauthorizedEmail(null);
      setAuthError(null);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(profile));
        localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
        if (shouldRedirect && !window.location.pathname.startsWith('/dashboard')) {
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.href = '/dashboard';
        }
      }

      addAuditLog({
        userEmail: email,
        userName: profile.displayName,
        action: 'LOGIN_SUCCESS',
        details: `Login berhasil melalui Google SSO dengan role: ${profile.roleTitle}`,
        category: 'AUTH',
      });
    } else {
      setUser(null);
      setUnauthorizedEmail(email);
      setAuthError(null);

      addAuditLog({
        userEmail: email,
        userName: displayName,
        action: 'LOGIN_BLOCKED_UNAUTHORIZED',
        details: `Percobaan login ditolak: Email tidak ada di whitelist resmi yayasan`,
        category: 'AUTH',
      });
    }
  }, []);

  useEffect(() => {
    if (isConfigured) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser && firebaseUser.email) {
          handleAuthUserEmail(firebaseUser.email, firebaseUser.displayName || 'Pengguna Google', firebaseUser.photoURL || undefined, false);
        }
      });
      return () => unsubscribe();
    }
  }, [handleAuthUserEmail]);

  const loginWithGoogle = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      if (isConfigured) {
        const result = await signInWithPopup(auth, googleProvider);
        if (result?.user?.email) {
          handleAuthUserEmail(result.user.email, result.user.displayName || 'Pengguna Google', result.user.photoURL || undefined, true);
        }
      } else {
        handleAuthUserEmail(DEMO_ACCOUNTS.RIDWAN.email, DEMO_ACCOUNTS.RIDWAN.displayName, DEMO_ACCOUNTS.RIDWAN.photoURL, true);
      }
    } catch (error: unknown) {
      console.error('Google Sign In Error:', error);
      const authErr = error as { code?: string; message?: string };
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      
      if (authErr?.code === 'auth/operation-not-allowed') {
        setAuthError('Google Sign-In belum diaktifkan di Firebase Console. Buka Firebase Console > Authentication > Sign-in method > aktifkan Google.');
      } else if (authErr?.code === 'auth/unauthorized-domain') {
        setAuthError(`Domain "${currentHost}" belum diizinkan di Firebase Console. Buka Firebase Console > Authentication > Settings > Authorized domains > tambahkan "${currentHost}".`);
      } else if (authErr?.code === 'auth/popup-blocked') {
        setAuthError('Popup Google diblokir oleh browser. Harap izinkan popup di pengaturan URL browser Anda.');
      } else if (authErr?.code === 'auth/popup-closed-by-user' || authErr?.code === 'auth/cancelled-popup-request') {
        // User sengaja menutup popup
        setAuthError(null);
      } else if (authErr?.code === 'auth/network-request-failed') {
        setAuthError('Koneksi ke server Google Firebase gagal. Periksa jaringan internet Anda.');
      } else {
        setAuthError(`Gagal autentikasi Google: ${authErr?.message || authErr?.code || 'Terjadi kesalahan sistem'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemo = (demoKey: keyof typeof DEMO_ACCOUNTS) => {
    setIsLoading(true);
    setAuthError(null);
    const target = DEMO_ACCOUNTS[demoKey];
    if (demoKey === 'UNAUTHORIZED_DEMO') {
      setUser(null);
      setUnauthorizedEmail(target.email);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(SESSION_KEY);
      }
      addAuditLog({
        userEmail: target.email,
        userName: target.displayName,
        action: 'DEMO_LOGIN_BLOCKED',
        details: 'Simulasi percobaan login oleh akun yang belum di-whitelist',
        category: 'AUTH',
      });
      setIsLoading(false);
    } else {
      handleAuthUserEmail(target.email, target.displayName, target.photoURL, true);
    }
  };

  const logout = async () => {
    try {
      if (isConfigured) {
        await firebaseSignOut(auth);
      }
    } catch (e) {
      console.error('Logout error:', e);
    }
    setUser(null);
    setUnauthorizedEmail(null);
    setAuthError(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_KEY);
    }
  };

  const requestAccess = async (data: { name: string; email: string; department: string; reason: string }) => {
    submitAccessRequest(data);
    addAuditLog({
      userEmail: data.email,
      userName: data.name,
      action: 'REQUEST_ACCESS',
      details: `Permohonan akses diajukan untuk departemen ${data.department}`,
      category: 'AUTH',
    });
  };

  const clearUnauthorizedState = () => {
    setUnauthorizedEmail(null);
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isWhitelisted: Boolean(user?.isWhitelisted),
        unauthorizedEmail,
        authError,
        loginWithGoogle,
        loginAsDemo,
        logout,
        requestAccess,
        clearUnauthorizedState,
        clearAuthError,
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
