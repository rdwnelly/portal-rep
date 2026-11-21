'use client';

/**
 * Penyiapan akun login (Firebase Authentication) untuk staf yayasan.
 *
 * Menambahkan karyawan ke whitelist hanya membuat dokumen role di Firestore — akun
 * loginnya belum ada. Tanpa akun itu, tombol "Lupa kata sandi" tidak mengirim apa pun
 * (Firebase sengaja tidak membocorkan email tak terdaftar), sehingga karyawan baru tidak
 * pernah bisa masuk. Modul ini menutup celah tersebut.
 */

import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from './firebase';
import { isRemoteStore, whitelistSaved } from './storage';
import { apiFetch } from './api-client';

export interface StaffAccountResult {
  /** Pesan siap tampil untuk administrator. */
  message: string;
  ok: boolean;
}

const DEMO_NOTE = 'Mode demo: akun login tidak dibuat (tidak ada Firebase).';

/** Buat akun login staf bila belum ada, lalu kirim tautan pembuatan kata sandi. */
export async function provisionStaffAccount(email: string, name: string): Promise<StaffAccountResult> {
  if (!isRemoteStore) return { ok: true, message: DEMO_NOTE };

  // Server membaca whitelist lewat Admin SDK, jadi tulisan dari browser harus mendarat dulu.
  if (!(await whitelistSaved(email))) {
    return { ok: false, message: `Data whitelist ${name} gagal disimpan, jadi akun loginnya belum dibuat.` };
  }

  let created: boolean;
  let emailVerified: boolean;
  try {
    const res = await apiFetch<{ created: boolean; emailVerified: boolean }>('/api/staff', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    created = res.created;
    emailVerified = res.emailVerified;
  } catch (err) {
    return { ok: false, message: `Akun login ${name} belum bisa dibuat: ${(err as Error).message}` };
  }

  const sent = await sendPasswordSetupEmail(email);
  if (!sent.ok) return sent;

  if (!created && !emailVerified) {
    return {
      ok: true,
      message: `Akun login ${email} sudah ada tetapi emailnya belum terverifikasi. Tautan pembuatan kata sandi sudah dikirim — emailnya otomatis terverifikasi setelah kata sandi dibuat.`,
    };
  }
  return {
    ok: true,
    message: created
      ? `Akun login ${email} dibuat. Tautan pembuatan kata sandi sudah dikirim ke email tersebut.`
      : `Akun login ${email} sudah ada. Tautan pembuatan kata sandi baru sudah dikirim.`,
  };
}

/** Kirim ulang tautan buat/atur ulang kata sandi ke alamat staf. */
export async function sendPasswordSetupEmail(email: string): Promise<StaffAccountResult> {
  if (!isRemoteStore) return { ok: true, message: DEMO_NOTE };
  try {
    await sendPasswordResetEmail(auth, email);
    return { ok: true, message: `Tautan pembuatan kata sandi dikirim ke ${email}.` };
  } catch (err) {
    return { ok: false, message: `Gagal mengirim email ke ${email}: ${(err as Error).message}` };
  }
}

/**
 * Selaraskan status aktif whitelist ke akun login. Dipanggil setelah whitelist diubah,
 * agar staf nonaktif tidak bisa lagi memperoleh token baru dari Firebase.
 */
export async function syncStaffAccountActive(email: string, active: boolean): Promise<StaffAccountResult> {
  if (!isRemoteStore) return { ok: true, message: DEMO_NOTE };
  try {
    const res = await apiFetch<{ changed: boolean; missing?: boolean }>('/api/staff', {
      method: 'PATCH',
      body: JSON.stringify({ email, active }),
    });
    if (res.missing) {
      return { ok: true, message: `${email} belum punya akun login, jadi tidak ada yang perlu diubah.` };
    }
    return {
      ok: true,
      message: res.changed
        ? `Akun login ${email} ${active ? 'diaktifkan kembali' : 'dinonaktifkan'}.`
        : `Akun login ${email} sudah dalam status yang diminta.`,
    };
  } catch (err) {
    return { ok: false, message: `Status akun login ${email} gagal diubah: ${(err as Error).message}` };
  }
}
