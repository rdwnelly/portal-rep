'use client';

import React, { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getDocuments, addDocument, updateDocument, deleteDocument, incrementDocDownload } from '@/lib/storage';
import { INITIAL_DOCUMENTS } from '@/lib/seed-data';
import { FoundationDocument, DocumentCategory, DocumentFileType } from '@/lib/types';
import Navbar from '@/components/Navbar';
import PWAInstallModal from '@/components/PWAInstallModal';
import PWAInstallBanner from '@/components/PWAInstallBanner';
import DocumentDetailModal, { getDocCategoryInfo, getDocFileBadge } from '@/components/DocumentDetailModal';
import CreateDocumentModal from '@/components/CreateDocumentModal';
import { PapuanBorderCorner } from '@/components/PapuanMotif';
import confetti from 'canvas-confetti';
import {
  FileText,
  Search,
  Plus,
  ExternalLink,
  HardDrive,
  FolderOpen,
  Filter,
  Download,
  Eye,
  ShieldAlert,
  Sparkles,
  ChevronRight,
  Calendar,
  Building,
  Tag,
  Share2
} from 'lucide-react';

let cachedDocs: FoundationDocument[] = INITIAL_DOCUMENTS;

function subscribeStorage(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  cachedDocs = getDocuments();

  const handler = () => {
    cachedDocs = getDocuments();
    callback();
  };

  window.addEventListener('portal_rep_storage_update', handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('portal_rep_storage_update', handler);
    window.removeEventListener('storage', handler);
  };
}

