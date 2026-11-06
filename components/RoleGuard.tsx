'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, KeyRound, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/lib/types';
import Navbar from '@/components/Navbar';
import { PapuanBorderCorner } from '@/components/PapuanMotif';

interface RoleGuardProps {
  /** Role yang boleh melihat halaman. */
  allow: UserRole[];
  /** Nama halaman untuk pesan penolakan, mis. "Panel Admin". */
  pageName: string;
  /** Path halaman ini, dipakai untuk kembali setelah login. */
  returnTo: string;
  children: React.ReactNode;
}

/**
 * Penjaga tampilan halaman berdasarkan role. Ini lapisan UX; perlindungan data yang sebenarnya
 * ditegakkan oleh Firestore Security Rules sehingga data tetap aman walau kode klien dimanipulasi.
 */
export default function RoleGuard({ allow, pageName, returnTo, children }: RoleGuardProps) {
  const { user, isInitialized } = useAuth();

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07130f] text-amber-400">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user && allow.includes(user.role)) {
    return <>{children}</>;
  }

  return (
    <div className="dock-safe relative min-h-[100dvh] flex flex-col bg-[#07130f] papuan-pattern-overlay text-slate-100">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 pb-6 w-full max-w-md mx-auto">
        <div className="relative w-full p-8 rounded-3xl bg-[#091f17] border-2 border-rose-500/40 text-center space-y-4 shadow-2xl overflow-hidden">
          <PapuanBorderCorner position="top-right" />
          <PapuanBorderCorner position="bottom-left" />

          <div className="w-16 h-16 rounded-3xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-black text-white font-serif">Akses Terbatas</h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              {user ? (
                <>
                  Akun Anda (<strong className="text-amber-300">{user.roleTitle}</strong>) tidak memiliki izin untuk
                  membuka {pageName}.
                </>
              ) : (
                <>{pageName} hanya untuk pengurus dan administrator yayasan. Silakan masuk dengan akun yang berwenang.</>
              )}
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            {!user && (
              <Link
                href={`/dashboard/admin/login?next=${encodeURIComponent(returnTo)}`}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-extrabold shadow-lg"
              >
                <KeyRound className="w-4 h-4" />
                <span>Masuk</span>
              </Link>
            )}
            <Link
              href="/"
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0a1f17] border border-amber-500/20 text-slate-300 hover:text-white text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
