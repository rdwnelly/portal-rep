'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import Image from 'next/image';
import {
  ShieldCheck,
  Sparkles,
  MapPin,
  Lock,
  Users,
  CheckCircle2
} from 'lucide-react';
import AccessDeniedModal from '@/components/AccessDeniedModal';
import { PapuanMotifDivider } from '@/components/PapuanMotif';

export default function LoginPage() {
  const { user, loginWithGoogle, loginAsDemo, isLoading, isWhitelisted } = useAuth();

  useEffect(() => {
    if (user && isWhitelisted && typeof window !== 'undefined') {
      window.location.replace('/dashboard');
    }
  }, [user, isWhitelisted]);

  const handleGoogleLogin = async () => {
    await loginWithGoogle();
  };

  const handleQuickDemoLogin = (roleKey: 'FRICKY' | 'MITSHI' | 'RIDWAN' | 'FRONTDESK' | 'FINANCE' | 'UNAUTHORIZED_DEMO') => {
    loginAsDemo(roleKey);
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#07130f] papuan-pattern-overlay text-slate-100 overflow-x-hidden selection:bg-amber-500 selection:text-black">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 w-full border-b border-amber-500/15 bg-[#091b14]/70 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-amber-500/30 bg-[#0d281e] flex items-center justify-center shadow-md">
            <Image
              src="/images/rep-logo.jpg"
              alt="Logo Yayasan Rumah Etnik Papua"
              width={40}
              height={40}
              className="object-cover"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-wider text-amber-400">
                PORTAL REP
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-500/30">
                V2.0
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              Yayasan Rumah Etnik Papua
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-300 bg-[#0d261d] px-3 py-1.5 rounded-lg border border-emerald-500/20">
          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="hidden sm:inline text-[11px]">Sorong, Papua Barat Daya</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 my-auto">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Hero Cultural Card */}
          <div className="lg:col-span-6 rounded-3xl glass-panel bg-[#0b2118]/85 border border-amber-500/25 p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-950 to-emerald-950 border border-amber-500/40 text-[11px] font-bold text-amber-300 mb-6 shadow-inner">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Single Sign-On (SSO) Ekosistem Digital</span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-3">
                Pusat Operasional Rumah Terpadu{' '}
                <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-300 bg-clip-text text-transparent">
                  Aplikasi Layanan REP
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                Satu pintu masuk terintegrasi (*Single Source of Truth*) untuk seluruh layanan operasional, reservasi homestay, pembukuan keuangan SIK-REP, kasir POS & logistik OMG, serta studio kreatif Yayasan Rumah Etnik Papua.
              </p>

              <PapuanMotifDivider className="my-5" />

              {/* Integrated Apps Checklist */}
              <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-200">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-[#0e2c20] border border-amber-500/15">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Reservasi & Tiket</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-[#0e2c20] border border-amber-500/15">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>SIK-REP Keuangan</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-[#0e2c20] border border-amber-500/15">
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  <span>POS Kasir & Gudang</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-[#0e2c20] border border-amber-500/15">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>zeestudio Media</span>
                </div>
              </div>
            </div>

            {/* Bottom Info */}
            <div className="relative z-10 pt-6 mt-6 border-t border-amber-500/15 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Whitelist Security Active
              </span>
              <span>PWA Ready 📱</span>
            </div>
          </div>

          {/* Right Column: Authentication Card */}
          <div className="lg:col-span-6 rounded-3xl glass-panel bg-[#091a13]/90 border border-amber-500/30 p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
            <div>
              <div className="text-center mb-6">
                <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-amber-600/30 to-emerald-700/30 border border-amber-400/30 text-amber-400 mb-3">
                  <Lock className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-extrabold text-white">Gerbang Autentikasi Staf</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Masuk menggunakan Akun Google resmi yang telah di-whitelist
                </p>
              </div>

              {/* Main Google SSO Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full relative z-20 flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-white hover:bg-slate-100 active:scale-[0.98] text-slate-900 font-bold text-sm shadow-xl shadow-amber-950/40 transition-all mb-4 border border-slate-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin shrink-0" />
                ) : (
                  <svg className="w-5 h-5 shrink-0" width="20" height="20" viewBox="0 0 24 24">
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
                )}
                <span>{isLoading ? 'Menghubungkan Google...' : 'Masuk dengan Google SSO'}</span>
              </button>

              <div className="relative flex items-center justify-center my-5">
                <div className="border-t border-amber-500/20 w-full" />
                <span className="bg-[#091a13] px-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Atau Uji Coba Cepat (Demo Staf)
                </span>
                <div className="border-t border-amber-500/20 w-full" />
              </div>

              {/* Fast Role Simulator for Instant Testing */}
              <div className="space-y-2 text-xs">
                <p className="text-[11px] font-semibold text-amber-400 flex items-center gap-1.5 mb-1.5">
                  <Users className="w-3.5 h-3.5" /> Pilih Akun Demo Terdaftar:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('RIDWAN')}
                    className="p-2.5 rounded-xl bg-[#0e2b1f] hover:bg-[#143d2c] active:scale-95 border border-purple-500/30 text-left transition-all group cursor-pointer"
                  >
                    <p className="font-bold text-purple-300 text-xs line-clamp-1">Ridwan Elly</p>
                    <p className="text-[10px] text-slate-400">IT Developer (Admin)</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('FRICKY')}
                    className="p-2.5 rounded-xl bg-[#0e2b1f] hover:bg-[#143d2c] active:scale-95 border border-amber-500/30 text-left transition-all group cursor-pointer"
                  >
                    <p className="font-bold text-amber-300 text-xs line-clamp-1">Bpk. Fricky Burdam</p>
                    <p className="text-[10px] text-slate-400">Ketua Yayasan</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('MITSHI')}
                    className="p-2.5 rounded-xl bg-[#0e2b1f] hover:bg-[#143d2c] active:scale-95 border border-amber-500/30 text-left transition-all group cursor-pointer"
                  >
                    <p className="font-bold text-amber-300 text-xs line-clamp-1">Ibu Mitshi Wanma</p>
                    <p className="text-[10px] text-slate-400">Pengurus Yayasan</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('FRONTDESK')}
                    className="p-2.5 rounded-xl bg-[#0e2b1f] hover:bg-[#143d2c] active:scale-95 border border-emerald-500/30 text-left transition-all group cursor-pointer"
                  >
                    <p className="font-bold text-emerald-300 text-xs line-clamp-1">Frontdesk / Cafe</p>
                    <p className="text-[10px] text-slate-400">Staf Operasional</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('FINANCE')}
                    className="p-2.5 rounded-xl bg-[#0e2b1f] hover:bg-[#143d2c] active:scale-95 border border-emerald-500/30 text-left transition-all group cursor-pointer"
                  >
                    <p className="font-bold text-emerald-300 text-xs line-clamp-1">Keuangan & OMG</p>
                    <p className="text-[10px] text-slate-400">SIK-REP / Gudang</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('UNAUTHORIZED_DEMO')}
                    className="p-2.5 rounded-xl bg-red-950/40 hover:bg-red-950/70 active:scale-95 border border-red-500/30 text-left transition-all group cursor-pointer"
                  >
                    <p className="font-bold text-red-300 text-xs line-clamp-1">Akun Luar (Tes Blok)</p>
                    <p className="text-[10px] text-red-400">Simulasi Non-Whitelist</p>
                  </button>
                </div>
              </div>
            </div>

            {/* Privacy & Security Note */}
            <div className="mt-6 pt-4 border-t border-amber-500/15 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Keamanan Google SSO & Firestore Rules</span>
              <span className="text-amber-400 font-medium">PORTAL REP 2026</span>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="relative z-10 w-full border-t border-amber-500/15 bg-[#091b14]/70 backdrop-blur-md px-4 sm:px-8 py-3.5 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>
          <strong>Yayasan Rumah Etnik Papua</strong> • Jalan Baru Aimas - Klamono Km. 21, Kabupaten Sorong, Papua Barat Daya
        </p>
        <p className="text-amber-400/80">
          Dikembangkan oleh: <strong>Ridwan Elly</strong> (IT Developer Internal)
        </p>
      </footer>

      {/* Access Denied Modal if unauthorized email */}
      <AccessDeniedModal />
    </div>
  );
}
