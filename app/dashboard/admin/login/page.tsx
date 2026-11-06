'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertTriangle,
  KeyRound
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { safeRedirectPath } from '@/lib/safe-redirect';
import { PapuanBorderCorner } from '@/components/PapuanMotif';
import Navbar from '@/components/Navbar';

export default function AdminLoginPage() {
  const router = useRouter();
  const { loginWithEmailPassword, resetPassword, isLoading, authError, clearAuthError } = useAuth();
  const [infoMessage, setInfoMessage] = useState('');

  const handleForgotPassword = async () => {
    setLocalError('');
    setInfoMessage('');
    clearAuthError();
    const result = await resetPassword(email);
    if (result.ok) setInfoMessage(result.message);
    else setLocalError(result.message);
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

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
    if (success) {
      router.push(safeRedirectPath(new URLSearchParams(window.location.search).get('next')));
    }
  };

  return (
    <div className="dock-safe relative min-h-[100dvh] flex flex-col bg-[#07130f] papuan-pattern-overlay text-slate-100 selection:bg-amber-500 selection:text-black">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 pb-6 w-full max-w-md mx-auto my-auto">
        <div className="relative w-full rounded-3xl glass-panel bg-[#091e16]/95 border-2 border-amber-500/40 shadow-2xl overflow-hidden p-6 sm:p-8">
          <PapuanBorderCorner position="top-right" />
          <PapuanBorderCorner position="bottom-left" />

          {/* Header */}
          <div className="text-center mb-6 relative z-10">
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-900 border-2 border-amber-400/50 text-white mx-auto flex items-center justify-center shadow-xl shadow-black/50 mb-3">
              <ShieldCheck className="w-7 h-7 text-amber-300" />
            </div>

            <h1 className="text-2xl font-bold text-white">Masuk Staf</h1>
            <p className="text-sm text-slate-300 mt-1 leading-relaxed">Gunakan email dan kata sandi akun staf Anda.</p>
          </div>

          {/* Error Banner */}
          {(localError || authError) && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs flex items-start gap-2 relative z-10 animate-in fade-in duration-200">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{localError || authError}</span>
            </div>
          )}

          {infoMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs relative z-10">
              {infoMessage}
            </div>
          )}

          {/* Main Form: Email & Password */}
          <form onSubmit={handleEmailPasswordSubmit} className="space-y-4 relative z-10">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>Email</span>
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
                <span>Kata sandi</span>
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
              <button
                type="button"
                onClick={handleForgotPassword}
                className="mt-2 text-[11px] font-bold text-amber-400 hover:text-amber-300 underline underline-offset-2 cursor-pointer"
              >
                Lupa kata sandi / buat kata sandi baru?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-extrabold text-xs shadow-lg shadow-amber-950/60 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-amber-400/40 disabled:opacity-50 mt-3"
            >
              {isLoading ? (
                <span>Memeriksa akun…</span>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 text-amber-300" />
                  <span>Masuk Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>
      </main>
    </div>
  );
}
