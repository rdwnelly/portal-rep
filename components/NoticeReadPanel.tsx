'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Eye, Users, Clock, ChevronDown, BellRing } from 'lucide-react';
import { NoticeItem, NoticeRead, WhitelistedUser } from '@/lib/types';
import { useAuth, isManagerRole } from '@/lib/auth-context';
import {
  confirmNoticeRead,
  getWhitelist,
  subscribeMyNoticeRead,
  subscribeNoticeReads,
  STORAGE_UPDATE_EVENT,
  isRemoteStore,
} from '@/lib/storage';
import { sendNoticePush } from '@/lib/push';

const formatTime = (iso: string) =>
  new Date(iso).toLocaleString('id-ID', {
    timeZone: 'Asia/Jayapura',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

/**
 * Konfirmasi baca pengumuman.
 *  • Staf yang login: tombol "Saya sudah membaca & memahami".
 *  • Pimpinan / IT: ringkasan siapa yang sudah & belum mengonfirmasi (real-time).
 * Dipasang dengan key={notice.id} sehingga state otomatis bersih untuk tiap pengumuman.
 */
export default function NoticeReadPanel({ notice }: { notice: NoticeItem }) {
  const { user } = useAuth();
  const isManager = isManagerRole(user?.role);

  const [myRead, setMyRead] = useState<NoticeRead | null>(null);
  const [reads, setReads] = useState<NoticeRead[]>([]);
  const [roster, setRoster] = useState<WhitelistedUser[]>(() => (isManager ? getWhitelist() : []));
  const [submitting, setSubmitting] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [reminder, setReminder] = useState<{ busy: boolean; message?: string; isError?: boolean }>({ busy: false });

  const handleRemind = async () => {
    setReminder({ busy: true });
    try {
      const r = await sendNoticePush(notice.id, true);
      setReminder({
        busy: false,
        message: r.recipients
          ? `Pengingat terkirim ke ${r.sent} perangkat${r.failed ? ` (${r.failed} gagal)` : ''}.`
          : 'Tidak ada perangkat staf belum-membaca yang mengaktifkan notifikasi.',
      });
    } catch (err) {
      setReminder({ busy: false, message: (err as Error).message, isError: true });
    }
  };

  useEffect(() => {
    if (!user) return;
    return subscribeMyNoticeRead(notice.id, user.email, setMyRead);
  }, [notice.id, user]);

  useEffect(() => {
    if (!isManager) return;
    const unsubReads = subscribeNoticeReads(notice.id, setReads);
    const refreshRoster = () => setRoster(getWhitelist());
    window.addEventListener(STORAGE_UPDATE_EVENT, refreshRoster);
    return () => {
      unsubReads();
      window.removeEventListener(STORAGE_UPDATE_EVENT, refreshRoster);
    };
  }, [notice.id, isManager]);

  // Staf sasaran: seluruh staf aktif, atau hanya role tertentu bila pengumuman ditargetkan.
  const audience = useMemo(
    () =>
      roster.filter(
        (u) => u.active && (!notice.targetRoles?.length || notice.targetRoles.includes(u.role))
      ),
    [roster, notice.targetRoles]
  );
  const readEmails = useMemo(() => new Set(reads.map((r) => r.email)), [reads]);
  const unread = audience.filter((u) => !readEmails.has(u.email.toLowerCase()));
  const readCount = audience.length - unread.length;
  const percent = audience.length ? Math.round((readCount / audience.length) * 100) : 0;

  const handleConfirm = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      await confirmNoticeRead(notice.id, { email: user.email, name: user.displayName, role: user.role });
    } catch {
      // Pesan kesalahan sudah ditampilkan oleh StorageStatusToast.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-3 space-y-3">
      {/* Status pribadi */}
      {!user ? (
        <p className="text-[11px] text-slate-400 text-center">
          Staf yayasan:{' '}
          <Link href="/dashboard/admin/login?next=%2Fdashboard%2Fnotices" className="text-amber-400 font-bold underline">
            masuk
          </Link>{' '}
          untuk mengonfirmasi bahwa Anda telah membaca pengumuman ini.
        </p>
      ) : myRead ? (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Anda telah mengonfirmasi membaca pengumuman ini pada <strong>{formatTime(myRead.readAt)} WIT</strong>.
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleConfirm}
          disabled={submitting}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg disabled:opacity-60 cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{submitting ? 'Menyimpan...' : 'Saya sudah membaca & memahami'}</span>
        </button>
      )}

      {/* Ringkasan untuk pimpinan */}
      {isManager && (
        <div className="p-3 rounded-xl bg-[#0c241b] border border-amber-500/25 text-xs space-y-2">
          <button
            type="button"
            onClick={() => setShowDetail((v) => !v)}
            className="w-full flex items-center justify-between gap-2 cursor-pointer"
            aria-expanded={showDetail}
          >
            <span className="flex items-center gap-2 font-bold text-white">
              <Eye className="w-4 h-4 text-amber-400" />
              Status baca: {readCount}/{audience.length} staf ({percent}%)
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showDetail ? 'rotate-180' : ''}`} />
          </button>

          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden" aria-hidden>
            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${percent}%` }} />
          </div>

          {isRemoteStore && unread.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleRemind}
                disabled={reminder.busy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-600 text-white text-[11px] font-bold disabled:opacity-60 cursor-pointer"
              >
                <BellRing className="w-3.5 h-3.5" />
                {reminder.busy ? 'Mengirim…' : `Kirim pengingat ke ${unread.length} staf yang belum membaca`}
              </button>
              {reminder.message && (
                <span className={`text-[11px] ${reminder.isError ? 'text-rose-300' : 'text-emerald-300'}`}>{reminder.message}</span>
              )}
            </div>
          )}

          {showDetail && (
            <div className="grid sm:grid-cols-2 gap-3 pt-1">
              <div>
                <p className="text-[10px] font-bold uppercase text-rose-300 mb-1 flex items-center gap-1">
                  <Users className="w-3 h-3" /> Belum mengonfirmasi ({unread.length})
                </p>
                <ul className="space-y-0.5 text-slate-300 max-h-32 overflow-y-auto">
                  {unread.map((u) => (
                    <li key={u.email}>{u.name}</li>
                  ))}
                  {unread.length === 0 && <li className="text-emerald-300">Semua staf sudah membaca.</li>}
                </ul>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-emerald-300 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Sudah ({reads.length})
                </p>
                <ul className="space-y-0.5 text-slate-300 max-h-32 overflow-y-auto">
                  {reads.map((r) => (
                    <li key={r.email}>
                      {r.name} <span className="text-slate-500">· {formatTime(r.readAt)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
