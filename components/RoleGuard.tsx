'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, KeyRound, ArrowLeft, Home, LayoutGrid, CalendarDays } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/lib/types';
import Navbar from '@/components/Navbar';
import { PapuanBorderCorner } from '@/components/PapuanMotif';
import { Bento, BentoCard } from '@/components/ui/Bento';

interface RoleGuardProps {
  /** Role yang boleh melihat halaman. */
  allow: UserRole[];
  /** Nama halaman untuk pesan penolakan, mis. "Panel Admin". */
  pageName: string;
  /** Path halaman ini, dipakai untuk kembali setelah login. */
  returnTo: string;
  children: React.ReactNode;
}

const OPEN_PAGES = [
  { href: '/', label: 'Beranda', icon: Home },
  { href: '/apps', label: 'Aplikasi', icon: LayoutGrid },
  { href: '/agenda', label: 'Agenda', icon: CalendarDays },
];

/**
 * Penjaga tampilan halaman berdasarkan role. Ini lapisan UX; perlindungan data yang sebenarnya
 * ditegakkan oleh Firestore Security Rules sehingga data tetap aman walau kode klien dimanipulasi.
 */
export default function RoleGuard({ allow, pageName, returnTo, children }: RoleGuardProps) {
  const { user, isInitialized } = useAuth();

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f4ee] dark:bg-[#07130f] text-amber-600 dark:text-amber-400">
        <div className="w-12 h-12 border-4 border-current border-t-transparent rounded-full animate-spin" role="status" aria-label="Memeriksa akses" />
      </div>
    );
  }

  if (user && allow.includes(user.role)) {
    return <>{children}</>;
  }

  return (
    <div className="dock-safe relative min-h-[100dvh] flex flex-col bg-[#f6f4ee] dark:bg-[#07130f] papuan-pattern-overlay text-stone-900 dark:text-slate-100">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 w-full max-w-md md:max-w-3xl mx-auto">
        <Bento className="w-full">
          <BentoCard span="full" className="relative overflow-hidden text-center !p-6 sm:!p-8 border-rose-300 dark:border-rose-500/40">
            <PapuanBorderCorner position="top-right" />
            <PapuanBorderCorner position="bottom-left" />

            <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-500/40 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <h1 className="mt-4 text-xl font-black font-serif">Akses Terbatas</h1>
            <p className="mt-2 text-xs text-stone-600 dark:text-slate-300 leading-relaxed max-w-sm mx-auto">
              {user ? (
                <>
                  Akun Anda (<strong className="text-amber-700 dark:text-amber-300">{user.roleTitle}</strong>) tidak
                  memiliki izin untuk membuka {pageName}.
                </>
              ) : (
                <>{pageName} hanya untuk pengurus dan administrator yayasan. Silakan masuk dengan akun yang berwenang.</>
              )}
            </p>

            <div className="mt-5 flex flex-col sm:flex-row sm:justify-center gap-2">
              {!user && (
                <Link
                  href={`/masuk?next=${encodeURIComponent(returnTo)}`}
                  className="h-11 px-5 flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Masuk</span>
                </Link>
              )}
              <Link
                href="/"
                className="h-11 px-5 flex items-center justify-center gap-2 rounded-xl bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-stone-700 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white text-xs font-bold"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Beranda</span>
              </Link>
            </div>
          </BentoCard>

          {OPEN_PAGES.map(({ href, label, icon: Icon }) => (
            <BentoCard key={href} span="third" surface={false}>
              <Link
                href={href}
                className="h-full flex flex-col items-start gap-2 p-4 rounded-3xl bg-white dark:bg-[#0c241b] border border-stone-200/90 dark:border-white/10 hover:border-amber-400/60 transition-colors"
              >
                <span className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </span>
                <span className="text-sm font-bold">{label}</span>
                <span className="text-[11px] text-stone-500 dark:text-slate-400">Terbuka untuk semua</span>
              </Link>
            </BentoCard>
          ))}
        </Bento>
      </main>
    </div>
  );
}
