'use client';

import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'production') {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => console.log('PORTAL REP Service Worker Registered:', reg.scope))
          .catch((err) => console.log('PORTAL REP Service Worker Failed:', err));
      } else {
        // Pada development mode, bersihkan service worker & cache agar chunk Turbopack selalu segar
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const reg of registrations) {
            reg.unregister();
          }
        });
        if ('caches' in window) {
          caches.keys().then((keys) => {
            for (const key of keys) {
              caches.delete(key);
            }
          });
        }
      }
    }
  }, []);

  return null;
}
