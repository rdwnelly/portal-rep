'use client';

import React, { useState, useEffect } from 'react';
import { FoundationDocument, DocumentCategory, DocumentFileType } from '@/lib/types';
import {
  X,
  FileText,
  HardDrive,
  Save,
  Plus,
  Edit,
  AlertCircle,
  Building,
  Tag,
  ShieldAlert,
  Sparkles,
  Link2
} from 'lucide-react';
import { PapuanBorderCorner } from '@/components/PapuanMotif';

interface CreateDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (docData: Omit<FoundationDocument, 'id' | 'lastUpdated'>, docId?: string) => void;
  initialData?: FoundationDocument | null;
  currentUserDisplayName?: string;
}

export default function CreateDocumentModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  currentUserDisplayName = 'Admin Yayasan REP',
}: CreateDocumentModalProps) {
  const isEditing = !!initialData;

  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('SOP_OPERASIONAL');
  const [department, setDepartment] = useState('Operasional & Frontdesk');
  const [fileType, setFileType] = useState<DocumentFileType>('PDF');
  const [fileSize, setFileSize] = useState('1.5 MB');
  const [version, setVersion] = useState('v1.0 (2026)');
  const [gdriveUrl, setGdriveUrl] = useState('');
  const [isConfidential, setIsConfidential] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setCode(initialData.code);
      setDescription(initialData.description);
      setCategory(initialData.category);
      setDepartment(initialData.department);
      setFileType(initialData.fileType);
      setFileSize(initialData.fileSize || '');
      setVersion(initialData.version);
      setGdriveUrl(initialData.gdriveUrl);
      setIsConfidential(!!initialData.isConfidential);
      setIsFavorite(!!initialData.isFavorite);
      setTagsInput(initialData.tags.join(', '));
    } else {
      setTitle('');
      setCode('SOP-REP-');
      setDescription('');
      setCategory('SOP_OPERASIONAL');
      setDepartment('Operasional & Frontdesk');
      setFileType('PDF');
      setFileSize('1.2 MB');
      setVersion('v1.0 (2026)');
      setGdriveUrl('');
      setIsConfidential(false);
      setIsFavorite(false);
      setTagsInput('SOP, Yayasan, Operasional');
    }
    setErrorMsg('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Judul dokumen tidak boleh kosong.');
      return;
    }
    if (!gdriveUrl.trim()) {
      setErrorMsg('Tautan Google Drive wajib diisi.');
      return;
    }

    // Auto extract Google Drive File ID if possible
    let fileId: string | undefined;
    if (gdriveUrl.includes('/file/d/')) {
      const match = gdriveUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) fileId = match[1];
    } else if (gdriveUrl.includes('/spreadsheets/d/')) {
      const match = gdriveUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) fileId = match[1];
    } else if (gdriveUrl.includes('/document/d/')) {
      const match = gdriveUrl.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) fileId = match[1];
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    onSave(
      {
        title: title.trim(),
        code: code.trim().toUpperCase() || 'DOC-REP-001',
        description: description.trim(),
        category,
        department: department.trim() || 'Umum Yayasan',
        fileType,
        fileSize: fileSize.trim() || '1.0 MB',
        version: version.trim() || 'v1.0 (2026)',
        gdriveUrl: gdriveUrl.trim(),
        gdriveFileId: fileId,
        isConfidential,
        isFavorite,
        downloadsCount: initialData ? initialData.downloadsCount : 0,
        uploadedBy: currentUserDisplayName,
        tags: tags.length > 0 ? tags : ['Dokumen', 'SOP'],
      },
      initialData ? initialData.id : undefined
    );
    onClose();
  };

  const departmentPresets = [
    'Operasional & Frontdesk',
    'Keuangan & Akuntansi',
    'Yaswar Cafe & Gudang (OMG)',
    'Media Kreatif & Zeey Studio',
    'Manajemen Eksekutif',
    'Teknologi Informasi & Sistem',
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
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              {isEditing ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white font-serif">
                {isEditing ? 'Ubah Informasi Dokumen & SOP' : 'Tambah Dokumen & SOP Baru'}
              </h2>
              <p className="text-xs text-slate-300">
                Pusat Arsip Digital & Cloud Google Drive Yayasan REP
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

            {/* Judul & Kode SOP */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Judul Dokumen / SOP <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: SOP Pelayanan Tamu & Reservasi Homestay"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-[#081a13] border border-amber-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-all text-sm font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Kode Dokumen <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="SOP-REP-OPS-001"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#081a13] border border-amber-500/30 text-amber-400 font-mono text-xs uppercase focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Tautan Google Drive */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tautan Berkas Google Drive / Cloud URL</span>
                <span className="text-rose-400">*</span>
              </label>
              <input
                type="url"
                value={gdriveUrl}
                onChange={(e) => setGdriveUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/... atau https://docs.google.com/..."
                required
                className="w-full px-4 py-2.5 rounded-xl bg-[#081a13] border border-emerald-500/40 text-emerald-300 font-mono text-xs focus:outline-none focus:border-emerald-400"
              />
              <p className="text-[10px] text-slate-400">
                Mendukung link file Google Drive (PDF/Word/Excel) atau tautan folder arsip bersama.
              </p>
            </div>

            {/* Kategori & Departemen */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Kategori Dokumen</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#081a13] border border-amber-500/30 text-slate-200 text-xs font-semibold focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="SOP_OPERASIONAL">🏡 SOP Operasional & Homestay</option>
                  <option value="SOP_KEUANGAN">💰 SOP Keuangan & SIK-REP</option>
                  <option value="SOP_GUDANG_KASIR">🛍️ SOP Kasir Yaswar & Gudang OMG</option>
                  <option value="SOP_MEDIA_KREATIF">📸 SOP Media & Zeey Studio</option>
                  <option value="TEMPLATE_SURAT">📝 Template Formulir & Surat</option>
                  <option value="LEGALITAS_YAYASAN">⚖️ Legalitas & Akta Notaris</option>
                  <option value="PANDUAN_IT">💻 Panduan IT & Sistem SSO</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Departemen / Divisi</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#081a13] border border-amber-500/30 text-slate-200 text-xs font-semibold focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  {departmentPresets.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tipe File, Versi, Ukuran */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Format Berkas</label>
                <select
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value as DocumentFileType)}
                  className="w-full px-3 py-2 rounded-xl bg-[#081a13] border border-amber-500/30 text-white text-xs font-semibold focus:outline-none focus:border-amber-400"
                >
                  <option value="PDF">📄 PDF Document</option>
                  <option value="DOCX">📘 Microsoft Word (DOCX)</option>
                  <option value="XLSX">📊 Microsoft Excel (XLSX)</option>
                  <option value="PPTX">📙 PowerPoint (PPTX)</option>
                  <option value="GDRIVE_FOLDER">📁 Google Drive Folder</option>
                  <option value="ARCHIVE_ZIP">📦 ZIP Archive</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Versi Dokumen</label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="v2.1 (2026)"
                  className="w-full px-3 py-2 rounded-xl bg-[#081a13] border border-amber-500/30 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Ukuran File</label>
                <input
                  type="text"
                  value={fileSize}
                  onChange={(e) => setFileSize(e.target.value)}
                  placeholder="1.8 MB"
                  className="w-full px-3 py-2 rounded-xl bg-[#081a13] border border-amber-500/30 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Deskripsi */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Deskripsi & Isi Ringkas</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Penjelasan fungsi SOP, alur kerja, atau panduan pengisian..."
                className="w-full px-4 py-2.5 rounded-xl bg-[#081a13] border border-amber-500/30 text-white text-xs leading-relaxed focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Tags & Flags */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kata Kunci / Tags (pisahkan dengan koma)</span>
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Homestay, Frontdesk, Check-in, SOP"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#081a13] border border-amber-500/30 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#0c281e] border border-amber-500/25 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isFavorite}
                    onChange={(e) => setIsFavorite(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Sematkan ke Dokumen Unggulan
                  </span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#0c281e] border border-rose-500/25 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isConfidential}
                    onChange={(e) => setIsConfidential(e.target.checked)}
                    className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-rose-300 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    Dokumen Rahasia (Internal Khusus)
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
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-extrabold transition-all shadow-lg shadow-emerald-950/60 active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Simpan Perubahan' : 'Terbitkan Dokumen'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
