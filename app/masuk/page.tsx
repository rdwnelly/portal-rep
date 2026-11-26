'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertTriangle,
  KeyRound,
  ArrowLeft,
  Zap,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { landingPathForRole, safeRedirectPath } from '@/lib/safe-redirect';
import { PapuanBorderCorner } from '@/components/PapuanMotif';
import Navbar from '@/components/Navbar';
import { Bento, BentoCard } from '@/components/ui/Bento';

/** Halaman masuk untuk seluruh staf yayasan (bukan hanya administrator). */
export default function StaffLoginPage() {
  const router = useRouter();
  const { user, isInitialized, loginWithEmailPassword, resetPassword, isLoading, authError, clearAuthError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [resetting, setResetting] = useState(false);

  // Dibaca dari window (bukan useSearchParams) agar halaman tetap bisa di-prerender statis.
  // Sudah login? Jangan tampilkan formulir lagi — langsung ke tujuan yang berwenang.
  useEffect(() => {
    if (!isInitialized || !user) return;
    const nextParam = new URLSearchParams(window.location.search).get('next');
    router.replace(safeRedirectPath(nextParam, landingPathForRole(user.role)));
  }, [isInitialized, user, router]);

  const handleForgotPassword = async () => {
    setLocalError('');
    setInfoMessage('');
    clearAuthError();
    if (!email.trim()) {
      setLocalError('Isi email Anda terlebih dahulu, lalu klik tautan ini untuk menerima email pembuatan kata sandi.');
      return;
    }
    setResetting(true);
    const result = await resetPassword(email.trim());
    setResetting(false);
    if (result.ok) setInfoMessage(result.message);
    else setLocalError(result.message);
  };

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setInfoMessage('');
    clearAuthError();

    if (!email.trim() || !password.trim()) {
      setLocalError('Mohon isi email dan kata sandi.');
      return;
    }

    const success = await loginWithEmailPassword(email.trim(), password);
    // Redirect ditangani effect di atas setelah profil & role tersedia.
    if (!success) setPassword('');
  };

  const errorText = localError || authError;
  const busy = isLoading || resetting;

  return (
    <div className="dock-safe relative min-h-[100dvh] flex flex-col bg-[#f6f4ee] dark:bg-[#07130f] papuan-pattern-overlay text-stone-900 dark:text-slate-100 selection:bg-amber-500 selection:text-black">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 pb-6 w-full max-w-md md:max-w-4xl mx-auto">
       <Bento className="w-full items-stretch">
        <BentoCard span="twoThirds" className="relative overflow-hidden !p-6 sm:!p-8">
          <PapuanBorderCorner position="top-right" />
          <PapuanBorderCorner position="bottom-left" />

          <div className="text-center mb-6 relative z-10">
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-900 border-2 border-amber-400/50 text-white mx-auto flex items-center justify-center shadow-xl shadow-black/30 mb-3">
              <ShieldCheck className="w-7 h-7 text-amber-200" />
            </div>

            <h1 className="text-2xl font-bold text-stone-900 dark:text-white">Masuk Staf</h1>
            <p className="text-sm text-stone-600 dark:text-slate-300 mt-1 leading-relaxed">
              Gunakan email dan kata sandi akun staf Anda. Setelah masuk, Anda bisa langsung membuka aplikasi kerja
              tanpa login ulang.
            </p>
          </div>

          {errorText && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-red-950/80 border border-rose-300 dark:border-red-500/40 text-rose-800 dark:text-red-200 text-xs flex items-start gap-2 relative z-10"
            >
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-red-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorText}</span>
            </div>
          )}

          {infoMessage && (
            <div
              role="status"
              className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-200 text-xs relative z-10"
            >
              {infoMessage}
            </div>
          )}

          <form onSubmit={handleEmailPasswordSubmit} className="space-y-4 relative z-10">
            <div>
              <label htmlFor="login-email" className="flex items-center gap-1 text-xs font-bold text-stone-700 dark:text-slate-300 mb-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Email</span>
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                required
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                enterKeyHint="next"
                aria-invalid={Boolean(errorText) || undefined}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@rumahetnikpapua.org"
                className="w-full h-12 px-3.5 rounded-xl bg-stone-50 dark:bg-[#06140e] border border-stone-300 dark:border-amber-500/30 text-sm text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="flex items-center gap-1 text-xs font-bold text-stone-700 dark:text-slate-300 mb-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Kata sandi</span>
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  enterKeyHint="go"
                  aria-invalid={Boolean(errorText) || undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full h-12 pl-3.5 pr-12 rounded-xl bg-stone-50 dark:bg-[#06140e] border border-stone-300 dark:border-amber-500/30 text-sm text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  aria-pressed={showPassword}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-lg text-stone-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={busy}
                className="mt-2 text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 underline underline-offset-2 cursor-pointer disabled:opacity-50"
              >
                {resetting ? 'Mengirim email…' : 'Lupa kata sandi / buat kata sandi baru?'}
              </button>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full h-12 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-extrabold text-sm shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer border border-amber-400/40 disabled:opacity-50 mt-3"
            >
              {isLoading ? (
                <span>Memeriksa akun…</span>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 text-amber-200" />
                  <span>Masuk Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <Link
            href="/"
            className="relative z-10 mt-4 h-11 flex items-center justify-center gap-2 rounded-xl text-xs font-bold text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
        </BentoCard>

        <BentoCard span="thirdWide" tone="emerald" className="flex flex-col gap-4">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Setelah masuk
          </p>
          <ul className="space-y-3.5">
            {[
              { icon: Zap, title: 'Satu kali masuk', desc: 'Aplikasi kerja yang sudah terhubung terbuka tanpa kata sandi lagi.' },
              { icon: ShieldCheck, title: 'Izin sesuai jabatan', desc: 'Menu yang muncul mengikuti kewenangan akun Anda.' },
              { icon: Smartphone, title: 'Bisa dipasang di HP', desc: 'Portal berjalan seperti aplikasi, termasuk saat sinyal lemah.' },
            ].map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-white/80 dark:bg-white/10 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-bold">{title}</span>
                  <span className="block mt-0.5 text-[11px] text-stone-600 dark:text-slate-300 leading-relaxed">{desc}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-auto text-[11px] text-stone-500 dark:text-slate-400 leading-relaxed">
            Belum punya akun staf? Ajukan akses dari halaman Beranda atau Aplikasi.
          </p>
        </BentoCard>
       </Bento>
      </main>
    </div>
  );
}
