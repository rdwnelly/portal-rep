'use client';

import { useSyncExternalStore } from 'react';
import {
  getAccessRequests,
  getAppsList,
  getAuditLogs,
  getEvents,
  getFoundationInfo,
  getWhitelist,
  isFoundationInfoLoaded,
  INITIAL_FOUNDATION_INFO,
  SSR_APPS,
  SSR_EVENTS,
  SSR_LOGS,
  SSR_WHITELIST,
  STORAGE_UPDATE_EVENT,
} from '@/lib/storage';
import type {
  AccessRequest,
  AppItem,
  AuditLog,
  CalendarEvent,
  FoundationInfo,
  WhitelistedUser,
} from '@/lib/types';

export interface AdminData {
  events: CalendarEvent[];
  whitelist: WhitelistedUser[];
  apps: AppItem[];
  requests: AccessRequest[];
  auditLogs: AuditLog[];
  info: FoundationInfo;
  infoLoaded: boolean;
}

const read = (): AdminData => ({
  events: getEvents(),
  whitelist: getWhitelist(),
  apps: getAppsList(),
  requests: getAccessRequests(),
  auditLogs: getAuditLogs(),
  info: getFoundationInfo(),
  infoLoaded: isFoundationInfoLoaded(),
});

// Snapshot dibangun ulang hanya ketika data berubah → referensi stabil untuk useSyncExternalStore.
let cache: AdminData | null = null;

function subscribe(callback: () => void) {
  cache = read();
  const handler = () => {
    cache = read();
    callback();
  };
  window.addEventListener(STORAGE_UPDATE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(STORAGE_UPDATE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

const getSnapshot = () => cache ?? (cache = read());

const SERVER_SNAPSHOT: AdminData = {
  events: SSR_EVENTS,
  whitelist: SSR_WHITELIST,
  apps: SSR_APPS,
  requests: [],
  auditLogs: SSR_LOGS,
  info: INITIAL_FOUNDATION_INFO,
  infoLoaded: false,
};

/** Seluruh data panel admin, reaktif terhadap perubahan lokal maupun Firestore real-time. */
export function useAdminData(): AdminData {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);
}
