'use client';

import React, { useState } from 'react';
import { FoundationDocument, DocumentCategory, DocumentFileType } from '@/lib/types';
import {
  X,
  FileText,
  ExternalLink,
  Download,
  Share2,
  Copy,
  Check,
  Edit,
  Trash2,
  ShieldAlert,
  Calendar,
  Building,
  Tag,
  Eye,
  EyeOff,
  Sparkles,
  HardDrive
} from 'lucide-react';
import { PapuanBorderCorner } from '@/components/PapuanMotif';
import confetti from 'canvas-confetti';
import { incrementDocDownload } from '@/lib/storage';

interface DocumentDetailModalProps {
  doc: FoundationDocument | null;
  onClose: () => void;
  onEdit?: (doc: FoundationDocument) => void;
  onDelete?: (id: string) => void;
  canManage?: boolean;
}

export function getDocCategoryInfo(category: DocumentCategory) {
  switch (category) {
    case 'SOP_OPERASIONAL':
      return {
        label: 'SOP Operasional & Homestay',
        bgColor: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
        dotColor: 'bg-amber-400',
      };
    case 'SOP_KEUANGAN':
      return {
        label: 'SOP Keuangan & SIK-REP',
        bgColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
        dotColor: 'bg-emerald-400',
      };
    case 'SOP_GUDANG_KASIR':
      return {
        label: 'SOP Kasir Yaswar & Gudang OMG',
        bgColor: 'bg-teal-950/80 text-teal-300 border-teal-500/40',
        dotColor: 'bg-teal-400',
      };
    case 'SOP_MEDIA_KREATIF':
      return {
        label: 'SOP Media & Zeey Studio',
        bgColor: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40',
        dotColor: 'bg-cyan-400',
      };
    case 'TEMPLATE_SURAT':
      return {
        label: 'Template Formulir & Surat',
        bgColor: 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40',
        dotColor: 'bg-indigo-400',
      };
    case 'LEGALITAS_YAYASAN':
      return {
        label: 'Legalitas & Akta Notaris',
        bgColor: 'bg-rose-950/80 text-rose-300 border-rose-500/40',
        dotColor: 'bg-rose-400',
      };
    case 'PANDUAN_IT':
      return {
        label: 'Panduan IT & Sistem SSO',
        bgColor: 'bg-purple-950/80 text-purple-300 border-purple-500/40',
        dotColor: 'bg-purple-400',
      };
    default:
      return {
        label: 'Dokumen Umum',
        bgColor: 'bg-stone-900/80 text-stone-300 border-stone-600/40',
        dotColor: 'bg-stone-400',
      };
  }
}

export function getDocFileBadge(fileType: DocumentFileType) {
  switch (fileType) {
    case 'PDF':
      return { label: 'PDF', bg: 'bg-red-950 text-red-300 border-red-500/40' };
    case 'DOCX':
      return { label: 'WORD (DOCX)', bg: 'bg-blue-950 text-blue-300 border-blue-500/40' };
    case 'XLSX':
      return { label: 'EXCEL (XLSX)', bg: 'bg-emerald-950 text-emerald-300 border-emerald-500/40' };
    case 'PPTX':
      return { label: 'POWERPOINT', bg: 'bg-orange-950 text-orange-300 border-orange-500/40' };
    case 'GDRIVE_FOLDER':
      return { label: 'G-DRIVE FOLDER', bg: 'bg-amber-950 text-amber-300 border-amber-500/40' };
    default:
      return { label: 'ZIP ARCHIVE', bg: 'bg-slate-900 text-slate-300 border-slate-600/40' };
  }
}

