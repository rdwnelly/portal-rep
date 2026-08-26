import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/lib/theme-context';
import PWARegister from '@/components/PWARegister';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
});

export const metadata: Metadata = {
  title: 'PORTAL REP | Yayasan Rumah Etnik Papua (Single Sign-On Hub)',
  description: 'Pusat Operasional Rumah Terpadu Aplikasi Layanan Yayasan Rumah Etnik Papua - Sorong, Papua Barat Daya. Single Source of Truth untuk Reservasi, SIK-REP, POS Kasir/OMG, dan zeestudio.',
  applicationName: 'PORTAL REP',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PORTAL REP',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-512x512.png',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#0f2e22',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${jakarta.variable} font-sans dark`}>
      <body className="min-h-screen flex flex-col bg-[#07130f] text-slate-100 antialiased selection:bg-amber-500 selection:text-black transition-colors duration-300">
        <ThemeProvider>
          <AuthProvider>
            <PWARegister />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
