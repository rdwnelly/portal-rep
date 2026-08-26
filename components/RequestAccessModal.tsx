'use client';

import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building,
  Phone,
  FileText,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Send,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { submitAccessRequest } from '@/lib/storage';
import { AppItem } from '@/lib/types';
import { PapuanBorderCorner } from './PapuanMotif';

interface RequestAccessModalProps {
  isOpen: boolean;
  preselectedApp?: AppItem | null;
  onClose: () => void;
  availableApps?: AppItem[];
}

const DEPARTMENTS = [
  'Frontdesk Homestay & Tiket Wisata',
  'Keuangan & Pembukuan Yayasan (SIK-REP)',
  'Kasir Yaswar Cafe & Kios Suvenir',
  'Manajemen Logistik & Gudang (OMG)',
  'Media Kreatif & Dokumentasi (Zeey Studio)',
  'Pengurus / Manajemen Eksekutif Yayasan',
  'Divisi Lainnya',
];

export default function RequestAccessModal({
  isOpen,
  preselectedApp,
  onClose,
  availableApps = [],
}: RequestAccessModalProps) {
  const [customAppId, setCustomAppId] = useState<string | null>(null);
  const selectedAppId = customAppId ?? preselectedApp?.id ?? 'ALL';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedReqId, setSubmittedReqId] = useState('');

  if (!isOpen) return null;

  const getTargetAppTitle = (): string => {
    if (selectedAppId === 'ALL') return 'Seluruh Ekosistem PORTAL REP';
    const found = availableApps.find((a) => a.id === selectedAppId);
    return found ? found.title : preselectedApp?.title || 'Aplikasi Pilihan';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim() || !reason.trim()) {
      alert('Mohon lengkapi seluruh formulir pendaftaran!');
      return;
    }

    setIsSubmitting(true);

    try {
      const newReq = submitAccessRequest({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        proposedPassword: password,
        appId: selectedAppId,
        appTitle: getTargetAppTitle(),
        department,
        phoneNumber: phoneNumber.trim() || undefined,
        reason: reason.trim(),
      });

      if (typeof window !== 'undefined') {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#e5a93c', '#0f382a', '#10b981', '#3b82f6'],
        });
      }

      setSubmittedReqId(newReq.id);
      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat mengirim permohonan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    setCustomAppId(null);
    setName('');
    setEmail('');
    setPassword('');
    setPhoneNumber('');
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-t-3xl sm:rounded-3xl glass-panel bg-[#091d15] border-t-2 sm:border-2 border-amber-500/40 shadow-2xl overflow-hidden max-h-[92dvh] sm:max-h-none overflow-y-auto my-0 sm:my-6 pb-safe-bottom">
        <PapuanBorderCorner />

        {/* Ambient Glows */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleResetAndClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-all border border-slate-700 z-20 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {isSubmitted ? (
          /* ================= SUCCESS STATE ================= */
          <div className="p-8 text-center relative z-10 space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-950 border-2 border-emerald-400 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-950/60 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-500/30">
                Pendaftaran Berhasil Dikirim
              </span>
              <h2 className="text-2xl font-black text-white mt-3">
                Permohonan Akses Telah Diterima!
              </h2>
              <p className="text-xs text-slate-300 max-w-md mx-auto mt-2 leading-relaxed">
                Data pendaftaran login Anda untuk <strong>{getTargetAppTitle()}</strong> telah masuk ke antrean verifikasi Admin IT Yayasan Rumah Etnik Papua.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#06140e] border border-amber-500/20 text-left text-xs space-y-2 text-slate-300">
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">ID Permohonan:</span>
                <span className="font-mono font-bold text-amber-300">{submittedReqId}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Nama Staf:</span>
                <strong className="text-white">{name}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Email Login:</span>
                <span className="font-mono text-emerald-300">{email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Divisi:</span>
                <span className="text-slate-200">{department}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 text-left">
              <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Admin IT (Ridwan Elly) akan segera memverifikasi dan mendaftarkan akun Anda ke sistem whitelist.</span>
            </div>

            <div className="pt-2">
              <button
                onClick={handleResetAndClose}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-white font-bold text-sm shadow-xl shadow-amber-950/60 transition-all cursor-pointer"
              >
                Selesai & Tutup
              </button>
            </div>
          </div>
        ) : (
          /* ================= FORM STATE ================= */
          <div className="p-6 sm:p-8 relative z-10">
            {/* Header */}
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-900 border border-amber-400/40 flex items-center justify-center shadow-lg shadow-black/40 shrink-0">
                <UserPlus className="w-6 h-6 text-amber-200" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30">
                    Formulir Pendaftaran
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Verifikasi Admin
                  </span>
                </div>
                <h2 className="text-xl font-black text-white mt-0.5">
                  Minta Akses / Pendaftaran Akun Staf
                </h2>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Target Application Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Aplikasi yang Dituju:</span>
                </label>
                <select
                  value={selectedAppId}
                  onChange={(e) => setCustomAppId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#06160f] border border-amber-500/30 text-xs text-amber-300 font-semibold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 cursor-pointer"
                >
                  <option value="ALL">🌐 Semua Aplikasi (Akses Penuh Portal REP)</option>
                  <option value="app-reservasi">🏨 Sistem Manajemen Reservasi (Homestay & Tiket)</option>
                  <option value="app-sik-rep">💰 SIK-REP (Sistem Informasi Keuangan)</option>
                  <option value="app-pos-omg">☕ POS Kasir Yaswar Cafe & OMG Gudang</option>
                  <option value="app-zeestudio">🎬 Zeey Studio (Media Kreatif & Arsip)</option>
                </select>
              </div>

              {/* Row: Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Nama Lengkap Staf <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="misal: Johanes Kambu"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#06160f] border border-amber-500/25 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-amber-400" />
                    <span>Email untuk Login <span className="text-red-400">*</span></span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@rumahetnikpapua.org atau gmail"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#06160f] border border-amber-500/25 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                  />
                </div>
              </div>

              {/* Proposed Password */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-400" />
                    <span>Kata Sandi (Password) yang Diajukan <span className="text-red-400">*</span></span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Akan didaftarkan oleh admin</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Buat kata sandi minimal 6 karakter..."
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#06160f] border border-amber-500/25 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-300 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Row: Department & WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                    <Building className="w-3 h-3 text-emerald-400" />
                    <span>Divisi / Unit Kerja <span className="text-red-400">*</span></span>
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#06160f] border border-amber-500/25 text-xs text-slate-200 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 cursor-pointer"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-400" />
                    <span>No. WhatsApp / HP (Opsional)</span>
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#06160f] border border-amber-500/25 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                  />
                </div>
              </div>

              {/* Reason / Catatan Keperluan */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                  <FileText className="w-3 h-3 text-amber-400" />
                  <span>Alasan / Keperluan Akses Kerja <span className="text-red-400">*</span></span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Jelaskan kebutuhan tugas Anda (misal: Staf kasir baru Yaswar Cafe shift siang)..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#06160f] border border-amber-500/25 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-amber-500/15">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-white text-xs font-bold shadow-lg shadow-amber-950/60 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Mengirim...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Kirim Pendaftaran ke Admin</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
