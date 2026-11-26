import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Playfair_Display } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/lib/theme-context';
import PWARegister from '@/components/PWARegister';
import StorageStatusToast from '@/components/StorageStatusToast';
import InstallPrompt from '@/components/InstallPrompt';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
});

export const metadata: Metadata = {
  title: 'PORTAL REP | Yayasan Rumah Etnik Papua',
  description: 'Portal aplikasi kerja & agenda Yayasan Rumah Etnik Papua — Sorong, Papua Barat Daya.',
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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f4ee' },
    { media: '(prefers-color-scheme: dark)', color: '#0f2e22' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

/**
 * Pasang tema tersimpan SEBELUM halaman pertama digambar, agar pengguna bertema terang
 * tidak melihat kedipan gelap sesaat (ThemeProvider baru berjalan setelah hidrasi).
 */
const THEME_BOOTSTRAP = `(function(){try{var t=localStorage.getItem('portal_rep_theme');if(t!=='light'&&t!=='dark')t='dark';var r=document.documentElement;r.classList.remove('light','dark');r.classList.add(t);r.setAttribute('data-theme',t);r.style.colorScheme=t;}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      data-theme="dark"
      className={`${jakarta.variable} ${playfair.variable} font-sans dark`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className="min-h-screen flex flex-col bg-[#f6f4ee] text-stone-900 dark:bg-[#07130f] dark:text-slate-100 antialiased selection:bg-amber-500 selection:text-black transition-colors duration-300">
        <ThemeProvider>
          <AuthProvider>
            <PWARegister />
            <StorageStatusToast />
            <InstallPrompt />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
