'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  KeyRound
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '@/lib/auth-context';
import { PapuanBorderCorner } from '@/components/PapuanMotif';
import Navbar from '@/components/Navbar';

export default function AdminLoginPage() {
  const router = useRouter();
  const { loginWithEmailPassword, loginWithGoogle, loginAsDemo, isLoading, authError, clearAuthError } = useAuth();
  
  const [email, setEmail] = useState('ridwanelly123@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearAuthError();

    if (!email.trim() || !password.trim()) {
      setLocalError('Mohon isi email dan kata sandi admin.');
      return;
    }

    const success = await loginWithEmailPassword(email.trim(), password);
    if (success) {
      if (typeof window !== 'undefined') {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#e5a93c', '#0f382a', '#10b981', '#a855f7'],
        });
      }
      router.push('/dashboard/admin');
    }
  };

  const handleGoogleLogin = async () => {
    setLocalError('');
    clearAuthError();
    await loginWithGoogle();
    router.push('/dashboard/admin');
  };

  const handleQuickRidwan = () => {
    loginAsDemo('RIDWAN');
    if (typeof window !== 'undefined') {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#e5a93c', '#0f382a', '#10b981', '#a855f7'],
      });
    }
    router.push('/dashboard/admin');
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#07130f] papuan-pattern-overlay text-slate-100 selection:bg-amber-500 selection:text-black">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 pb-32 md:pb-12">
        <div className="relative w-full max-w-md rounded-3xl glass-panel bg-[#091e16]/95 border-2 border-purple-500/40 shadow-2xl overflow-hidden p-6 sm:p-8">
          <PapuanBorderCorner />

          {/* Ambient Glows */}
          <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="text-center mb-6 relative z-10">
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-700 to-indigo-950 border-2 border-purple-400/50 text-purple-200 mx-auto flex items-center justify-center shadow-xl shadow-black/50 mb-3">
              <ShieldCheck className="w-8 h-8 text-purple-300" />
            </div>
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-[10px] font-extrabold uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3" />
              <span>Firebase Authentication</span>
            </div>

            <h1 className="text-2xl font-black text-white">
              Login Administrator
            </h1>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Masuk dengan <strong>Email & Password</strong> terdaftar di Firebase untuk mengelola seluruh sistem yayasan.
            </p>
          </div>

          {/* Error Banner */}
          {(localError || authError) && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs flex items-start gap-2 relative z-10 animate-in fade-in duration-200">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{localError || authError}</span>
            </div>
          )}

          {/* Main Form: Email & Password */}
          <form onSubmit={handleEmailPasswordSubmit} className="space-y-4 relative z-10">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-purple-400" />
                <span>Email Administrator</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ridwanelly123@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-purple-500/30 text-base sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-purple-400" />
                <span>Kata Sandi (Password)</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi Firebase"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#06140e] border border-purple-500/30 text-base sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-300 p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-600 hover:to-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-purple-950/60 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-purple-400/40 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Memverifikasi akun Firebase...</span>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 text-purple-300" />
                  <span>Masuk dengan Email & Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Alternative Auth Methods */}
          <div className="relative flex items-center justify-center my-5 relative z-10">
            <div className="border-t border-slate-700/80 w-full" />
            <span className="bg-[#091e16] px-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider whitespace-nowrap">
              Pilihan Masuk Lainnya
            </span>
            <div className="border-t border-slate-700/80 w-full" />
          </div>

          <div className="space-y-2.5 relative z-10">
            {/* Quick 1-Click Ridwan Elly */}
            <button
              type="button"
              onClick={handleQuickRidwan}
              className="w-full p-2.5 rounded-xl bg-[#0e2c20] hover:bg-[#143d2c] border border-amber-500/30 text-left transition-all flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-bold text-xs">
                  RE
                </div>
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-amber-300">Ridwan Elly</p>
                  <p className="text-[10px] text-amber-400">IT Developer / Super Admin</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-amber-400 group-hover:underline">1-Klik Masuk ➔</span>
            </button>

            {/* Google SSO */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
            >
              <svg className="w-4 h-4 shrink-0" width="16" height="16" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                />
              </svg>
              <span>Masuk via Google SSO Akun Admin</span>
            </button>
          </div>

          <div className="text-center mt-6 relative z-10">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Halaman Utama Portal</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
