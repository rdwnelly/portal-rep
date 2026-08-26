'use client';

import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('PORTAL REP Service Worker Registered:', reg.scope))
        .catch((err) => console.log('PORTAL REP Service Worker Failed:', err));
    }
  }, []);

  return null;
}
