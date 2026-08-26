'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  ShieldAlert,
  Send,
  X,
  CheckCircle
} from 'lucide-react';

export default function AccessDeniedModal() {
  const { unauthorizedEmail, clearUnauthorizedState, requestAccess } = useAuth();
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Operasional & Frontdesk');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!unauthorizedEmail) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !reason) return;
    setLoading(true);
    await requestAccess({
      name,
      email: unauthorizedEmail,
      department,
      reason,
    });
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl glass-panel bg-[#0d1c16] border border-red-500/40 shadow-2xl p-6 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={clearUnauthorizedState}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-all border border-slate-700"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-500/50 flex items-center justify-center text-red-400 shadow-lg shadow-red-950/50">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-500/40">
              Akses Ditolak (Whitelist Protection)
            </span>
            <h2 className="text-lg font-bold text-white mt-0.5">Email Belum Terdaftar</h2>
          </div>
        </div>

        {/* Rejection Notice Info */}
        <div className="p-3.5 rounded-xl bg-[#14261e] border border-amber-500/20 text-xs text-slate-300 mb-4 space-y-2">
          <p>
            Akun Google <strong className="text-amber-400">{unauthorizedEmail}</strong> belum didaftarkan dalam daftar izin (whitelist) resmi Yayasan Rumah Etnik Papua.
          </p>
          <p className="text-[11px] text-slate-400">
            Sesuai kebijakan keamanan internal, hanya staf resmi yang di-whitelist oleh Admin IT yang dapat mengakses portal ini.
          </p>
        </div>

        {submitted ? (
          <div className="p-5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-center space-y-3">
            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-emerald-200">Permohonan Akses Terkirim!</h3>
            <p className="text-xs text-slate-300">
              Permohonan Anda telah diteruskan ke <strong>Ridwan Elly (IT Developer Internal)</strong>. Anda akan dapat masuk setelah email Anda diaktifkan.
            </p>
            <button
              onClick={clearUnauthorizedState}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-all"
            >
              Kembali ke Halaman Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Nama Lengkap Staf *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Yulius Burdam"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Departemen / Posisi *</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#06140e] border border-slate-700 text-white focus:outline-none focus:border-amber-400 text-xs"
              >
                <option value="Operasional & Frontdesk">Staf Frontdesk & Wisata Homestay</option>
                <option value="Yaswar Cafe & POS">Kasir Yaswar Cafe</option>
                <option value="Keuangan & Pembukuan">Staf Keuangan SIK-REP</option>
                <option value="Logistik & Gudang OMG">Staf Gudang Suvenir & Logistik</option>
                <option value="zeestudio Media">Tim Media & Kreatif zeestudio</option>
                <option value="Manajemen Eksekutif">Pengurus / Manajemen Eksekutif</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Alasan Permohonan Akses *</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="Contoh: Saya staf kasir baru di Yaswar Cafe shift siang..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#06140e] border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 text-xs"
                required
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={clearUnauthorizedState}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-lg shadow-amber-950/60 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{loading ? 'Mengirim...' : 'Ajukan Akses ke Admin IT'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Contact info footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
          <span>IT Helpdesk: Ridwan Elly</span>
          <span>Sorong, Papua Barat Daya</span>
        </div>
      </div>
    </div>
  );
}
