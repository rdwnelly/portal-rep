'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Download, X, Sparkles } from 'lucide-react';
import { PapuanBorderCorner } from './PapuanMotif';

interface PWAInstallBannerProps {
  onOpenModal: () => void;
}

export default function PWAInstallBanner({ onOpenModal }: PWAInstallBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already in standalone PWA mode
    const isStandalone =
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true);

    const dismissed = sessionStorage.getItem('portal_rep_pwa_banner_dismissed');

    if (!isStandalone && !dismissed) {
      // Show after 2 seconds for a non-intrusive, welcoming feel
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    sessionStorage.setItem('portal_rep_pwa_banner_dismissed', 'true');
  };

  if (!isVisible || isDismissed) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="relative rounded-2xl glass-panel bg-[#091f16]/95 border-2 border-amber-500/40 shadow-2xl p-4 overflow-hidden backdrop-blur-xl">
        <PapuanBorderCorner />

        <div className="flex items-start gap-3.5 relative z-10">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-amber-400/50 shadow-md shrink-0 bg-[#0d281e]">
            <Image
              src="/images/rep-logo.jpg"
              alt="Logo PORTAL REP"
              width={48}
              height={48}
              className="object-cover"
            />
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2 py-0.2 rounded border border-amber-500/30">
                Aplikasi HP
              </span>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Akses Cepat 1-Ketuk
              </span>
            </div>

            <h4 className="text-xs font-black text-white leading-snug">
              Pasang PORTAL REP di Layar Utama HP
            </h4>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-tight line-clamp-2">
              Jadikan seperti aplikasi resmi tanpa perlu login berulang & hemat kuota.
            </p>

            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => {
                  handleDismiss();
                  onOpenModal();
                }}
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-extrabold text-xs shadow-md shadow-amber-950/60 transition-all cursor-pointer active:scale-95 border border-amber-400/30"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Pasang Sekarang</span>
              </button>

              <button
                onClick={handleDismiss}
                className="text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1 cursor-pointer"
              >
                Nanti saja
              </button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="absolute top-0 right-0 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
