'use client';

import React, { useState } from 'react';
import { CalendarEvent, EventCategory } from '@/lib/types';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  Share2,
  Copy,
  Check,
  Edit,
  Trash2,
  AlertCircle,
  Sparkles,
  CalendarPlus
} from 'lucide-react';
import { PapuanBorderCorner } from '@/components/PapuanMotif';

interface EventDetailModalProps {
  event: CalendarEvent | null;
  onClose: () => void;
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (id: string) => void;
  canManage?: boolean;
}

export function getCategoryBadge(category: EventCategory) {
  switch (category) {
    case 'CULTURE_EVENT':
      return {
        label: 'Pentas Seni & Budaya',
        bgColor: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
        dotColor: 'bg-amber-400',
      };
    case 'HOMESTAY_TOUR':
      return {
        label: 'Kunjungan Tamu & Homestay',
        bgColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
        dotColor: 'bg-emerald-400',
      };
    case 'EXECUTIVE_MEETING':
      return {
        label: 'Rapat Pimpinan & Staf',
        bgColor: 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40',
        dotColor: 'bg-indigo-400',
      };
    case 'COMMUNITY_WORKSHOP':
      return {
        label: 'Workshop & Edukasi Budaya',
        bgColor: 'bg-teal-950/80 text-teal-300 border-teal-500/40',
        dotColor: 'bg-teal-400',
      };
    case 'SYSTEM_MAINTENANCE':
      return {
        label: 'Pemeliharaan Sistem / IT',
        bgColor: 'bg-purple-950/80 text-purple-300 border-purple-500/40',
        dotColor: 'bg-purple-400',
      };
    default:
      return {
        label: 'Agenda Umum',
        bgColor: 'bg-stone-900/80 text-stone-300 border-stone-600/40',
        dotColor: 'bg-stone-400',
      };
  }
}

