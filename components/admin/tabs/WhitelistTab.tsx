'use client';

import React, { useState } from 'react';
import { addWhitelistedUser, updateWhitelistedUser, removeWhitelistedUser } from '@/lib/storage';
import { UserRole, WhitelistedUser } from '@/lib/types';
import { Trash2, X, Users, UserPlus, Search, MailCheck, Loader2, AlertTriangle } from 'lucide-react';
import { PapuanBorderCorner } from '@/components/PapuanMotif';
import { ROLE_PERMISSIONS } from '@/components/admin/permissions';
import { provisionStaffAccount, syncStaffAccountActive } from '@/lib/staff-accounts';

/** Whitelist karyawan & hak akses role (khusus IT Admin). */
export default function WhitelistTab({ whitelist, currentUserEmail, currentAdminName }: { whitelist: WhitelistedUser[]; currentUserEmail: string; currentAdminName: string }) {
  // Search & Filter for Whitelist
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [staffDeptFilter, setStaffDeptFilter] = useState('ALL');

  // Form States: Tambah Karyawan Whitelist
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setStaffRole] = useState<UserRole>('OPERATIONAL');
  const [staffRoleTitle, setStaffRoleTitle] = useState('Staf Operasional Homestay');
  const [staffDepartment, setStaffDepartment] = useState('Frontdesk & Homestay Etnik');

  // Umpan balik penyiapan akun login (dibuat, email terkirim, atau gagal).
  const [accountNotice, setAccountNotice] = useState<{ ok: boolean; message: string } | null>(null);
  const [busyEmail, setBusyEmail] = useState<string | null>(null);

  // ================= WHITELIST HANDLERS =================
  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = staffEmail.trim().toLowerCase();
    const name = staffName.trim();
    if (!email || !name) return;

    setAccountNotice(null);
    try {
      addWhitelistedUser(
        {
          email,
          name,
          role: staffRole,
          roleTitle: staffRoleTitle.trim(),
          department: staffDepartment.trim(),
          active: true,
          addedBy: currentAdminName,
        },
        currentAdminName
      );
    } catch (err) {
      setAccountNotice({ ok: false, message: (err as Error).message });
      return;
    }

    setShowAddStaffModal(false);
    setStaffEmail('');
    setStaffName('');

    // Whitelist hanya memberi role; akun loginnya dibuat di sini agar karyawan benar-benar
    // bisa masuk. Tanpa langkah ini "Lupa kata sandi" tidak mengirim apa pun.
    setBusyEmail(email);
    setAccountNotice(await provisionStaffAccount(email, name));
    setBusyEmail(null);
  };

  /**
   * Tombol ✉️: buat akun loginnya bila belum ada, lalu kirim tautan kata sandi.
   * Sengaja bukan sekadar "kirim ulang email" — kalau penyiapan akun sempat gagal
   * (mis. kredensial server belum diisi), mengirim email ke akun yang tidak ada
   * tidak menghasilkan apa pun. Ini jalur perbaikannya.
   */
  const handleResendSetupEmail = async (email: string, name: string) => {
    setBusyEmail(email);
    setAccountNotice(await provisionStaffAccount(email, name));
    setBusyEmail(null);
  };

  const isSelf = (email: string) => email.toLowerCase() === currentUserEmail;

  const handleUpdateStaffRole = (id: string, newRole: UserRole) => {
    let roleTitle = 'Staf Yayasan';
    if (newRole === 'EXECUTIVE') roleTitle = 'Pengurus / Pimpinan';
    if (newRole === 'IT_ADMIN') roleTitle = 'IT Developer & Superadmin';
    if (newRole === 'OPERATIONAL') roleTitle = 'Staf Frontdesk & Wisata';
    if (newRole === 'FINANCE_WAREHOUSE') roleTitle = 'Staf Keuangan & Kasir OMG';

    updateWhitelistedUser(id, { role: newRole, roleTitle }, currentAdminName);
  };

  const handleToggleStaffActive = async (id: string, email: string, currentActive: boolean) => {
    const active = !currentActive;
    updateWhitelistedUser(id, { active }, currentAdminName);
    // Whitelist nonaktif menutup portal, tapi token yang sudah terbit masih berlaku sampai
    // kedaluwarsa — akun loginnya ikut dinonaktifkan supaya tidak bisa dapat token baru.
    setBusyEmail(email);
    setAccountNotice(await syncStaffAccountActive(email, active));
    setBusyEmail(null);
  };

  const handleDeleteStaff = async (id: string, name: string, email: string) => {
    if (!confirm(`Hapus karyawan "${name}" dari whitelist akses?`)) return;
    removeWhitelistedUser(id, currentAdminName);
    // Akun login dinonaktifkan, bukan dihapus: jejak audit & UID-nya tetap utuh bila
    // suatu saat karyawan ini bergabung kembali.
    setBusyEmail(email);
    setAccountNotice(await syncStaffAccountActive(email, false));
    setBusyEmail(null);
  };

  // Filtered Whitelist
  const filteredWhitelist = whitelist.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
      u.department.toLowerCase().includes(staffSearchQuery.toLowerCase());
    const matchDept = staffDeptFilter === 'ALL' || u.department === staffDeptFilter;
    return matchSearch && matchDept;
  });

  const departmentList = Array.from(new Set(whitelist.map((u) => u.department)));

  return (
    <>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-stone-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-700 dark:text-purple-400" />
                <span>Manajemen Karyawan & Hak Akses Whitelist (RBAC)</span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-slate-400">
                Kelola hak akses role staf yayasan, atur perizinan sub-aplikasi, dan tambahkan akun Google karyawan.
              </p>
            </div>

            <button
              onClick={() => setShowAddStaffModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white text-xs font-bold shadow-lg shadow-purple-950/60 transition-all cursor-pointer self-start sm:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Karyawan Baru</span>
            </button>
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

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-stone-50 dark:bg-white/5 p-3 rounded-2xl border border-purple-500/20">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-stone-500 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={staffSearchQuery}
                onChange={(e) => setStaffSearchQuery(e.target.value)}
                placeholder="Cari nama, email, atau divisi..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-slate-700 text-xs text-stone-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-[11px] text-stone-500 dark:text-slate-400 font-bold whitespace-nowrap">Divisi:</span>
              <select
                value={staffDeptFilter}
                onChange={(e) => setStaffDeptFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-slate-700 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-purple-400 cursor-pointer"
              >
                <option value="ALL">Semua Divisi</option>
                {departmentList.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Staff Table */}
          <div className="rounded-2xl border border-purple-500/25 overflow-hidden bg-stone-50 dark:bg-white/5 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-600 dark:text-slate-300">
                <thead className="bg-stone-50 dark:bg-white/5 text-[10px] uppercase font-bold text-stone-500 dark:text-slate-400 border-b border-purple-500/20 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Nama & Email Karyawan</th>
                    <th className="py-3 px-4">Divisi / Jabatan</th>
                    <th className="py-3 px-4">Hak Akses Role</th>
                    <th className="py-3 px-4">Status Akun</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-slate-800/80 font-medium">
                  {filteredWhitelist.map((staff) => {
                    const roleInfo = ROLE_PERMISSIONS[staff.role] || ROLE_PERMISSIONS.OPERATIONAL;
                    return (
                      <tr key={staff.id} className="hover:bg-[#0c241b]/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/40 flex items-center justify-center font-bold font-serif text-xs">
                              {staff.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-stone-900 dark:text-white text-xs">{staff.name}</p>
                              <p className="text-[10px] text-stone-500 dark:text-slate-400 font-mono">{staff.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-200">{staff.department}</p>
                          <p className="text-[10px] text-stone-500 dark:text-slate-400">{staff.roleTitle}</p>
                        </td>

                        <td className="py-3.5 px-4">
                          <select
                            value={staff.role}
                            onChange={(e) => handleUpdateStaffRole(staff.id, e.target.value as UserRole)}
                            disabled={isSelf(staff.email)}
                            title={isSelf(staff.email) ? 'Anda tidak dapat mengubah role akun sendiri' : undefined}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${roleInfo.badgeColor}`}
                          >
                            <option value="IT_ADMIN">IT Superadmin</option>
                            <option value="EXECUTIVE">Manajemen Eksekutif</option>
                            <option value="OPERATIONAL">Staf Operasional</option>
                            <option value="FINANCE_WAREHOUSE">Staf Keuangan & Kasir</option>
                          </select>
                        </td>

                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => void handleToggleStaffActive(staff.id, staff.email, staff.active)}
                            disabled={isSelf(staff.email)}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                              staff.active
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                                : 'bg-rose-950 text-rose-300 border-rose-500/40'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${staff.active ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                            <span>{staff.active ? 'Aktif' : 'Dinonaktifkan'}</span>
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => void handleResendSetupEmail(staff.email, staff.name)}
                            disabled={busyEmail === staff.email}
                            className="p-1.5 mr-1 rounded-lg bg-stone-200 dark:bg-slate-800 hover:bg-emerald-200 dark:hover:bg-emerald-950/80 border border-stone-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 transition-all cursor-pointer disabled:cursor-wait disabled:opacity-40"
                            title="Siapkan akun login & kirim tautan pembuatan kata sandi ke email staf"
                          >
                            {busyEmail === staff.email ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <MailCheck className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteStaff(staff.id, staff.name, staff.email)}
                            disabled={isSelf(staff.email)}
                            className="p-1.5 rounded-lg bg-stone-200 dark:bg-slate-800 hover:bg-rose-200/80 dark:hover:bg-rose-950/80 border border-stone-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                            title={isSelf(staff.email) ? 'Anda tidak dapat menghapus akun sendiri' : 'Hapus dari Whitelist'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {showAddStaffModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
            <div
              className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#0c241b] border-2 border-purple-500/40 shadow-2xl p-6 text-slate-100 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <PapuanBorderCorner position="top-right" />
              <PapuanBorderCorner position="bottom-left" />

              <div className="flex items-center justify-between pb-3 border-b border-purple-500/20 mb-4">
                <div className="flex items-center gap-2.5">
                  <UserPlus className="w-5 h-5 text-purple-700 dark:text-purple-400" />
                  <h3 className="text-base font-black text-stone-900 dark:text-white font-serif">Tambah Karyawan ke Whitelist</h3>
                </div>
                <button
                  onClick={() => setShowAddStaffModal(false)}
                  className="p-1.5 rounded-xl bg-stone-100 dark:bg-slate-900 text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white border border-stone-200 dark:border-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={(e) => void handleSaveStaff(e)} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-600 dark:text-slate-300">Nama Lengkap Karyawan</label>
                  <input
                    type="text"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    placeholder="Contoh: Samuel Burdam"
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-white/5 border border-purple-500/30 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-600 dark:text-slate-300">Email Akun Google (Login)</label>
                  <input
                    type="email"
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    placeholder="samuel@gmail.com"
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-white/5 border border-purple-500/30 text-xs text-purple-700 dark:text-purple-300 font-mono focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-600 dark:text-slate-300">Hak Akses Role</label>
                    <select
                      value={staffRole}
                      onChange={(e) => setStaffRole(e.target.value as UserRole)}
                      className="w-full px-2.5 py-2 rounded-xl bg-stone-50 dark:bg-white/5 border border-purple-500/30 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-purple-400"
                    >
                      <option value="OPERATIONAL">Staf Operasional</option>
                      <option value="FINANCE_WAREHOUSE">Staf Keuangan & Gudang</option>
                      <option value="EXECUTIVE">Manajemen Eksekutif</option>
                      <option value="IT_ADMIN">IT Superadmin</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-600 dark:text-slate-300">Jabatan / Posisi</label>
                    <input
                      type="text"
                      value={staffRoleTitle}
                      onChange={(e) => setStaffRoleTitle(e.target.value)}
                      placeholder="Staf Homestay"
                      className="w-full px-2.5 py-2 rounded-xl bg-stone-50 dark:bg-white/5 border border-purple-500/30 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-600 dark:text-slate-300">Divisi / Unit Kerja</label>
                  <input
                    type="text"
                    value={staffDepartment}
                    onChange={(e) => setStaffDepartment(e.target.value)}
                    placeholder="Frontdesk & Homestay Etnik"
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-white/5 border border-purple-500/30 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddStaffModal(false)}
                    className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-slate-900 text-stone-600 dark:text-slate-300 text-xs font-bold border border-stone-200 dark:border-slate-700"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-500 text-white text-xs font-extrabold shadow-md active:scale-95"
                  >
                    Simpan Karyawan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </>
  );
}
