'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Image from 'next/image';
import {
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
  UserPlus,
  Sun,
  Moon
} from 'lucide-react';
import AdminLoginModal from '@/components/AdminLoginModal';
import RequestAccessModal from '@/components/RequestAccessModal';
import PWAInstallModal from '@/components/PWAInstallModal';
import { getAppsList } from '@/lib/storage';
import { useTheme } from '@/lib/theme-context';

interface NavbarProps {
  onOpenPwaModal?: () => void;
  onOpenRequestModal?: () => void;
}

export default function Navbar({ onOpenPwaModal, onOpenRequestModal }: NavbarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [timeWIT, setTimeWIT] = useState<string>('');
  const [dateWIT, setDateWIT] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [internalRequestModalOpen, setInternalRequestModalOpen] = useState(false);
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
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-wider text-amber-400 group-hover:text-amber-300 transition-colors">
                  PORTAL REP
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-emerald-900/80 text-emerald-300 border border-emerald-500/30">
                  SSO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium line-clamp-1">
                Yayasan Rumah Etnik Papua • Sorong
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-[#0b2118]/80 p-1 rounded-xl border border-amber-500/15">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    link.active
                      ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md shadow-amber-950/50'
                      : 'text-slate-300 hover:text-white hover:bg-emerald-900/40'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Section: Live WIT Clock & User Menu */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Live WIT Clock */}
            <div className="flex items-center gap-2 bg-[#0d261d] px-3 py-1.5 rounded-lg border border-emerald-500/20 text-xs text-slate-300">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
              <div suppressHydrationWarning>
                <span className="font-bold text-amber-400">{timeWIT || '00:00:00'} WIT</span>
                <span className="text-[10px] text-slate-400 ml-1.5">{dateWIT}</span>
              </div>
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
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-800 to-indigo-900 hover:from-purple-700 hover:to-indigo-800 border border-purple-400/40 text-purple-200 hover:text-white text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
                <span>Login Sebagai Admin</span>
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

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
      />

      {/* ========================================================================= */}
      {/* ULTRA-MODERN FLOATING BOTTOM DOCK (MOBILE / HP STAF KARYAWAN)             */}
      {/* ========================================================================= */}
      <div className="md:hidden fixed bottom-3 left-2.5 right-2.5 z-50 pointer-events-none flex justify-center">
        <nav
          className="pointer-events-auto w-full max-w-md rounded-3xl bg-[#081c14]/94 backdrop-blur-2xl border border-amber-500/35 px-1.5 py-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.6)] flex items-center justify-between transition-all duration-300 floating-bottom-nav"
        >
          {/* 1. Beranda Aplikasi */}
          <Link
            href="/"
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-2xl transition-all duration-200 ${
              pathname === '/' || pathname === '/dashboard'
                ? 'text-amber-400 bg-amber-500/15 font-black scale-105 shadow-inner'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-5 h-5 mb-0.5" />
            <span className="text-[9px] font-bold tracking-tight">Aplikasi</span>
          </Link>

          {/* 2. Papan Pengumuman */}
          <Link
            href="/dashboard/notices"
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-2xl transition-all duration-200 ${
              pathname === '/dashboard/notices'
                ? 'text-amber-400 bg-amber-500/15 font-black scale-105 shadow-inner'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bell className="w-5 h-5 mb-0.5 text-amber-400" />
            <span className="text-[9px] font-bold tracking-tight">Info</span>
          </Link>

          {/* 3. Minta Akses Button (Floating Center Action with Gold Gradient & Halo) */}
          <button
            onClick={() => {
              if (onOpenRequestModal) {
                onOpenRequestModal();
              } else {
                setInternalRequestModalOpen(true);
              }
            }}
            className="flex-1 flex flex-col items-center justify-center relative -top-3.5 group cursor-pointer"
            title="Daftar & Minta Akses Akun Staf"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 via-amber-600 to-amber-700 border-2 border-amber-300 flex items-center justify-center shadow-xl shadow-amber-950/70 group-active:scale-90 group-hover:scale-105 transition-all duration-200">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] font-black text-amber-400 mt-0.5 tracking-tight drop-shadow-sm">
              Daftar
            </span>
          </button>

          {/* 4. Theme Toggle Button */}
          <button
            suppressHydrationWarning
            onClick={toggleTheme}
            className="flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-2xl text-amber-400 hover:text-amber-300 transition-all duration-200 cursor-pointer"
            title={theme === 'dark' ? 'Mode Terang (Siang)' : 'Mode Gelap (Malam)'}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 mb-0.5 text-amber-300" />
            ) : (
              <Moon className="w-5 h-5 mb-0.5 text-indigo-400" />
            )}
            <span className="text-[9px] font-bold tracking-tight">
              {theme === 'dark' ? 'Siang' : 'Malam'}
            </span>
          </button>

          {/* 5. Pasang PWA */}
          <button
            onClick={() => {
              if (onOpenPwaModal) {
                onOpenPwaModal();
              } else {
                setInternalPwaModalOpen(true);
              }
            }}
            className="flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-2xl text-emerald-400 hover:text-emerald-300 transition-all duration-200 cursor-pointer"
            title="Pasang Aplikasi di HP"
          >
            <Download className="w-5 h-5 mb-0.5" />
            <span className="text-[9px] font-bold tracking-tight">Pasang</span>
          </button>

          {/* 6. Admin Panel */}
          <button
            onClick={() => {
              if (user && (user.role === 'IT_ADMIN' || user.role === 'EXECUTIVE')) {
                router.push('/dashboard/admin');
              } else {
                setAdminModalOpen(true);
              }
            }}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-2xl transition-all duration-200 ${
              pathname === '/dashboard/admin'
                ? 'text-purple-400 bg-purple-500/15 font-black scale-105'
                : 'text-purple-300/80 hover:text-purple-200'
            }`}
            title="Panel Admin"
          >
            <ShieldCheck className="w-5 h-5 mb-0.5" />
            <span className="text-[9px] font-bold tracking-tight">Admin</span>
          </button>
        </nav>
      </div>

      {/* Internal Modals for complete stand-alone functionality */}
      {internalRequestModalOpen && (
        <RequestAccessModal
          isOpen={internalRequestModalOpen}
          availableApps={getAppsList()}
          onClose={() => setInternalRequestModalOpen(false)}
        />
      )}

      {internalPwaModalOpen && (
        <PWAInstallModal
          isOpen={internalPwaModalOpen}
          onClose={() => setInternalPwaModalOpen(false)}
        />
      )}
    </header>
  );
}
