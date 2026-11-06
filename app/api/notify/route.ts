import { NextResponse } from 'next/server';
import { requireStaff, errorResponse, HttpError } from '@/lib/server/auth';
import { adminDb, adminMessaging } from '@/lib/server/firebase-admin';
import type { NoticeItem, UserRole } from '@/lib/types';

export const runtime = 'nodejs';

const INVALID_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

/**
 * POST /api/notify  { noticeId, onlyUnread? }
 * Kirim notifikasi push pengumuman ke perangkat staf (pimpinan & IT saja).
 * onlyUnread=true → hanya ke staf yang belum mengonfirmasi baca (pengingat).
 */
export async function POST(req: Request) {
  try {
    const sender = await requireStaff(req, ['IT_ADMIN', 'EXECUTIVE']);
    const { noticeId, onlyUnread } = (await req.json().catch(() => ({}))) as { noticeId?: string; onlyUnread?: boolean };
    if (!noticeId || typeof noticeId !== 'string') throw new HttpError(400, 'noticeId wajib diisi.');

    const db = adminDb();
    const noticeSnap = await db.doc(`notices/${noticeId}`).get();
    if (!noticeSnap.exists) throw new HttpError(404, 'Pengumuman tidak ditemukan.');
    const notice = noticeSnap.data() as NoticeItem;

    const [tokenSnap, readSnap] = await Promise.all([
      db.collection('pushTokens').get(),
      onlyUnread ? db.collection(`notices/${noticeId}/reads`).get() : Promise.resolve(null),
    ]);
    const alreadyRead = new Set(readSnap?.docs.map((d) => d.id) ?? []);

    const recipients = tokenSnap.docs.filter((d) => {
      const t = d.data() as { email: string; role: string };
      if (notice.targetRoles?.length && !notice.targetRoles.includes(t.role as UserRole)) return false;
      return !alreadyRead.has(t.email);
    });

    let sent = 0;
    let failed = 0;
    const origin = new URL(req.url).origin;
    const link = `${origin}/dashboard/notices?notice=${encodeURIComponent(noticeId)}`;
    const prefix = notice.priority === 'URGENT' ? '🔴 MENDESAK: ' : onlyUnread ? '🔔 Pengingat: ' : '📢 ';

    for (let i = 0; i < recipients.length; i += 500) {
      const batch = recipients.slice(i, i + 500);
      const result = await adminMessaging().sendEachForMulticast({
        tokens: batch.map((d) => d.id),
        data: { noticeId, url: link },
        webpush: {
          notification: {
            title: `${prefix}${notice.title}`.slice(0, 120),
            body: notice.content.slice(0, 180),
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-192x192.png',
            tag: `notice-${noticeId}`,
          },
          fcmOptions: { link },
        },
      });
      sent += result.successCount;
      failed += result.failureCount;
      // Bersihkan token perangkat yang sudah tidak berlaku.
      await Promise.all(
        result.responses.map((r, idx) =>
          !r.success && r.error && INVALID_TOKEN_CODES.has(r.error.code) ? batch[idx].ref.delete() : null
        )
      );
    }

    await Promise.all([
      noticeSnap.ref.update({ lastPushAt: new Date().toISOString() }),
      db.collection('auditLogs').add({
        userEmail: sender.email,
        userName: sender.name,
        actorEmail: sender.email,
        action: onlyUnread ? 'PUSH_REMINDER' : 'PUSH_NOTICE',
        details: `Notifikasi push "${notice.title.slice(0, 60)}" → ${sent} perangkat terkirim, ${failed} gagal`,
        category: 'NOTICE',
        timestamp: new Date().toISOString(),
      }),
    ]);

    return NextResponse.json({ recipients: recipients.length, sent, failed });
  } catch (err) {
    return errorResponse(err);
  }
}
