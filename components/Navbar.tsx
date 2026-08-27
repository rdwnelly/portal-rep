'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Image from 'next/image';
import {
  Home,
  LayoutGrid,
  Bell,
  ShieldCheck,
  LogOut,
  Clock,
  Download,
  Menu,
  X,
  User,
  ChevronDown,
  Sun,
  Moon,
  MoreHorizontal
} from 'lucide-react';
import AdminLoginModal from '@/components/AdminLoginModal';
import PWAInstallModal from '@/components/PWAInstallModal';
import { useTheme } from '@/lib/theme-context';

interface NavbarProps {
  onOpenPwaModal?: () => void;
  hideHeaderOnHome?: boolean;
}

export default function Navbar({ onOpenPwaModal, hideHeaderOnHome = false }: NavbarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [timeWIT, setTimeWIT] = useState<string>('');
  const [dateWIT, setDateWIT] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [internalPwaModalOpen, setInternalPwaModalOpen] = useState(false);

  // Live WIT Clock (Sorong, Papua Barat Daya - UTC+9)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const optionsTime: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Jayapura',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      };
      const optionsDate: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Jayapura',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      };
      setTimeWIT(new Intl.DateTimeFormat('id-ID', optionsTime).format(now));
      setDateWIT(new Intl.DateTimeFormat('id-ID', optionsDate).format(now));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'IT_ADMIN':
        return 'bg-purple-900/60 text-purple-300 border-purple-500/40';
      case 'EXECUTIVE':
        return 'bg-amber-900/60 text-amber-300 border-amber-500/40';
      case 'FINANCE_WAREHOUSE':
        return 'bg-emerald-900/60 text-emerald-300 border-emerald-500/40';
      default:
        return 'bg-teal-900/60 text-teal-300 border-teal-500/40';
    }
  };

  const navLinks = [
    {
      label: 'Portal Aplikasi',
      href: '/',
      icon: LayoutGrid,
      active: pathname === '/' || pathname === '/dashboard',
    },
    {
      label: 'Pengumuman',
      href: '/dashboard/notices',
      icon: Bell,
      active: pathname === '/dashboard/notices',
    },
    {
      label: 'Kelola Sistem (Admin)',
      href: '/dashboard/admin',
      icon: ShieldCheck,
      active: pathname === '/dashboard/admin',
    },
  ];

  return (
    <>
      {(!hideHeaderOnHome || pathname !== '/') && (
        <header className="sticky top-0 z-40 w-full border-b border-amber-500/20 bg-[#081812]/90 backdrop-blur-md transition-all">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-18">
              {/* Brand Logo & Name */}
              <Link href="/" className="flex items-center gap-3 group">
                <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-amber-500/30 shadow-lg shadow-amber-950/40 group-hover:border-amber-400/60 transition-all flex items-center justify-center bg-[#0d281e]">
                  <Image
                    src="/images/rep-logo.jpg"
                    alt="Logo Rumah Etnik Papua"
                    width={44}
                    height={44}
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black tracking-tight text-white group-hover:text-amber-400 transition-colors">
                      PORTAL REP
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                      LIVE
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-300 font-medium hidden sm:inline">
                    Yayasan Rumah Etnik Papua
                  </span>
                </div>
              </Link>

              {/* Desktop Nav Links */}
              <nav className="hidden md:flex items-center gap-1 bg-[#0c241b] p-1.5 rounded-xl border border-amber-500/20">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        link.active
                          ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md shadow-amber-950/50'
                          : 'text-slate-300 hover:text-white hover:bg-emerald-900/40'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 text-amber-400" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Right Side Widgets: Clock, Theme, PWA & User Profile */}
              <div className="hidden lg:flex items-center gap-3">
                {/* Live WIT Clock */}
                <div
                  suppressHydrationWarning
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0d261d] border border-amber-500/20 text-xs font-mono text-amber-400 shadow-inner"
                  title="Waktu Indonesia Timur (WIT / UTC+9) - Sorong"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span suppressHydrationWarning className="font-bold">
                    {timeWIT || '00:00:00'} WIT
                  </span>
                  <span className="text-slate-400">|</span>
                  <span suppressHydrationWarning className="text-slate-300">
                    {dateWIT}
                  </span>
                </div>

                {/* Theme Toggle (Dark / Light Mode) */}
                <button
                  suppressHydrationWarning
                  onClick={toggleTheme}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0d261d] hover:bg-[#13382b] border border-amber-500/25 text-amber-400 hover:text-amber-300 transition-all cursor-pointer shadow-sm"
                  title={theme === 'dark' ? 'Ganti ke Mode Terang (Siang)' : 'Ganti ke Mode Gelap (Malam)'}
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="w-3.5 h-3.5 text-amber-300" />
                      <span className="text-[11px] font-bold text-amber-300">Siang</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-[11px] font-bold text-indigo-400">Malam</span>
                    </>
                  )}
                </button>

                {/* PWA Install Button */}
                {onOpenPwaModal && (
                  <button
                    onClick={onOpenPwaModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all"
                    title="Pasang di HP / Desktop"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PWA</span>
                  </button>
                )}

                {/* User Profile Chip & Dropdown or Admin Login Button */}
                {user ? (
                  <div className="relative">
                    <button
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                      className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-[#0e271e] border border-amber-500/25 hover:border-amber-400/50 transition-all text-left"
                    >
                      <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-amber-400/30 bg-amber-950/50 flex items-center justify-center">
                        {user.photoURL ? (
                          <Image
                            src={user.photoURL}
                            alt={user.displayName}
                            width={32}
                            height={32}
                            className="object-cover"
                          />
                        ) : (
                          <User className="w-4 h-4 text-amber-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-200 line-clamp-1 leading-tight">
                          {user.displayName}
                        </p>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getRoleBadgeStyle(
                            user.role
                          )}`}
                        >
                          {user.roleTitle}
                        </span>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
                    </button>

                    {/* User Dropdown Menu */}
                    {userDropdownOpen && (
                      <div
                        className="absolute right-0 mt-2 w-64 rounded-xl glass-panel border border-amber-500/30 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                        onMouseLeave={() => setUserDropdownOpen(false)}
                      >
                        <div className="p-2.5 border-b border-amber-500/20 bg-emerald-950/40 rounded-lg mb-2">
                          <p className="text-xs font-bold text-amber-400">{user.displayName}</p>
                          <p className="text-[11px] text-slate-300 break-all">{user.email}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{user.department}</p>
                        </div>

                        <div className="space-y-1">
                          <Link
                            href="/"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-emerald-900/40 rounded-lg transition-all"
                          >
                            <LayoutGrid className="w-4 h-4 text-amber-400" />
                            <span>Katalog Aplikasi</span>
                          </Link>
                          <Link
                            href="/dashboard/notices"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-emerald-900/40 rounded-lg transition-all"
                          >
                            <Bell className="w-4 h-4 text-amber-400" />
                            <span>Papan Pengumuman</span>
                          </Link>

                          <Link
                            href="/dashboard/admin"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs text-purple-300 hover:text-white hover:bg-purple-950/50 rounded-lg transition-all font-semibold"
                          >
                            <ShieldCheck className="w-4 h-4 text-purple-400" />
                            <span>Panel Kontrol Admin</span>
                          </Link>

                          <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              logout();
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-300 hover:text-red-100 hover:bg-red-950/50 rounded-lg transition-all mt-1"
                          >
                            <LogOut className="w-4 h-4 text-red-400" />
                            <span>Keluar (Logout)</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setAdminModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-900 to-indigo-950 hover:from-purple-800 hover:to-indigo-900 border border-purple-500/40 text-purple-200 text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    <span>Login Admin</span>
                  </button>
                )}
              </div>

              {/* Mobile Menu & Quick Controls Button */}
              <div className="flex md:hidden items-center gap-2">
                {/* Quick Mobile Theme Toggle */}
                <button
                  suppressHydrationWarning
                  onClick={toggleTheme}
                  className="p-2 rounded-lg bg-[#0e271e] border border-amber-500/30 text-amber-400 cursor-pointer"
                  title="Ganti Tema Terang/Gelap"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-indigo-400" />}
                </button>

                {onOpenPwaModal && (
                  <button
                    onClick={onOpenPwaModal}
                    className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs"
                    title="Pasang Aplikasi"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-xl bg-[#0e271e] border border-amber-500/30 text-amber-400"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Dropdown Drawer */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-amber-500/20 bg-[#081812] px-4 pt-3 pb-5 space-y-3 animate-in fade-in slide-in-from-top-3">
              {user && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-950/50 border border-amber-500/20">
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-amber-400/30 bg-amber-950/50 flex items-center justify-center">
                    {user.photoURL ? (
                      <Image
                        src={user.photoURL}
                        alt={user.displayName}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-amber-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{user.displayName}</p>
                    <p className="text-xs text-slate-300">{user.email}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block mt-1 ${getRoleBadgeStyle(user.role)}`}>
                      {user.roleTitle}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#0d261d] text-xs text-slate-300 border border-emerald-500/20">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> Sorong (WIT):
                </span>
                <span suppressHydrationWarning className="font-bold text-amber-400">{timeWIT || '00:00:00'} WIT • {dateWIT}</span>
              </div>

              <div className="space-y-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        link.active
                          ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white'
                          : 'text-slate-300 hover:bg-emerald-900/40'
                      }`}
                    >
                      <Icon className="w-5 h-5 text-amber-400" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}

                {/* Mobile Drawer Theme Switch */}
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold text-slate-200 bg-[#0c241b] border border-amber-500/20 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-300" /> : <Moon className="w-5 h-5 text-indigo-400" />}
                    <span>{theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}</span>
                  </div>
                  <span className="text-xs font-bold text-amber-400 uppercase">{theme}</span>
                </button>

                {!user && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setAdminModalOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-purple-200 bg-purple-950/60 border border-purple-500/40"
                  >
                    <ShieldCheck className="w-5 h-5 text-purple-300" />
                    <span>Login Sebagai Admin</span>
                  </button>
                )}

                {user && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-300 hover:bg-red-950/50 transition-all"
                  >
                    <LogOut className="w-5 h-5 text-red-400" />
                    <span>Keluar (Logout)</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </header>
      )}

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
      />

      {internalPwaModalOpen && (
        <PWAInstallModal
          isOpen={internalPwaModalOpen}
          onClose={() => setInternalPwaModalOpen(false)}
        />
      )}

      {/* More Options Modal / Sheet for "Lainnya" */}
      {moreMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl glass-panel bg-[#091f17]/95 border-2 border-amber-500/40 shadow-2xl p-6 overflow-hidden">
            <button
              onClick={() => setMoreMenuOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-all border border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <MoreHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Menu & Pengaturan</h3>
                <p className="text-xs text-slate-300">Akses cepat fitur portal yayasan</p>
              </div>
            </div>

            <div className="space-y-2">
              {/* 1. Pengumuman */}
              <Link
                href="/dashboard/notices"
                onClick={() => setMoreMenuOpen(false)}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#0c261e] hover:bg-[#12382c] border border-amber-500/20 text-slate-200 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white group-hover:text-amber-300">Papan Pengumuman</p>
                    <p className="text-[10px] text-slate-400">Instruksi & edaran resmi yayasan</p>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 -rotate-90 text-slate-400 group-hover:text-white" />
              </Link>

              {/* 2. Ganti Tema Siang / Malam */}
              <button
                type="button"
                onClick={() => {
                  toggleTheme();
                  setMoreMenuOpen(false);
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#0c261e] hover:bg-[#12382c] border border-amber-500/20 text-slate-200 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-300 flex items-center justify-center">
                    {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-indigo-400" />}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white group-hover:text-amber-300">
                      {theme === 'dark' ? 'Ganti ke Mode Siang' : 'Ganti ke Mode Malam'}
                    </p>
                    <p className="text-[10px] text-slate-400">Tema tampilan saat ini: {theme === 'dark' ? 'Gelap' : 'Terang'}</p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/30">
                  {theme}
                </span>
              </button>

              {/* 3. Pasang Aplikasi (PWA) */}
              <button
                type="button"
                onClick={() => {
                  setMoreMenuOpen(false);
                  if (onOpenPwaModal) {
                    onOpenPwaModal();
                  } else {
                    setInternalPwaModalOpen(true);
                  }
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#0c261e] hover:bg-[#12382c] border border-emerald-500/20 text-slate-200 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                    <Download className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white group-hover:text-emerald-300">Pasang Aplikasi di HP</p>
                    <p className="text-[10px] text-slate-400">Instal cepat di layar utama</p>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 -rotate-90 text-slate-400 group-hover:text-white" />
              </button>

              {/* 4. Panel Admin */}
              <button
                type="button"
                onClick={() => {
                  setMoreMenuOpen(false);
                  if (user && (user.role === 'IT_ADMIN' || user.role === 'EXECUTIVE')) {
                    router.push('/dashboard/admin');
                  } else {
                    setAdminModalOpen(true);
                  }
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-purple-950/40 hover:bg-purple-950/70 border border-purple-500/30 text-purple-200 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white group-hover:text-purple-300">
                      {user ? 'Panel Kontrol Admin' : 'Login Administrator'}
                    </p>
                    <p className="text-[10px] text-purple-300/80">Kelola sistem, notifikasi & link</p>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 -rotate-90 text-purple-400 group-hover:text-white" />
              </button>

              {user && (
                <button
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl text-xs font-bold text-red-300 bg-red-950/30 hover:bg-red-950/60 border border-red-500/30 transition-all"
                >
                  <LogOut className="w-4 h-4 text-red-400" />
                  <span>Keluar Akun ({user.displayName})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SIMPLIFIED 3-MENU MOBILE BOTTOM DOCK (MATCHING MOCKUP DESIGN)             */}
      {/* ========================================================================= */}
      <div className="md:hidden mobile-fixed-bottom-bar">
        <nav className="mobile-bottom-dock flex items-center justify-around py-1.5 px-3">
          {/* 1. Beranda */}
          <Link
            href="/"
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-200 ${
              pathname === '/'
                ? 'text-[#11382b] dark:text-amber-400 font-extrabold'
                : 'text-stone-400 hover:text-stone-600 dark:text-slate-400 dark:hover:text-slate-200 font-medium'
            }`}
          >
            <Home className="w-5 h-5 mb-0.5 shrink-0" />
            <span className="text-[10px] tracking-tight">Beranda</span>
          </Link>

          {/* 2. Aplikasi */}
          <Link
            href="/apps"
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-200 ${
              pathname === '/apps' || pathname === '/dashboard'
                ? 'text-[#11382b] dark:text-amber-400 font-extrabold'
                : 'text-stone-400 hover:text-stone-600 dark:text-slate-400 dark:hover:text-slate-200 font-medium'
            }`}
          >
            <LayoutGrid className="w-5 h-5 mb-0.5 shrink-0" />
            <span className="text-[10px] tracking-tight">Aplikasi</span>
          </Link>

          {/* 3. Lainnya */}
          <button
            type="button"
            onClick={() => setMoreMenuOpen(true)}
            className="flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl text-stone-400 hover:text-stone-600 dark:text-slate-400 dark:hover:text-slate-200 transition-all duration-200 cursor-pointer font-medium"
          >
            <MoreHorizontal className="w-5 h-5 mb-0.5 shrink-0" />
            <span className="text-[10px] tracking-tight">Lainnya</span>
          </button>
        </nav>
      </div>
    </>
  );
}
