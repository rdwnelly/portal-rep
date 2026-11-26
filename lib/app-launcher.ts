'use client';

import type { AppItem } from './types';

/** Buka aplikasi kerja di tab baru. Login dilakukan di masing-masing aplikasi. */
export function launchApp(app: AppItem): void {
  window.open(app.url, '_blank', 'noopener,noreferrer');
}