export default function EventDetailModal({
  event,
  onClose,
  onEdit,
  onDelete,
  canManage = false,
}: EventDetailModalProps) {
  const [copied, setCopied] = useState(false);

  if (!event) return null;

  const categoryInfo = getCategoryBadge(event.category);

  // Format Date in Indonesian WIT
  const formatIndonesianDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  // Google Calendar Link generator
  const createGoogleCalendarUrl = () => {
    try {
      const [year, month, day] = event.date.split('-');
      const startH = (event.timeStart || '09:00').replace(':', '');
      const endH = (event.timeEnd || '11:00').replace(':', '');

      // Time in WIT is UTC+9. Google Calendar template uses YYYYMMDDTHHmmSSZ or local time.
      const startTime = `${year}${month}${day}T${startH}00`;
      const endTime = `${year}${month}${day}T${endH}00`;

      const title = encodeURIComponent(`[REP] ${event.title}`);
      const details = encodeURIComponent(
        `${event.description}\n\n📍 Lokasi: ${event.location}\n👤 Penyelenggara: ${event.organizer}\n👥 Peserta: ${event.targetAudience || 'Semua Staf'}\n\nDisinkronkan dari PORTAL REP (Yayasan Rumah Etnik Papua)`
      );
      const location = encodeURIComponent(`${event.location}, Sorong, Papua Barat Daya`);

      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&ctz=Asia/Jayapura&details=${details}&location=${location}`;
    } catch {
      return 'https://calendar.google.com';
    }
  };

  // WhatsApp Broadcast Link generator
  const createWhatsAppShareUrl = () => {
    const text = `*AGENDA YAYASAN RUMAH ETNIK PAPUA*\n\n📌 *${event.title}*\n🗓️ Tanggal: ${formatIndonesianDate(event.date)}\n⏰ Waktu: ${event.timeStart} ${event.timeEnd ? `- ${event.timeEnd}` : ''} WIT\n📍 Lokasi: ${event.location}\n👤 Penyelenggara: ${event.organizer}\n👥 Target: ${event.targetAudience || 'Semua Staf'}\n\n📝 *Deskripsi:*\n${event.description}\n\n_Lihat di Portal REP: https://portal-rep.vercel.app/agenda_`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  };

  const handleCopySummary = () => {
    const text = `Agenda: ${event.title}\nTanggal: ${formatIndonesianDate(event.date)}\nWaktu: ${event.timeStart} WIT\nLokasi: ${event.location}\nPenyelenggara: ${event.organizer}\n\n${event.description}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl rounded-3xl bg-[#091f17] border-2 border-amber-500/40 shadow-2xl text-slate-100 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <PapuanBorderCorner position="top-right" />
        <PapuanBorderCorner position="bottom-left" />

        {/* Modal Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-amber-500/20 bg-gradient-to-r from-[#0d2a1f] to-[#091f17]">
          <div className="space-y-2 pr-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[11px] font-extrabold px-3 py-1 rounded-full border flex items-center gap-1.5 ${categoryInfo.bgColor}`}
              >
                <span className={`w-2 h-2 rounded-full ${categoryInfo.dotColor} animate-pulse`} />
                {categoryInfo.label}
              </span>
              {event.isHighlight && (
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  AGENDA UNGGULAN
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight font-serif">
              {event.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-all border border-slate-700 cursor-pointer shrink-0"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          {/* Date, Time & Location Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Waktu */}
            <div className="p-3.5 rounded-2xl bg-[#0c281e] border border-amber-500/25 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  Hari & Tanggal
                </p>
                <p className="text-sm font-extrabold text-white">
                  {formatIndonesianDate(event.date)}
                </p>
                <p className="text-xs text-slate-300 font-mono mt-0.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  {event.timeStart} {event.timeEnd ? `- ${event.timeEnd}` : ''} WIT
                </p>
              </div>
            </div>

            {/* Lokasi */}
            <div className="p-3.5 rounded-2xl bg-[#0c281e] border border-amber-500/25 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  Lokasi Acara
                </p>
                <p className="text-xs sm:text-sm font-extrabold text-white leading-snug">
                  {event.location}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Rumah Etnik Papua Km. 21 Aimas
                </p>
              </div>
            </div>
          </div>

          {/* Organizer & Target Audience */}
          <div className="flex items-center gap-4 flex-wrap p-3.5 rounded-2xl bg-[#081a13] border border-emerald-500/20 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <User className="w-4 h-4 text-amber-400" />
              <span>
                Penyelenggara: <strong className="text-white">{event.organizer}</strong>
              </span>
            </div>
            {event.targetAudience && (
              <div className="flex items-center gap-2 text-slate-300">
                <Users className="w-4 h-4 text-teal-400" />
                <span>
                  Peserta: <strong className="text-teal-200">{event.targetAudience}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Deskripsi Lengkap */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Deskripsi & Rincian Agenda
            </h4>
            <div className="p-4 rounded-2xl bg-[#081a13] border border-amber-500/15 text-sm text-slate-200 leading-relaxed whitespace-pre-line">
              {event.description}
            </div>
          </div>

          {/* Catatan Khusus jika ada */}
          {event.notes && (
            <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300">Catatan Khusus: </strong>
                <span>{event.notes}</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Actions */}
        <div className="p-4 sm:p-5 border-t border-amber-500/20 bg-[#081a13] flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* External Action: Google Calendar & WhatsApp */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href={createGoogleCalendarUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <CalendarPlus className="w-4 h-4 text-white" />
              <span>Simpan ke Google Calendar</span>
            </a>

            <a
              href={createWhatsAppShareUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-md active:scale-95"
              title="Bagikan ke WhatsApp Staf"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={handleCopySummary}
              className="p-2.5 rounded-xl bg-[#0e271e] hover:bg-[#153a2d] border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all cursor-pointer"
              title="Salin Rincian Agenda"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Admin Controls */}
          {canManage && (
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(event)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Hapus agenda "${event.title}"?`)) {
                      onDelete(event.id);
                      onClose();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 text-xs font-bold transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
