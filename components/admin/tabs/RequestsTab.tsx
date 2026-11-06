'use client';

import React, { useState } from 'react';
import { resolveAccessRequest } from '@/lib/storage';
import { AccessRequest } from '@/lib/types';
import { Check, KeyRound, MessageCircle } from 'lucide-react';

/** Permohonan akses staf baru. */
export default function RequestsTab({ requests, currentAdminName }: { requests: AccessRequest[]; currentAdminName: string }) {
  const [copiedReqId, setCopiedReqId] = useState<string | null>(null);

  // ================= REQUESTS HANDLERS =================
  const handleApproveRequest = (r: AccessRequest) => {
    resolveAccessRequest(
      r.id,
      'APPROVED',
      currentAdminName,
      'OPERATIONAL',
      'Disetujui oleh Administrator Portal'
    );
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
    const text = `Halo ${r.name},\n\nPendaftaran akun Anda untuk *${r.appTitle || 'PORTAL REP'}* telah DISETUJUI oleh Yayasan Rumah Etnik Papua.\n\n📧 Email login: ${r.email}\n🌐 Portal: ${origin}/dashboard/admin/login\n\nCara membuat kata sandi Anda sendiri:\n1. Buka tautan portal di atas.\n2. Isi email Anda, lalu klik *"Lupa kata sandi / buat kata sandi baru?"*.\n3. Buka email dari Firebase dan buat kata sandi baru.\n\nDemi keamanan, jangan pernah membagikan kata sandi kepada siapa pun — termasuk Admin IT. Terima kasih!`;
    navigator.clipboard.writeText(text);
    setCopiedReqId(r.id);
    setTimeout(() => setCopiedReqId(null), 2000);
  };

  return (
    <>
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-400" />
              <span>Otorisasi & Permohonan Pendaftaran Akun Staf</span>
            </h2>
            <p className="text-xs text-slate-400">
              Tinjau pengajuan akun karyawan baru, setujui akses, dan kirimkan kredensial otomatis ke WhatsApp staf.
            </p>
          </div>

          <div className="space-y-3">
            {requests.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-2xl glass-panel bg-[#091b14] border border-amber-500/25 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{r.name}</span>
                    <span className="text-[10px] font-mono text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-500/30">
                      {r.email}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Mengajukan akses untuk: <strong className="text-emerald-400">{r.appTitle || 'PORTAL REP'}</strong> ({r.department})
                  </p>
                  {r.reason && <p className="text-[11px] text-slate-400 italic">&ldquo;{r.reason}&rdquo;</p>}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {r.status === 'PENDING' ? (
                    <>
                      <button
                        onClick={() => handleApproveRequest(r)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Setujui & Whitelist</span>
                      </button>
                      <button
                        onClick={() => handleRejectRequest(r)}
                        className="px-3 py-1.5 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-bold transition-all cursor-pointer"
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
              <div className="p-8 text-center rounded-2xl bg-[#091b14] border border-dashed border-amber-500/30 text-slate-400 text-xs">
                Belum ada permohonan akses baru dari staf.
              </div>
            )}
          </div>
        </div>
    </>
  );
}
