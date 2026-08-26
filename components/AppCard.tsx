'use client';

import React from 'react';
import { AppItem, UserRole } from '@/lib/types';
import {
  BedDouble,
  Landmark,
  ShoppingBag,
  Camera,
  ShieldCheck,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PapuanBorderCorner } from './PapuanMotif';

const ICON_MAP: Record<string, React.ElementType> = {
  BedDouble,
  Landmark,
  ShoppingBag,
  Camera,
};

interface AppCardProps {
  app: AppItem;
  userRole?: UserRole;
  onLaunch: (app: AppItem) => void;
}

export default function AppCard({ app, onLaunch }: AppCardProps) {
  const IconComponent = ICON_MAP[app.iconName] || Layers;

  const handleLaunchClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.8 },
        colors: ['#e5a93c', '#0f382a', '#c28844', '#10b981'],
      });
    }
    onLaunch(app);
  };

  return (
    <div
      className="group relative rounded-2xl glass-panel glass-panel-hover overflow-hidden flex flex-col justify-between transition-all duration-300 border border-amber-500/20 hover:border-amber-400/50 bg-[#0c241b]/80"
    >
      <PapuanBorderCorner />

      {/* Card Header & Badge */}
      <div className="p-6 pb-4 relative z-10">
        <div className="flex items-start justify-between gap-3 mb-4">
          {/* App Icon Container */}
          <div
            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${app.colorTheme.from} ${app.colorTheme.to} flex items-center justify-center shadow-lg shadow-black/40 border border-amber-400/30 group-hover:scale-105 group-hover:border-amber-300 transition-transform duration-300`}
          >
            <IconComponent className="w-7 h-7 text-amber-200" />
          </div>

          {/* Status & Category Pills */}
          <div className="flex flex-col items-end gap-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {app.status === 'ONLINE' ? 'Aktif (Live)' : app.status}
            </span>
            <span className="text-[10px] font-semibold text-amber-400/90 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-500/30">
              {app.badgeText}
            </span>
          </div>
        </div>

        {/* Title and Shortcode */}
        <div className="mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-widest text-amber-500 uppercase">
              {app.shortCode}
            </span>
            <span className="text-[10px] text-slate-400">• SSO Integrated</span>
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors mt-0.5 leading-snug">
            {app.title}
          </h3>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
          {app.description}
        </p>

        {/* Stats Snippet */}
        {app.stats && (
          <div className="mt-3.5 pt-3 border-t border-amber-500/15 flex items-center gap-2 text-[11px] text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{app.stats}</span>
          </div>
        )}
      </div>

      {/* Card Action Footer */}
      <div className="p-4 pt-2 bg-[#091a13]/90 border-t border-amber-500/15 flex items-center justify-between gap-2 relative z-10">
        <div className="text-[10px] text-slate-400 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Akses Terverifikasi</span>
        </div>

        <button
          onClick={handleLaunchClick}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-white text-xs font-bold shadow-md shadow-amber-950/60 hover:shadow-amber-600/30 transition-all active:scale-95"
        >
          <span>Buka Aplikasi</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
