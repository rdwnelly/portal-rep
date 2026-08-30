'use client';

import React, { useState, useEffect } from 'react';
import { CalendarEvent, EventCategory, EventStatus } from '@/lib/types';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  Sparkles,
  Save,
  Plus,
  Edit,
  AlertCircle
} from 'lucide-react';
import { PapuanBorderCorner } from '@/components/PapuanMotif';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: Omit<CalendarEvent, 'id' | 'createdAt'>, eventId?: string) => void;
  initialData?: CalendarEvent | null;
  currentUserDisplayName?: string;
}

export default function CreateEventModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  currentUserDisplayName = 'Admin Yayasan REP',
}: CreateEventModalProps) {
  const isEditing = !!initialData;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [timeStart, setTimeStart] = useState('09:00');
  const [timeEnd, setTimeEnd] = useState('11:00');
  const [location, setLocation] = useState('Rumah Etnik Papua Km. 21 Aimas');
  const [category, setCategory] = useState<EventCategory>('CULTURE_EVENT');
  const [status, setStatus] = useState<EventStatus>('UPCOMING');
  const [organizer, setOrganizer] = useState(currentUserDisplayName);
  const [targetAudience, setTargetAudience] = useState('Semua Staf & Pengunjung');
  const [isHighlight, setIsHighlight] = useState(false);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Pre-fill if editing
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description);
      setDate(initialData.date);
      setTimeStart(initialData.timeStart);
      setTimeEnd(initialData.timeEnd || '');
      setLocation(initialData.location);
      setCategory(initialData.category);
      setStatus(initialData.status);
      setOrganizer(initialData.organizer);
      setTargetAudience(initialData.targetAudience || '');
      setIsHighlight(!!initialData.isHighlight);
      setNotes(initialData.notes || '');
    } else {
      // Default to today's date
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      setDate(`${yyyy}-${mm}-${dd}`);
      setTitle('');
      setDescription('');
      setTimeStart('09:00');
      setTimeEnd('11:30');
      setLocation('Rumah Etnik Papua Km. 21 Aimas');
      setCategory('CULTURE_EVENT');
      setStatus('UPCOMING');
      setOrganizer(currentUserDisplayName);
      setTargetAudience('Semua Staf & Pengunjung');
      setIsHighlight(false);
      setNotes('');
    }
    setErrorMsg('');
  }, [initialData, isOpen, currentUserDisplayName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Judul agenda tidak boleh kosong.');
      return;
    }
    if (!date) {
      setErrorMsg('Pilih tanggal agenda.');
      return;
    }
    if (!timeStart) {
      setErrorMsg('Waktu mulai harus diisi.');
      return;
    }

    onSave(
      {
        title: title.trim(),
        description: description.trim(),
        date,
        timeStart,
        timeEnd: timeEnd || undefined,
        location: location.trim() || 'Rumah Etnik Papua Km. 21',
        category,
        status,
        organizer: organizer.trim() || currentUserDisplayName,
        targetAudience: targetAudience.trim() || undefined,
        isHighlight,
        notes: notes.trim() || undefined,
        createdBy: currentUserDisplayName,
      },
      initialData ? initialData.id : undefined
    );
    onClose();
  };

  const locationPresets = [
    'Panggung Utama Sanggar Tari REP',
    'Yaswar Cafe & Taman Etnik',
    'Homestay Etnik Mansinam Km. 21',
    'Pendopo Workshop & Suvenir OMG',
    'Ruang Rapat Pimpinan Yayasan',
    'Pusat Kontrol IT & Server Cloud',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl rounded-3xl bg-[#091f17] border-2 border-amber-500/40 shadow-2xl text-slate-100 overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <PapuanBorderCorner position="top-right" />
        <PapuanBorderCorner position="bottom-left" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-amber-500/20 bg-gradient-to-r from-[#0d2a1f] to-[#091f17]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              {isEditing ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white font-serif">
                {isEditing ? 'Ubah Rincian Agenda' : 'Tambah Agenda Budaya & Operasional'}
              </h2>
              <p className="text-xs text-slate-300">
                Yayasan Rumah Etnik Papua (Zona Waktu WIT)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-all border border-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Judul Agenda */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Judul Agenda / Event <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Pentas Tari Tradisional Sambutan Tamu Wisata"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-[#081a13] border border-amber-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-all text-sm font-medium"
              />
            </div>

            {/* Kategori & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Kategori Agenda</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as EventCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#081a13] border border-amber-500/30 text-slate-200 text-xs font-semibold focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="CULTURE_EVENT">🎭 Pentas Seni & Budaya</option>
                  <option value="HOMESTAY_TOUR">🏡 Kunjungan Tamu & Homestay</option>
                  <option value="EXECUTIVE_MEETING">👔 Rapat Pimpinan & Staf</option>
                  <option value="COMMUNITY_WORKSHOP">🪵 Workshop & Edukasi Budaya</option>
                  <option value="SYSTEM_MAINTENANCE">⚡ Pemeliharaan Sistem / IT</option>
                  <option value="GENERAL_AGENDA">📋 Agenda Harian Umum</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Status Agenda</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as EventStatus)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#081a13] border border-amber-500/30 text-slate-200 text-xs font-semibold focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="UPCOMING">🔵 Akan Datang (Upcoming)</option>
                  <option value="ONGOING">🟢 Sedang Berlangsung (Live)</option>
                  <option value="COMPLETED">✅ Selesai (Completed)</option>
                  <option value="CANCELLED">❌ Dibatalkan (Cancelled)</option>
                </select>
              </div>
            </div>

            {/* Tanggal & Waktu WIT */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  Tanggal <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#081a13] border border-amber-500/30 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Waktu Mulai (WIT) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="time"
                  value={timeStart}
                  onChange={(e) => setTimeStart(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#081a13] border border-amber-500/30 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Waktu Selesai (WIT)
                </label>
                <input
                  type="time"
                  value={timeEnd}
                  onChange={(e) => setTimeEnd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#081a13] border border-amber-500/30 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Lokasi Acara + Preset */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                Lokasi di Kompleks Rumah Etnik Papua
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Contoh: Panggung Terbuka Yaswar Cafe & Taman Etnik"
                className="w-full px-4 py-2.5 rounded-xl bg-[#081a13] border border-amber-500/30 text-white text-sm focus:outline-none focus:border-amber-400"
              />
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] text-slate-400">Pilihan Cepat:</span>
                {locationPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setLocation(preset)}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-[#0c281e] hover:bg-[#12382c] border border-emerald-500/20 text-emerald-300 transition-all cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Penyelenggara & Target Peserta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  Penanggung Jawab / Penyelenggara
                </label>
                <input
                  type="text"
                  value={organizer}
                  onChange={(e) => setOrganizer(e.target.value)}
                  placeholder="Contoh: Bpk. Fricky Mosche Burdam"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#081a13] border border-amber-500/30 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-teal-400" />
                  Target Peserta / Tamu
                </label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="Contoh: Seluruh Staf & Pengunjung Umum"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#081a13] border border-amber-500/30 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Deskripsi & Rundown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Deskripsi & Rundown Acara</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tuliskan gambaran acara, susunan acara, atau arahan persiapan untuk staf..."
                className="w-full px-4 py-2.5 rounded-xl bg-[#081a13] border border-amber-500/30 text-white text-xs leading-relaxed focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Catatan Khusus & Highlight Switch */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Catatan Khusus (Opsional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Hubungi IT jika butuh proyektor dan sound"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#081a13] border border-amber-500/30 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-4 sm:pt-6">
                <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#0c281e] border border-amber-500/25 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isHighlight}
                    onChange={(e) => setIsHighlight(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Agenda Unggulan
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 sm:p-5 border-t border-amber-500/20 bg-[#081a13] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all border border-slate-700 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-extrabold transition-all shadow-lg shadow-amber-950/60 active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Simpan Perubahan' : 'Terbitkan Agenda'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
