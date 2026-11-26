import React from 'react';
import {
  BedDouble,
  Building2,
  CalendarCheck,
  Clapperboard,
  ReceiptText,
  Store,
  Wallet,
  Warehouse,
} from 'lucide-react';
import type { AppCategory, AppItem } from '@/lib/types';

type Glyph = 'bed' | 'wallet' | 'receipt' | 'warehouse' | 'film' | 'calendar' | 'store' | 'building';

interface Visual {
  glyph: Glyph;
  /** Latar ikon yang lembut + warna garis ikon, untuk tema terang & gelap. */
  tone: string;
  /** Gradasi penuh untuk gaya "ikon aplikasi" (glyph putih). */
  solid: string;
}

const SOLID = {
  emerald: 'bg-gradient-to-br from-emerald-400 to-teal-600 shadow-emerald-900/25',
  amber: 'bg-gradient-to-br from-amber-300 to-orange-500 shadow-orange-900/25',
  orange: 'bg-gradient-to-br from-orange-400 to-rose-500 shadow-rose-900/25',
  teal: 'bg-gradient-to-br from-cyan-400 to-blue-600 shadow-blue-900/25',
  violet: 'bg-gradient-to-br from-violet-400 to-fuchsia-600 shadow-fuchsia-900/25',
  slate: 'bg-gradient-to-br from-stone-400 to-stone-700 shadow-stone-900/25',
};

const TONES = {
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20',
  orange: 'bg-orange-50 text-orange-700 ring-orange-100 dark:bg-orange-400/10 dark:text-orange-300 dark:ring-orange-400/20',
  teal: 'bg-teal-50 text-teal-700 ring-teal-100 dark:bg-teal-400/10 dark:text-teal-300 dark:ring-teal-400/20',
  violet: 'bg-violet-50 text-violet-700 ring-violet-100 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/20',
  slate: 'bg-stone-100 text-stone-700 ring-stone-200 dark:bg-white/10 dark:text-slate-200 dark:ring-white/15',
};

/** Ikon menurut fungsi aplikasi (nama ikon tersimpan di data aplikasi). */
const BY_ICON_NAME: Record<string, Visual> = {
  BedDouble: { glyph: 'bed', tone: TONES.emerald, solid: SOLID.emerald },
  Landmark: { glyph: 'wallet', tone: TONES.amber, solid: SOLID.amber },
  Wallet: { glyph: 'wallet', tone: TONES.amber, solid: SOLID.amber },
  ShoppingBag: { glyph: 'receipt', tone: TONES.orange, solid: SOLID.orange },
  ReceiptText: { glyph: 'receipt', tone: TONES.orange, solid: SOLID.orange },
  Package: { glyph: 'warehouse', tone: TONES.teal, solid: SOLID.teal },
  Boxes: { glyph: 'warehouse', tone: TONES.teal, solid: SOLID.teal },
  Warehouse: { glyph: 'warehouse', tone: TONES.teal, solid: SOLID.teal },
  Camera: { glyph: 'film', tone: TONES.violet, solid: SOLID.violet },
  Clapperboard: { glyph: 'film', tone: TONES.violet, solid: SOLID.violet },
};

/** Cadangan untuk aplikasi baru dari panel admin (ikon generik) — menurut kategorinya. */
const BY_CATEGORY: Record<AppCategory, Visual> = {
  OPERASIONAL: { glyph: 'calendar', tone: TONES.emerald, solid: SOLID.emerald },
  KEUANGAN: { glyph: 'wallet', tone: TONES.amber, solid: SOLID.amber },
  GUDANG_POS: { glyph: 'store', tone: TONES.orange, solid: SOLID.orange },
  MEDIA_KREATIF: { glyph: 'film', tone: TONES.violet, solid: SOLID.violet },
  ADMINISTRASI: { glyph: 'building', tone: TONES.slate, solid: SOLID.slate },
};

export const CATEGORY_LABEL: Record<AppCategory, string> = {
  OPERASIONAL: 'Operasional',
  KEUANGAN: 'Keuangan',
  GUDANG_POS: 'Kasir & Gudang',
  MEDIA_KREATIF: 'Media & Kreatif',
  ADMINISTRASI: 'Administrasi',
};

function visualFor(app: Pick<AppItem, 'iconName' | 'category'>): Visual {
  return BY_ICON_NAME[app.iconName] ?? BY_CATEGORY[app.category] ?? BY_CATEGORY.ADMINISTRASI;
}

function Glyph({ glyph, className }: { glyph: Glyph; className: string }) {
  switch (glyph) {
    case 'bed':
      return <BedDouble className={className} strokeWidth={1.75} />;
    case 'wallet':
      return <Wallet className={className} strokeWidth={1.75} />;
    case 'receipt':
      return <ReceiptText className={className} strokeWidth={1.75} />;
    case 'warehouse':
      return <Warehouse className={className} strokeWidth={1.75} />;
    case 'film':
      return <Clapperboard className={className} strokeWidth={1.75} />;
    case 'calendar':
      return <CalendarCheck className={className} strokeWidth={1.75} />;
    case 'store':
      return <Store className={className} strokeWidth={1.75} />;
    default:
      return <Building2 className={className} strokeWidth={1.75} />;
  }
}

const SIZES = {
  md: { box: 'w-12 h-12 rounded-[0.9rem]', icon: 'w-6 h-6' },
  lg: { box: 'w-16 h-16 rounded-[1.2rem]', icon: 'w-8 h-8' },
};

/**
 * Ikon aplikasi, seragam di seluruh portal.
 *  • soft  : latar lembut + garis berwarna (panel admin).
 *  • solid : gradasi penuh + glyph putih, gaya ikon aplikasi di HP (halaman Aplikasi).
 */
export default function AppIcon({
  app,
  size = 'md',
  variant = 'soft',
}: {
  app: Pick<AppItem, 'iconName' | 'category'>;
  size?: keyof typeof SIZES;
  variant?: 'soft' | 'solid';
}) {
  const { glyph, tone, solid } = visualFor(app);
  const look =
    variant === 'solid'
      ? `${solid} text-white shadow-lg ring-1 ring-inset ring-white/25`
      : `${tone} ring-1 ring-inset`;
  return (
    <span aria-hidden className={`${SIZES[size].box} ${look} flex items-center justify-center shrink-0`}>
      <Glyph glyph={glyph} className={SIZES[size].icon} />
    </span>
  );
}
