'use client';

import React, { useState } from 'react';
import { updateFoundationInfo } from '@/lib/storage';
import { FoundationInfo } from '@/lib/types';
import { Info, Check, Save } from 'lucide-react';

/** Informasi & profil yayasan. */
export default function InfoTab({ info, currentAdminName }: { info: FoundationInfo; currentAdminName: string }) {
  // Form States: Kelola Informasi Yayasan
  const [infoForm, setInfoForm] = useState<FoundationInfo>(info);
  const [infoSavedSuccess, setInfoSavedSuccess] = useState(false);

  // ================= INFO HANDLER =================
  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateFoundationInfo(infoForm, currentAdminName);
    setInfoSavedSuccess(true);
    setTimeout(() => setInfoSavedSuccess(false), 3000);
  };

  return (
    <>
        <div className="max-w-3xl space-y-6">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Info className="w-5 h-5 text-cyan-400" />
              <span>Profil & Informasi Resmi Yayasan REP</span>
            </h2>
            <p className="text-xs text-slate-400">
              Data kontak helpdesk IT, alamat operasional, dan jam layanan yang tampil di portal.
            </p>
          </div>

          <form onSubmit={handleSaveInfo} className="p-6 rounded-2xl bg-[#091b14] border border-cyan-500/25 space-y-4">
            {infoSavedSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Informasi yayasan berhasil disimpan dan diperbarui!</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Nama Organisasi</label>
                <input
                  type="text"
                  value={infoForm.organizationName}
                  onChange={(e) => setInfoForm({ ...infoForm, organizationName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#06140e] border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Tagline Budaya</label>
                <input
                  type="text"
                  value={infoForm.tagline}
                  onChange={(e) => setInfoForm({ ...infoForm, tagline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#06140e] border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Alamat Kompleks Yayasan</label>
              <input
                type="text"
                value={infoForm.address}
                onChange={(e) => setInfoForm({ ...infoForm, address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#06140e] border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Nama Kontak IT Helpdesk</label>
                <input
                  type="text"
                  value={infoForm.itHelpdeskName}
                  onChange={(e) => setInfoForm({ ...infoForm, itHelpdeskName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#06140e] border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Nomor WhatsApp IT Helpdesk</label>
                <input
                  type="text"
                  value={infoForm.itHelpdeskPhone}
                  onChange={(e) => setInfoForm({ ...infoForm, itHelpdeskPhone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#06140e] border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-700 hover:from-cyan-500 hover:to-teal-600 text-white text-xs font-bold shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan Informasi</span>
              </button>
            </div>
          </form>
        </div>
    </>
  );
}
