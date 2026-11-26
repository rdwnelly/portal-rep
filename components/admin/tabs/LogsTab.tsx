'use client';

import React, { useState } from 'react';
import { seedInitialData, isRemoteStore } from '@/lib/storage';
import { UserRole, AuditLog } from '@/lib/types';
import { History, RotateCcw } from 'lucide-react';

/** Audit trail & inisialisasi data awal. */
export default function LogsTab({ auditLogs, actualRole, currentAdminName }: { auditLogs: AuditLog[]; actualRole: UserRole; currentAdminName: string }) {
  const [seedStatus, setSeedStatus] = useState<{ running: boolean; lines: string[] }>({ running: false, lines: [] });

  const handleSeedData = async () => {
    const msg = isRemoteStore
      ? 'Isi Firestore dengan data awal? Hanya koleksi yang masih kosong yang akan diisi; data yang sudah ada tidak disentuh.'
      : 'Pulihkan seluruh data demo lokal ke kondisi awal?';
    if (!confirm(msg)) return;
    setSeedStatus({ running: true, lines: [] });
    try {
      const lines = await seedInitialData(currentAdminName);
      setSeedStatus({ running: false, lines });
    } catch (err) {
      const code = (err as { code?: string })?.code;
      setSeedStatus({
        running: false,
        lines: [code === 'permission-denied' ? 'Ditolak: hanya IT_ADMIN yang dapat mengisi data awal.' : `Gagal: ${(err as Error).message}`],
      });
    }
  };

  return (
    <>
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-black text-stone-900 dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-stone-500 dark:text-slate-400" />
              <span>Audit Trail & Jejak Aktivitas Keamanan</span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-slate-400">
              Catatan otomatis setiap perubahan data, penambahan SOP, otorisasi staf, dan pembaruan sistem.
            </p>
          </div>

          {actualRole === 'IT_ADMIN' && (
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-amber-500/25 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-stone-900 dark:text-white">
                    {isRemoteStore ? 'Inisialisasi Data Awal Firestore' : 'Pulihkan Data Demo Lokal'}
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400">
                    {isRemoteStore
                      ? 'Mengisi modul aplikasi, info yayasan, dan konten contoh ke koleksi yang masih kosong. Whitelist & metrik tidak diisi (metrik diambil langsung dari sub-aplikasi).'
                      : 'Mengembalikan seluruh data contoh di browser ini ke kondisi awal.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSeedData}
                  disabled={seedStatus.running}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{seedStatus.running ? 'Memproses...' : 'Jalankan'}</span>
                </button>
              </div>
              {seedStatus.lines.length > 0 && (
                <ul className="text-[11px] text-emerald-700 dark:text-emerald-300 font-mono space-y-0.5">
                  {seedStatus.lines.map((line) => (
                    <li key={line}>• {line}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="rounded-2xl border border-stone-200 dark:border-slate-800 overflow-hidden bg-stone-50 dark:bg-white/5">
            <div className="divide-y divide-stone-200 dark:divide-slate-800">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3.5 flex items-start justify-between gap-3 text-xs hover:bg-[#0c241b]/50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 dark:bg-slate-900 text-amber-600 dark:text-amber-400 border border-stone-200 dark:border-slate-700">
                        {log.category}
                      </span>
                      <span className="font-bold text-stone-900 dark:text-white">{log.action}</span>
                    </div>
                    <p className="text-stone-600 dark:text-slate-300">{log.details}</p>
                    <p className="text-[10px] text-stone-400 dark:text-slate-500">
                      Oleh: <strong className="text-stone-500 dark:text-slate-400">{log.userName}</strong> ({log.actorEmail || log.userEmail})
                    </p>
                  </div>
                  <span className="text-[10px] text-stone-500 dark:text-slate-400 font-mono whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })} WIT
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
    </>
  );
}