export default function DocumentDetailModal({
  doc,
  onClose,
  onEdit,
  onDelete,
  canManage = false,
}: DocumentDetailModalProps) {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  if (!doc) return null;

  const categoryInfo = getDocCategoryInfo(doc.category);
  const fileBadge = getDocFileBadge(doc.fileType);

  const formatDate = (isoString: string) => {
    try {
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date(isoString));
    } catch {
      return isoString;
    }
  };

  const handleOpenGoogleDrive = () => {
    incrementDocDownload(doc.id);
    if (typeof window !== 'undefined') {
      confetti({
        particleCount: 25,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#34a853', '#4285f4', '#fbbc05', '#ea4335'],
      });
      window.open(doc.gdriveUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCopyGdriveUrl = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(doc.gdriveUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const createWhatsAppShareUrl = () => {
    const text = `*ARSIP RESMI YAYASAN RUMAH ETNIK PAPUA*\n\n📄 *${doc.title}*\n🏷️ Kode: ${doc.code}\n📁 Kategori: ${categoryInfo.label}\n🏢 Divisi: ${doc.department}\n📦 Versi: ${doc.version} (${doc.fileSize || 'Dokumen Cloud'})\n\n📝 *Deskripsi:*\n${doc.description}\n\n🔗 *Akses Google Drive:*\n${doc.gdriveUrl}\n\n_Disinkronkan dari PORTAL REP (Sorong, Papua Barat Daya)_`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  };

  // Convert Google Drive view URL to embed preview
  const getGoogleDriveEmbedUrl = () => {
    if (doc.gdriveUrl.includes('/file/d/')) {
      const match = doc.gdriveUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://drive.google.com/file/d/${match[1]}/preview`;
      }
    }
    if (doc.gdriveUrl.includes('/spreadsheets/d/')) {
      const match = doc.gdriveUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://docs.google.com/spreadsheets/d/${match[1]}/preview`;
      }
    }
    if (doc.gdriveUrl.includes('/document/d/')) {
      const match = doc.gdriveUrl.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://docs.google.com/document/d/${match[1]}/preview`;
      }
    }
    return doc.gdriveUrl;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl rounded-3xl bg-[#091f17] border-2 border-amber-500/40 shadow-2xl text-slate-100 overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <PapuanBorderCorner position="top-right" />
        <PapuanBorderCorner position="bottom-left" />

        {/* Modal Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-amber-500/20 bg-gradient-to-r from-[#0d2a1f] to-[#091f17]">
          <div className="space-y-2 pr-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-lg bg-[#06140e] text-amber-400 border border-amber-500/30">
                {doc.code}
              </span>
              <span
                className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${categoryInfo.bgColor}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${categoryInfo.dotColor}`} />
                {categoryInfo.label}
              </span>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${fileBadge.bg}`}>
                {fileBadge.label}
              </span>
              {doc.isConfidential && (
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-rose-400" />
                  INTERNAL / RAHASIA
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-serif leading-tight">
              {doc.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-all border border-slate-700 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          {/* Google Drive Direct Access Action Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0d2a1f] via-[#091f17] to-[#06140e] border-2 border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <HardDrive className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-black text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Penyimpanan Google Drive Resmi</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </p>
                <p className="text-xs text-slate-300 mt-0.5 line-clamp-1 break-all">
                  {doc.gdriveUrl}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Versi: {doc.version} • Ukuran: {doc.fileSize || 'Cloud File'} • Diunduh {doc.downloadsCount || 0}x
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleOpenGoogleDrive}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-extrabold shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-white" />
                <span>Buka di Google Drive</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  showPreview
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-[#0c281e] hover:bg-[#12382c] border-amber-500/30 text-amber-300'
                }`}
                title={showPreview ? 'Tutup Pratinjau' : 'Pratinjau di Sini'}
              >
                {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Embedded Google Drive Preview if toggled */}
          {showPreview && (
            <div className="space-y-2 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between text-xs text-amber-400 font-bold">
                <span>Pratinjau Dokumen Langsung (Google Drive Viewer):</span>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-slate-400 hover:text-white"
                >
                  Tutup Pratinjau
                </button>
              </div>
              <div className="w-full h-80 rounded-2xl overflow-hidden border border-amber-500/30 bg-black/60 shadow-inner">
                <iframe
                  src={getGoogleDriveEmbedUrl()}
                  className="w-full h-full border-0"
                  title={doc.title}
                  allow="autoplay"
                />
              </div>
            </div>
          )}

          {/* Metadata Grid: Divisi & Tanggal Pembaruan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-[#081a13] border border-emerald-500/20 flex items-center gap-3">
              <Building className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-amber-400 uppercase">Divisi Terkait</p>
                <p className="text-xs font-bold text-white mt-0.5">{doc.department}</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#081a13] border border-emerald-500/20 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-teal-400 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-teal-400 uppercase">Pembaruan Terakhir</p>
                <p className="text-xs font-bold text-white mt-0.5">{formatDate(doc.lastUpdated)}</p>
              </div>
            </div>
          </div>

          {/* Deskripsi & Ringkasan Dokumen */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Deskripsi & Isi Panduan
            </h4>
            <div className="p-4 rounded-2xl bg-[#081a13] border border-amber-500/15 text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
              {doc.description}
            </div>
          </div>

          {/* Tags & Penanggung Jawab */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              <span>Kata Kunci / Tag Pencarian</span>
            </h4>
            <div className="flex items-center gap-1.5 flex-wrap">
              {doc.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#0c281e] text-emerald-300 border border-emerald-500/20"
                >
                  #{tag}
                </span>
              ))}
              <span className="text-[10px] text-slate-500 ml-auto">
                Diunggah oleh: <strong className="text-slate-300">{doc.uploadedBy}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-amber-500/20 bg-[#081a13] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href={createWhatsAppShareUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-md active:scale-95"
              title="Bagikan Tautan ke WhatsApp Staf"
            >
              <Share2 className="w-4 h-4" />
              <span>Bagikan ke WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={handleCopyGdriveUrl}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0e271e] hover:bg-[#153a2d] border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all cursor-pointer"
              title="Salin Tautan Google Drive"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Salin Link</span>
                </>
              )}
            </button>
          </div>

          {/* Admin Controls */}
          {canManage && (
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(doc)}
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
                    if (confirm(`Hapus dokumen "${doc.title}"?`)) {
                      onDelete(doc.id);
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
