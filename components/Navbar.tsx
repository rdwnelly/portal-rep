'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  LayoutGrid,
  Bell,
  FileText,
  Menu,
  X,
  CalendarDays,
  BarChart3,
  ShieldCheck,
  Sun,
  Moon,
  Download,
  LogIn,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useAuth, isManagerRole } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import PWAInstallModal from '@/components/PWAInstallModal';

interface NavbarProps {
  /** Dipertahankan untuk kompatibilitas; modal pemasangan kini dikelola menu "Lainnya". */
  onOpenPwaModal?: () => void;
  hideHeaderOnHome?: boolean;
}

const DOCK_ITEMS = [
  { label: 'Beranda', href: '/', icon: Home, match: (p: string) => p === '/' },
  { label: 'Aplikasi', href: '/apps', icon: LayoutGrid, match: (p: string) => p === '/apps' || p === '/dashboard' },
  { label: 'Pengumuman', href: '/dashboard/notices', icon: Bell, match: (p: string) => p.startsWith('/dashboard/notices') },
  { label: 'Dokumen', href: '/dokumen', icon: FileText, match: (p: string) => p.startsWith('/dokumen') },
];

const MORE_PATHS = ['/agenda', '/eksekutif', '/dashboard/admin'];

/**
 * Navigasi utama: satu menu bawah berisi 5 tombol besar di semua ukuran layar.
 * Tidak ada header menu di atas — menu tambahan ada di lembar "Lainnya".
 */
export default function Navbar({ onOpenPwaModal }: NavbarProps) {
  const pathname = usePathname() || '/';
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [moreOpen, setMoreOpen] = useState(false);
  const [pwaOpen, setPwaOpen] = useState(false);

  const isManager = isManagerRole(user?.role);
  const moreActive = MORE_PATHS.some((p) => pathname.startsWith(p));

  // Tutup lembar "Lainnya" dengan tombol Escape.
  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMoreOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moreOpen]);

  const openInstall = () => {
    setMoreOpen(false);
    if (onOpenPwaModal) onOpenPwaModal();
    else setPwaOpen(true);
  };

  const itemClass = (active: boolean) =>
    `flex-1 min-w-0 h-14 px-0.5 flex flex-col items-center justify-center gap-1 rounded-2xl transition-colors ${
      active
        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold'
        : 'text-stone-500 dark:text-slate-400 hover:text-stone-800 dark:hover:text-white font-medium'
    }`;

  return (
    <>
      {/* Ruang aman untuk poni/status bar HP saat dipasang sebagai aplikasi (PWA). */}
      <div aria-hidden className="h-[env(safe-area-inset-top)]" />

      <div className="mobile-fixed-bottom-bar">
        <nav data-bottom-dock aria-label="Menu utama" className="mobile-bottom-dock gap-1">
          {DOCK_ITEMS.map(({ label, href, icon: Icon, match }) => {
            const active = match(pathname);
            return (
              <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={itemClass(active)}>
                <Icon className="w-[22px] h-[22px] shrink-0" />
                <span className="text-[10.5px] leading-none tracking-tight whitespace-nowrap">{label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            className={`${itemClass(moreActive)} cursor-pointer`}
          >
            <Menu className="w-[22px] h-[22px] shrink-0" />
            <span className="text-[10.5px] leading-none tracking-tight whitespace-nowrap">Lainnya</span>
          </button>
        </nav>
      </div>

      {moreOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label="Menu lainnya">
          <button
            type="button"
            aria-label="Tutup menu"
            className="absolute inset-0 bg-black/60 cursor-default"
            onClick={() => setMoreOpen(false)}
          />
          <div className="relative w-full max-w-md max-h-[85dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#0b2219] text-stone-900 dark:text-slate-100 border-t sm:border border-stone-200 dark:border-amber-500/25 shadow-2xl px-4 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-stone-300 dark:bg-slate-600 sm:hidden" aria-hidden />
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold">Menu</h2>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="w-10 h-10 -mr-2 flex items-center justify-center rounded-full text-stone-500 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-white/10 cursor-pointer"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {user ? (
              <div className="flex items-center gap-3 p-3 mb-3 rounded-2xl bg-stone-100 dark:bg-white/5">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold shrink-0">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{user.displayName}</p>
                  <p className="text-xs text-stone-500 dark:text-slate-400 truncate">{user.roleTitle}</p>
                </div>
              </div>
            ) : (
              <Link
                href={`/dashboard/admin/login?next=${encodeURIComponent(pathname)}`}
                onClick={() => setMoreOpen(false)}
                className="flex items-center justify-center gap-2 h-12 mb-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold"
              >
                <LogIn className="w-5 h-5" />
                Masuk (khusus staf)
              </Link>
            )}

            <ul className="divide-y divide-stone-100 dark:divide-white/5">
              <SheetLink href="/agenda" icon={CalendarDays} label="Agenda Budaya" onNavigate={() => setMoreOpen(false)} />
              {isManager && (
                <>
                  <SheetLink href="/eksekutif" icon={BarChart3} label="Dasbor Eksekutif" onNavigate={() => setMoreOpen(false)} />
                  <SheetLink href="/dashboard/admin" icon={ShieldCheck} label="Panel Admin" onNavigate={() => setMoreOpen(false)} />
                </>
              )}
              <li>
                <button type="button" onClick={toggleTheme} className={sheetRowClass}>
                  {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-500" />}
                  <span className="flex-1 text-left">{theme === 'dark' ? 'Tampilan Terang' : 'Tampilan Gelap'}</span>
                </button>
              </li>
              <li>
                <button type="button" onClick={openInstall} className={sheetRowClass}>
                  <Download className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="flex-1 text-left">Pasang di HP</span>
                </button>
              </li>
              {user && (
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false);
                      logout();
                    }}
                    className={`${sheetRowClass} text-rose-600 dark:text-rose-400`}
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="flex-1 text-left">Keluar</span>
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      <PWAInstallModal isOpen={pwaOpen} onClose={() => setPwaOpen(false)} />
    </>
  );
}

const sheetRowClass =
  'w-full h-14 flex items-center gap-3 px-1 text-sm font-medium cursor-pointer hover:bg-stone-50 dark:hover:bg-white/5 rounded-xl';

function SheetLink({
  href,
  icon: Icon,
  label,
  onNavigate,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onNavigate: () => void;
}) {
  return (
    <li>
      <Link href={href} onClick={onNavigate} className={sheetRowClass}>
        <Icon className="w-5 h-5 text-stone-500 dark:text-slate-400" />
        <span className="flex-1">{label}</span>
        <ChevronRight className="w-4 h-4 text-stone-400" />
      </Link>
    </li>
  );
}
