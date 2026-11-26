'use client';

import React, { useState } from 'react';
import { resolveAccessRequest } from '@/lib/storage';
import { AccessRequest } from '@/lib/types';
import { AlertTriangle, Check, KeyRound, MailCheck, MessageCircle, X } from 'lucide-react';
import { provisionStaffAccount } from '@/lib/staff-accounts';

/** Permohonan akses staf baru. */
export default function RequestsTab({ requests, currentAdminName }: { requests: AccessRequest[]; currentAdminName: string }) {
  const [copiedReqId, setCopiedReqId] = useState<string | null>(null);
  const [accountNotice, setAccountNotice] = useState<{ ok: boolean; message: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // ================= REQUESTS HANDLERS =================
  const handleApproveRequest = async (r: AccessRequest) => {
    setAccountNotice(null);
    resolveAccessRequest(
      r.id,
      'APPROVED',
      currentAdminName,
      'OPERATIONAL',
      'Disetujui oleh Administrator Portal'
    );
    // Persetujuan menambahkan pemohon ke whitelist; akun loginnya dibuat di sini agar
    // petunjuk "Lupa kata sandi" di pesan WhatsApp di bawah benar-benar bekerja.
    setBusyId(r.id);
    setAccountNotice(await provisionStaffAccount(r.email, r.name));
    setBusyId(null);
  };

  const handleRejectRequest = (r: AccessRequest) => {
    if (confirm(`Tolak permohonan akses dari ${r.name}?`)) {
      resolveAccessRequest(
        r.id,
        'REJECTED',
        currentAdminName,
        undefined,
        'Ditolak: Hubungi IT Helpdesk'
      );
    }
  };

  const handleCopyWaMessage = (r: AccessRequest) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const text = `Halo ${r.name},\n\nPendaftaran akun Anda untuk *${r.appTitle || 'PORTAL REP'}* telah DISETUJUI oleh Yayasan Rumah Etnik Papua.\n\n📧 Email login: ${r.email}\n🌐 Portal: ${origin}/masuk\n\nCara membuat kata sandi Anda sendiri:\n1. Buka tautan portal di atas.\n2. Isi email Anda, lalu klik *"Lupa kata sandi / buat kata sandi baru?"*.\n3. Buka email dari Firebase dan buat kata sandi baru.\n\nDemi keamanan, jangan pernah membagikan kata sandi kepada siapa pun — termasuk Admin IT. Terima kasih!`;
    navigator.clipboard.writeText(text);
    setCopiedReqId(r.id);
    setTimeout(() => setCopiedReqId(null), 2000);
  };

  return (
    <>
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-black text-stone-900 dark:text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span>Otorisasi & Permohonan Pendaftaran Akun Staf</span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-slate-400">
              Tinjau pengajuan akun karyawan baru, setujui akses, dan kirimkan kredensial otomatis ke WhatsApp staf.
            </p>
          </div>

          {accountNotice && (
            <div
              role="status"
              className={`flex items-start gap-2 p-3 rounded-2xl border text-xs leading-relaxed ${
                accountNotice.ok
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-500/30 text-rose-800 dark:text-rose-200'
              }`}
            >
              {accountNotice.ok ? (
                <MailCheck className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span className="flex-1">{accountNotice.message}</span>
              <button
                type="button"
                onClick={() => setAccountNotice(null)}
                aria-label="Tutup pemberitahuan"
                className="shrink-0 w-5 h-5 flex items-center justify-center rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="space-y-3">
            {requests.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-2xl bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-amber-500/25 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-900 dark:text-white">{r.name}</span>
                    <span className="text-[10px] font-mono text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded border border-stone-200 dark:border-amber-500/30">
                      {r.email}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-slate-300">
                    Mengajukan akses untuk: <strong className="text-emerald-700 dark:text-emerald-400">{r.appTitle || 'PORTAL REP'}</strong> ({r.department})
                  </p>
                  {r.reason && <p className="text-[11px] text-stone-500 dark:text-slate-400 italic">&ldquo;{r.reason}&rdquo;</p>}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {r.status === 'PENDING' ? (
                    <>
                      <button
                        onClick={() => void handleApproveRequest(r)}
                        disabled={busyId === r.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Setujui & Whitelist</span>
                      </button>
                      <button
                        onClick={() => handleRejectRequest(r)}
                        className="px-3 py-1.5 rounded-xl bg-rose-100 dark:bg-rose-950 hover:bg-rose-200 dark:hover:bg-rose-900 border border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs font-bold transition-all cursor-pointer"
                      >
                        Tolak
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                          r.status === 'APPROVED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {r.status === 'APPROVED' ? 'Telah Disetujui' : 'Ditolak'}
                      </span>
                      {r.status === 'APPROVED' && (
                        <button
                          onClick={() => handleCopyWaMessage(r)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-all cursor-pointer"
                          title="Salin Pesan WhatsApp Akun"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{copiedReqId === r.id ? 'Tersalin!' : 'Kirim WA'}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {requests.length === 0 && (
              <div className="p-8 text-center rounded-2xl bg-stone-50 dark:bg-white/5 border border-dashed border-stone-200 dark:border-amber-500/30 text-stone-500 dark:text-slate-400 text-xs">
                Belum ada permohonan akses baru dari staf.
              </div>
            )}
          </div>
        </div>
    </>
  );
}
