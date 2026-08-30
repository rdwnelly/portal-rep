'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  const { loginWithEmailPassword, isLoading, authError, clearAuthError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearAuthError();

    if (!email.trim() || !password.trim()) {
      setLocalError('Mohon isi email dan kata sandi.');
      return;
    }

    const success = await loginWithEmailPassword(email.trim(), password);
    if (success) {
      if (typeof window !== 'undefined') {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#e5a93c', '#113527', '#10b981', '#a855f7'],
        });
      }
      router.push('/dashboard/admin');
    }
  };

  return (
    <div className="relative min-h-[100dvh] flex flex-col bg-[#07130f] papuan-pattern-overlay text-slate-100 selection:bg-amber-500 selection:text-black">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 pb-28 sm:pb-12 w-full max-w-md mx-auto my-auto">
        <div className="relative w-full rounded-3xl glass-panel bg-[#091e16]/95 border-2 border-amber-500/40 shadow-2xl overflow-hidden p-6 sm:p-8">
          <PapuanBorderCorner position="top-right" />
          <PapuanBorderCorner position="bottom-left" />

          {/* Ambient Glows */}
          <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="text-center mb-6 relative z-10">
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-900 border-2 border-amber-400/50 text-white mx-auto flex items-center justify-center shadow-xl shadow-black/50 mb-3">
              <ShieldCheck className="w-7 h-7 text-amber-300" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[10px] font-extrabold uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3" />
              <span>Firebase Authentication</span>
            </div>

            <h1 className="text-2xl font-black text-white">Login Portal REP</h1>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Masuk dengan <strong>Email & Password</strong> terdaftar di Firebase untuk mengakses portal yayasan.
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
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>Email Terdaftar</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@rumahetnikpapua.org"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-amber-500/30 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Kata Sandi (Password)</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#06140e] border border-amber-500/30 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-300 p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-extrabold text-xs shadow-lg shadow-amber-950/60 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-amber-400/40 disabled:opacity-50 mt-3"
            >
              {isLoading ? (
                <span>Memverifikasi akun di Firebase...</span>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 text-amber-300" />
                  <span>Masuk Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-800 text-center relative z-10">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-300 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Beranda Portal</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
