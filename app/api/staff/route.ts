import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { requireStaff, errorResponse, HttpError } from '@/lib/server/auth';
import { adminAuth, adminDb } from '@/lib/server/firebase-admin';

export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Kata sandi awal yang tidak pernah ditampilkan ke siapa pun — termasuk Admin IT.
 * Satu-satunya jalan masuk ke akun baru adalah tautan "buat kata sandi" yang dikirim
 * ke alamat email staf, sehingga kepemilikan kotak surat tetap menjadi bukti identitas.
 */
const throwawayPassword = () => `${randomBytes(24).toString('base64url')}Aa1!`;

function cleanEmail(value: unknown): string {
  const email = String(value ?? '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) throw new HttpError(400, 'Alamat email tidak valid.');
  return email;
}

/** Dokumen whitelist adalah sumber kebenaran: route ini tidak pernah memberi akses baru. */
async function requireWhitelisted(email: string) {
  const snap = await adminDb().doc(`whitelist/${email}`).get();
  if (!snap.exists) {
    throw new HttpError(404, `${email} belum ada di whitelist. Tambahkan karyawannya lebih dulu.`);
  }
  return snap.data() as { name?: string; active?: boolean };
}

async function audit(actorEmail: string, actorName: string, action: string, details: string) {
  await adminDb()
    .collection('auditLogs')
    .add({
      userEmail: actorEmail,
      userName: actorName,
      actorEmail,
      action,
      details,
      category: 'WHITELIST',
      timestamp: new Date().toISOString(),
    })
    .catch((err) => console.warn('Audit akun staf gagal dicatat:', err));
}

const authErrorCode = (err: unknown) => (err as { code?: string })?.code;

/**
 * POST /api/staff  { email }
 *
 * Siapkan akun Firebase Authentication milik staf yang sudah ada di whitelist.
 * Tanpa langkah ini, karyawan baru hanya punya dokumen whitelist: tombol
 * "Lupa kata sandi" tidak mengirim apa pun (akunnya belum ada) sehingga ia tidak
 * pernah bisa masuk.
 */
export async function POST(req: Request) {
  try {
    const admin = await requireStaff(req, ['IT_ADMIN']);
    const body = (await req.json().catch(() => ({}))) as { email?: string };
    const email = cleanEmail(body.email);
    const entry = await requireWhitelisted(email);

    const auth = adminAuth();
    let created = false;
    let emailVerified: boolean;
    let reactivated = false;

    try {
      const user = await auth.getUserByEmail(email);
      emailVerified = user.emailVerified;
      // Akun lama yang pernah dinonaktifkan dibuka kembali bila whitelist-nya aktif.
      if (user.disabled && entry.active === true) {
        await auth.updateUser(user.uid, { disabled: false });
        reactivated = true;
      }
      // Status "terverifikasi" TIDAK pernah dipaksakan pada akun yang sudah ada: akun itu
      // bisa saja dibuat sendiri oleh orang lain memakai alamat ini. Menyelesaikan tautan
      // atur ulang kata sandi membuktikan kepemilikan kotak surat sekaligus menandainya.
    } catch (err) {
      if (authErrorCode(err) !== 'auth/user-not-found') throw err;
      await auth.createUser({
        email,
        displayName: entry.name || email,
        password: throwawayPassword(),
        // Aman: akun ini dibuat portal dengan kata sandi acak yang tidak diketahui siapa pun,
        // jadi tidak ada yang bisa memakainya sebelum staf menyetel kata sandinya sendiri.
        emailVerified: true,
        disabled: entry.active !== true,
      });
      created = true;
      emailVerified = true;
    }

    await audit(
      admin.email,
      admin.name,
      created ? 'CREATE_AUTH_ACCOUNT' : 'SYNC_AUTH_ACCOUNT',
      created
        ? `Membuat akun login untuk ${email}`
        : `Menyelaraskan akun login ${email}${reactivated ? ' (diaktifkan kembali)' : ''}`
    );

    return NextResponse.json(
      { email, created, emailVerified, reactivated },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * PATCH /api/staff  { email, active }
 *
 * Selaraskan status aktif whitelist ke akun Authentication. Menonaktifkan di whitelist saja
 * hanya menutup portal; token yang sudah terbit masih bisa dipakai sampai kedaluwarsa.
 * Menonaktifkan akunnya membuat staf itu tidak bisa memperoleh token baru sama sekali.
 */
export async function PATCH(req: Request) {
  try {
    const admin = await requireStaff(req, ['IT_ADMIN']);
    const body = (await req.json().catch(() => ({}))) as { email?: string; active?: boolean };
    const email = cleanEmail(body.email);
    if (typeof body.active !== 'boolean') throw new HttpError(400, 'Field "active" wajib berupa boolean.');

    // Admin tidak boleh mengunci dirinya sendiri keluar dari portal.
    if (email === admin.email && body.active === false) {
      throw new HttpError(400, 'Anda tidak dapat menonaktifkan akun Anda sendiri.');
    }

    const auth = adminAuth();
    try {
      const user = await auth.getUserByEmail(email);
      if (user.disabled === !body.active) {
        return NextResponse.json({ email, active: body.active, changed: false });
      }
      await auth.updateUser(user.uid, { disabled: !body.active });
    } catch (err) {
      // Belum punya akun login — tidak ada yang perlu dinonaktifkan.
      if (authErrorCode(err) === 'auth/user-not-found') {
        return NextResponse.json({ email, active: body.active, changed: false, missing: true });
      }
      throw err;
    }

    await audit(
      admin.email,
      admin.name,
      body.active ? 'ENABLE_AUTH_ACCOUNT' : 'DISABLE_AUTH_ACCOUNT',
      `${body.active ? 'Mengaktifkan' : 'Menonaktifkan'} akun login ${email}`
    );

    return NextResponse.json({ email, active: body.active, changed: true });
  } catch (err) {
    return errorResponse(err);
  }
}
