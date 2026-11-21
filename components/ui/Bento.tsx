import React from 'react';

/**
 * Tata letak bento: satu kisi 6 kolom (2 kolom di HP) tempat setiap kartu memilih lebarnya.
 * Dipakai seragam di semua halaman agar jarak, sudut, dan bayangan kartu konsisten.
 */

type Span = 'third' | 'thirdWide' | 'half' | 'twoThirds' | 'full';

/** Lebar kartu: di HP hanya ada 1 atau 2 kolom; mulai md: barulah kisi 6 kolom dipakai. */
const SPAN_CLASS: Record<Span, string> = {
  third: 'col-span-1 md:col-span-2',
  // Selebar layar di HP, sepertiga mulai md: — untuk isi yang terlalu sempit di 1 kolom HP.
  thirdWide: 'col-span-2 md:col-span-2',
  half: 'col-span-2 md:col-span-3',
  twoThirds: 'col-span-2 md:col-span-4',
  full: 'col-span-2 md:col-span-6',
};

export function Bento({
  children,
  className = '',
  as: Tag = 'div',
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'ul' | 'section';
  'aria-labelledby'?: string;
  'aria-label'?: string;
}) {
  return (
    <Tag className={`grid grid-cols-2 md:grid-cols-6 gap-3 sm:gap-4 ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

/** Permukaan kartu standar (tanpa kisi) — untuk kartu tunggal di luar bento. */
export const CARD_SURFACE =
  'rounded-3xl bg-white dark:bg-[#0c241b] border border-stone-200/90 dark:border-white/10 ' +
  'shadow-[0_1px_2px_rgba(16,24,20,0.04),0_10px_28px_-18px_rgba(16,24,20,0.18)] dark:shadow-none';

interface BentoCardProps {
  span?: Span;
  /** false bila isi kartu sudah membawa permukaannya sendiri — hanya lebar kisi yang dipakai. */
  surface?: boolean;
  /** Aksen latar lembut untuk kartu yang perlu menonjol. */
  tone?: 'plain' | 'emerald' | 'amber' | 'forest';
  /** Render sebagai elemen lain, mis. 'section' atau 'li'. */
  as?: 'div' | 'section' | 'li' | 'article';
  className?: string;
  children: React.ReactNode;
  /** Atribut aksesibilitas yang diteruskan ke elemen pembungkus. */
  'aria-labelledby'?: string;
  'aria-label'?: string;
}

const TONE_CLASS: Record<NonNullable<BentoCardProps['tone']>, string> = {
  plain: '',
  emerald: 'bg-emerald-50/80 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-400/20',
  amber: 'bg-amber-50/80 dark:bg-amber-500/10 border-amber-200 dark:border-amber-400/25',
  forest: 'bg-gradient-to-br from-[#123a2b] to-[#0d2a1f] border-white/10 text-white',
};

export function BentoCard({
  span = 'full',
  tone = 'plain',
  surface = true,
  as: Tag = 'div',
  className = '',
  children,
  ...rest
}: BentoCardProps) {
  const look = surface ? `${CARD_SURFACE} ${TONE_CLASS[tone]} p-4 sm:p-5` : '';
  return (
    <Tag className={`${SPAN_CLASS[span]} ${look} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

/**
 * Judul di dalam kartu: label kecil di atas, judul, lalu tombol aksi di kanan.
 * `as` menjaga urutan heading tiap halaman tetap benar (h1 → h2 → h3).
 */
export function CardTitle({
  eyebrow,
  title,
  id,
  as: Tag = 'h2',
  action,
  icon: Icon,
  iconTone = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
}: {
  eyebrow?: string;
  title: string;
  id?: string;
  as?: 'h1' | 'h2' | 'h3';
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  iconTone?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <span className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${iconTone}`}>
            <Icon className="w-5 h-5" />
          </span>
        )}
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              {eyebrow}
            </p>
          )}
          <Tag id={id} className="text-[15px] sm:text-base font-bold leading-snug">
            {title}
          </Tag>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** Angka tunggal di dalam kartu bento. `value` sudah diformat oleh pemanggil. */
export function Stat({
  label,
  value,
  unit,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  hint?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-xl sm:text-2xl font-black leading-none tabular-nums">
        {value}
        {unit && <span className="ml-1 text-xs font-semibold text-stone-500 dark:text-slate-400">{unit}</span>}
      </p>
      {hint && <p className="mt-1 text-[11px] text-stone-500 dark:text-slate-400 line-clamp-2">{hint}</p>}
    </div>
  );
}