export default function DocumentsVaultPage() {
  const { user } = useAuth();

  const docs = useSyncExternalStore(
    subscribeStorage,
    () => (typeof window !== 'undefined' ? cachedDocs : INITIAL_DOCUMENTS),
    () => INITIAL_DOCUMENTS
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedFileType, setSelectedFileType] = useState<string>('ALL');

  // Modals state
  const [pwaModalOpen, setPwaModalOpen] = useState(false);
  const [selectedDocForDetail, setSelectedDocForDetail] = useState<FoundationDocument | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<FoundationDocument | null>(null);

  const canManage = user?.role === 'EXECUTIVE' || user?.role === 'IT_ADMIN' || !user;

  // Master Google Drive Folder URL for Yayasan Rumah Etnik Papua
  const masterGoogleDriveFolderUrl = 'https://drive.google.com/drive/folders/1REP_Yayasan_Rumah_Etnik_Papua_Master_Archive_2026?usp=sharing';

  const currentDocs = docs.length > 0 ? docs : getDocuments();

  const filteredDocs = currentDocs.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'ALL' || d.category === selectedCategory;

    const matchesFileType =
      selectedFileType === 'ALL' || d.fileType === selectedFileType;

    return matchesSearch && matchesCategory && matchesFileType;
  });

  // Category counts
  const countSopOps = currentDocs.filter((d) => d.category === 'SOP_OPERASIONAL').length;
  const countSopFin = currentDocs.filter((d) => d.category === 'SOP_KEUANGAN').length;
  const countTemplates = currentDocs.filter((d) => d.category === 'TEMPLATE_SURAT').length;
  const countLegal = currentDocs.filter((d) => d.category === 'LEGALITAS_YAYASAN').length;

  const handleSaveDoc = (
    docData: Omit<FoundationDocument, 'id' | 'lastUpdated'>,
    docId?: string
  ) => {
    const authorName = user?.displayName || 'Admin Yayasan REP';
    if (docId) {
      updateDocument(docId, docData, authorName);
    } else {
      addDocument(docData, authorName);
      if (typeof window !== 'undefined') {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#34a853', '#4285f4', '#e5a93c', '#10b981'],
        });
      }
    }
  };

  const handleDeleteDoc = (id: string) => {
    const authorName = user?.displayName || 'Admin Yayasan REP';
    deleteDocument(id, authorName);
  };

  const handleOpenEdit = (doc: FoundationDocument) => {
    setSelectedDocForDetail(null);
    setEditingDoc(doc);
    setCreateModalOpen(true);
  };

  const handleDirectOpenDrive = (e: React.MouseEvent, doc: FoundationDocument) => {
    e.stopPropagation();
    incrementDocDownload(doc.id);
    if (typeof window !== 'undefined') {
      window.open(doc.gdriveUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-[#f6f4ee] dark:bg-[#07130f] text-stone-900 dark:text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar onOpenPwaModal={() => setPwaModalOpen(true)} hideHeaderOnHome={false} />

      {/* Botanical Dark Forest Green Header with Cloud Storage Motif */}
      <div className="relative w-full bg-gradient-to-b from-[#113527] via-[#103325] to-[#0d2a1f] text-white pt-8 pb-12 px-4 sm:px-6 lg:px-8 border-b border-emerald-500/20 shadow-xl overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <PapuanBorderCorner position="top-right" />
        <PapuanBorderCorner position="bottom-left" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold tracking-wide">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              <span>ARSIP RESMI GOOGLE DRIVE & SOP TERPADU</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-serif text-white tracking-tight leading-tight">
              Pusat Dokumen & SOP Yayasan
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Repositori digital Standar Operasional Prosedur (SOP), formulir dinas, template surat keputusan, dan legalitas resmi Yayasan Rumah Etnik Papua yang tersinkronisasi dengan Google Drive Cloud Storage.
            </p>
          </div>

          {/* Action Header: Google Drive Root & Add Button */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <a
              href={masterGoogleDriveFolderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#091f17] hover:bg-[#0e2c20] border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-extrabold transition-all shadow-md active:scale-95 cursor-pointer"
              title="Buka Folder Induk Google Drive Yayasan"
            >
              <FolderOpen className="w-4 h-4 text-emerald-400" />
              <span>Google Drive Induk</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400/70" />
            </a>

            <button
              onClick={() => {
                setEditingDoc(null);
                setCreateModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-extrabold transition-all shadow-lg shadow-emerald-950/60 active:scale-95 cursor-pointer border border-emerald-400/40"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              <span>Tambah Dokumen / SOP</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="max-w-7xl mx-auto mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
          <div className="p-3 rounded-2xl bg-[#0a241b]/80 border border-emerald-500/20 backdrop-blur-sm">
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">🏡 SOP Homestay & Tamu</p>
            <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{countSopOps} <span className="text-xs font-normal text-slate-300">Dokumen</span></p>
          </div>
          <div className="p-3 rounded-2xl bg-[#0a241b]/80 border border-amber-500/20 backdrop-blur-sm">
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">💰 SOP Keuangan SIK</p>
            <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{countSopFin} <span className="text-xs font-normal text-slate-300">Dokumen</span></p>
          </div>
          <div className="p-3 rounded-2xl bg-[#0a241b]/80 border border-indigo-500/20 backdrop-blur-sm">
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">📝 Template & Formulir</p>
            <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{countTemplates} <span className="text-xs font-normal text-slate-300">Berkas</span></p>
          </div>
          <div className="p-3 rounded-2xl bg-[#0a241b]/80 border border-rose-500/20 backdrop-blur-sm">
            <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">⚖️ Legalitas & SK</p>
            <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{countLegal} <span className="text-xs font-normal text-slate-300">Arsip</span></p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 mb-safe-bottom">
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          {/* Search Input */}
          <div className="relative w-full md:w-88">
            <Search className="w-4 h-4 text-emerald-500/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari SOP, kode dokumen, formulir, atau divisi..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-[#0c261e] border border-emerald-500/20 dark:border-emerald-500/30 text-xs sm:text-sm text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-sm"
            />
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 custom-scrollbar">
            {[
              { id: 'ALL', label: 'Semua' },
              { id: 'SOP_OPERASIONAL', label: '🏡 Operasional' },
              { id: 'SOP_KEUANGAN', label: '💰 Keuangan' },
              { id: 'SOP_GUDANG_KASIR', label: '🛍️ Kasir & Stok' },
              { id: 'SOP_MEDIA_KREATIF', label: '📸 Media' },
              { id: 'TEMPLATE_SURAT', label: '📝 Formulir' },
              { id: 'LEGALITAS_YAYASAN', label: '⚖️ Legalitas' },
              { id: 'PANDUAN_IT', label: '💻 IT' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                    : 'bg-stone-200 dark:bg-[#0c261e] text-stone-600 dark:text-slate-300 hover:bg-emerald-500/10'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* File Format Filter */}
          <div className="flex items-center gap-1 shrink-0 bg-stone-200 dark:bg-[#0c261e] p-1 rounded-2xl border border-emerald-500/20">
            {['ALL', 'PDF', 'DOCX', 'XLSX'].map((fmt) => (
              <button
                key={fmt}
                onClick={() => setSelectedFileType(fmt)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                  selectedFileType === fmt
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-600 dark:text-slate-400 hover:text-white'
                }`}
              >
                {fmt === 'ALL' ? 'Semua Format' : fmt}
              </button>
            ))}
          </div>
        </div>

        {/* Documents Cards Grid */}
        {filteredDocs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map((doc) => {
              const categoryInfo = getDocCategoryInfo(doc.category);
              const fileBadge = getDocFileBadge(doc.fileType);

              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDocForDetail(doc)}
                  className="p-5 rounded-3xl bg-white dark:bg-[#091f17] border-2 border-emerald-500/25 hover:border-emerald-400/60 shadow-lg hover:shadow-2xl transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden"
                >
                  <PapuanBorderCorner position="top-right" />

                  <div className="space-y-2.5">
                    {/* Badges: Code, Category, FileType & Confidential */}
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-[#06140e] text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                        {doc.code}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${fileBadge.bg}`}>
                          {fileBadge.label}
                        </span>
                        {doc.isConfidential && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/40">
                            RAHASIA
                          </span>
                        )}
                        {doc.isFavorite && (
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-black text-stone-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors leading-snug font-serif">
                      {doc.title}
                    </h3>

                    {/* Category Label */}
                    <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      {categoryInfo.label} • <span className="text-stone-500 dark:text-slate-400 font-normal">{doc.department}</span>
                    </p>

                    {/* Description Snippet */}
                    <p className="text-xs text-stone-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {doc.description}
                    </p>
                  </div>

                  {/* Footer metadata & Action Buttons */}
                  <div className="mt-5 pt-3.5 border-t border-stone-200 dark:border-emerald-500/20 flex items-center justify-between gap-2">
                    <div className="text-[10px] text-stone-500 dark:text-slate-400 leading-tight">
                      <p className="font-semibold text-stone-700 dark:text-slate-300">{doc.version} • {doc.fileSize}</p>
                      <p className="text-[9px] text-slate-500">Diunduh {doc.downloadsCount || 0}x</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleDirectOpenDrive(e, doc)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                        title="Buka File di Google Drive"
                      >
                        <HardDrive className="w-3.5 h-3.5 text-white" />
                        <span>G-Drive</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDocForDetail(doc);
                        }}
                        className="p-1.5 rounded-xl bg-stone-100 dark:bg-[#0c281e] hover:bg-emerald-500/20 text-stone-600 dark:text-slate-300 hover:text-white border border-emerald-500/20 transition-all"
                        title="Pratinjau & Rincian"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#091f17] border-2 border-dashed border-emerald-500/30 text-stone-500 dark:text-slate-400 space-y-3">
            <FileText className="w-12 h-12 text-emerald-500/40 mx-auto" />
            <p className="text-base font-bold text-stone-800 dark:text-slate-200">
              Tidak ada dokumen atau SOP yang sesuai dengan pencarian Anda.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedFileType('ALL');
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all"
            >
              Reset Semua Filter
            </button>
          </div>
        )}
      </main>

      {/* Modal Detail & Pratinjau Dokumen */}
      <DocumentDetailModal
        doc={selectedDocForDetail}
        onClose={() => setSelectedDocForDetail(null)}
        onEdit={handleOpenEdit}
        onDelete={handleDeleteDoc}
        canManage={canManage}
      />

      {/* Modal Tambah / Ubah Dokumen */}
      <CreateDocumentModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setEditingDoc(null);
        }}
        onSave={handleSaveDoc}
        initialData={editingDoc}
        currentUserDisplayName={user?.displayName || 'Admin Yayasan REP'}
      />

      {/* PWA Modal & Banner */}
      <PWAInstallModal isOpen={pwaModalOpen} onClose={() => setPwaModalOpen(false)} />
      <PWAInstallBanner onOpenModal={() => setPwaModalOpen(true)} />
    </div>
  );
}
