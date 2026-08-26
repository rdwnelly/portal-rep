'use client';

import React, { useState, useEffect } from 'react';
import { AppItem, UserProfile } from '@/lib/types';
import {
  X,
  ShieldCheck,
  CheckCircle,
  Copy,
  Check,
  ArrowUpRight
} from 'lucide-react';

interface AppLauncherModalProps {
  app: AppItem | null;
  user: UserProfile | null;
  onClose: () => void;
}

export default function AppLauncherModal({ app, user, onClose }: AppLauncherModalProps) {
  const [copied, setCopied] = useState(false);
  const [authStep, setAuthStep] = useState(1);

  useEffect(() => {
    if (app) {
      const timer1 = setTimeout(() => setAuthStep(2), 400);
      const timer2 = setTimeout(() => setAuthStep(3), 800);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [app]);

  if (!app) return null;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(app.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDirectLaunch = () => {
    window.open(app.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl glass-panel bg-[#091c15] border border-amber-500/40 shadow-2xl p-6 overflow-hidden">
        {/* Top Glow Accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-all border border-slate-700"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-amber-900 border border-amber-400/40 flex items-center justify-center shadow-lg">
            <span className="text-sm font-black text-amber-200">{app.shortCode}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                {app.badgeText}
              </span>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                Single Sign-On Ready
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-white">{app.title}</h2>
          </div>
        </div>

        {/* SSO Handshake Status Flow */}
        <div className="p-4 rounded-xl bg-[#0e291e]/90 border border-amber-500/20 mb-5 space-y-2.5">
          <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Autentikasi Terpadu Rumah Etnik Papua</span>
          </p>

          <div className="space-y-1.5 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-3.5 h-3.5 ${authStep >= 1 ? 'text-emerald-400' : 'text-slate-600'}`} />
              <span className={authStep >= 1 ? 'text-slate-200' : 'text-slate-500'}>
                Identitas Staf: <strong>{user?.displayName || 'Pengguna'}</strong> ({user?.roleTitle})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-3.5 h-3.5 ${authStep >= 2 ? 'text-emerald-400' : 'text-slate-600'}`} />
              <span className={authStep >= 2 ? 'text-slate-200' : 'text-slate-500'}>
                Email Whitelist: <strong>{user?.email}</strong> (Terverifikasi)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-3.5 h-3.5 ${authStep >= 3 ? 'text-emerald-400' : 'text-slate-600'}`} />
              <span className={authStep >= 3 ? 'text-emerald-300 font-semibold' : 'text-slate-500'}>
                Koneksi Aman Siap Diluncurkan
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Explanation */}
        <div className="mb-5 text-xs text-slate-300 bg-[#06140e] p-3.5 rounded-xl border border-slate-800">
          <p className="font-semibold text-slate-200 mb-1">Keterangan Modul:</p>
          <p className="leading-relaxed">{app.fullDetails || app.description}</p>
        </div>

        {/* URL Target & Copy */}
        <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-black/40 border border-amber-500/15 mb-5 text-xs">
          <span className="font-mono text-[11px] text-amber-300 truncate">{app.url}</span>
          <button
            onClick={handleCopyLink}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center gap-1 shrink-0 border border-slate-600"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Disalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Salin Link</span>
              </>
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Kembali
          </button>
          <button
            onClick={handleDirectLaunch}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-white text-xs font-bold shadow-lg shadow-amber-950/60 active:scale-95 transition-all"
          >
            <span>Buka Sistem Sekarang</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
