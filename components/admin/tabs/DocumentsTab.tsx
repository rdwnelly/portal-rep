'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { addDocument, updateDocument, deleteDocument } from '@/lib/storage';
import { FoundationDocument } from '@/lib/types';
import CreateDocumentModal from '@/components/CreateDocumentModal';
import DocumentDetailModal, { getDocCategoryInfo, getDocFileBadge } from '@/components/DocumentDetailModal';
import { Trash2, Edit2, Plus, ExternalLink, FileText } from 'lucide-react';

/** Kelola dokumen & SOP (Google Drive). */
export default function DocumentsTab({ documents, currentAdminName }: { documents: FoundationDocument[]; currentAdminName: string }) {
  // Form States: Kelola Dokumen
  const [showDocModal, setShowDocModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<FoundationDocument | null>(null);
  const [selectedDocForDetail, setSelectedDocForDetail] = useState<FoundationDocument | null>(null);

  // ================= DOCUMENTS HANDLERS =================
  const handleOpenNewDoc = () => {
    setEditingDoc(null);
    setShowDocModal(true);
  };

  const handleOpenEditDoc = (doc: FoundationDocument) => {
    setEditingDoc(doc);
    setShowDocModal(true);
  };

  const handleSaveDoc = (
    docData: Omit<FoundationDocument, 'id' | 'lastUpdated'>,
    docId?: string
  ) => {
    if (docId) {
      updateDocument(docId, docData, currentAdminName);
    } else {
      addDocument(docData, currentAdminName);
    }
    setShowDocModal(false);
  };

  const handleDeleteDoc = (id: string, title: string) => {
    if (confirm(`Hapus dokumen "${title}"?`)) {
      deleteDocument(id, currentAdminName);
    }
  };

  return (
    <>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <span>Kelola Dokumen, SOP & Arsip Google Drive</span>
              </h2>
              <p className="text-xs text-slate-400">
                Unggah SOP resmi, tautkan file Google Drive, perbarui versi dokumen, dan kelola arsip formulir yayasan.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/dokumen"
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#091e16] hover:bg-[#0e2c20] border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Lihat Vault Publik</span>
              </Link>
              <button
                onClick={handleOpenNewDoc}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-950/60 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Dokumen Baru</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc) => {
              const categoryInfo = getDocCategoryInfo(doc.category);
              const fileBadge = getDocFileBadge(doc.fileType);

              return (
                <div
                  key={doc.id}
                  className="p-5 rounded-2xl glass-panel bg-[#091b14] border border-emerald-500/25 shadow-xl flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                          {doc.code}
                        </span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${categoryInfo.bgColor}`}>
                          {categoryInfo.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${fileBadge.bg}`}>
                          {fileBadge.label}
                        </span>
                        {doc.isConfidential && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/40">
                            RAHASIA
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="text-base font-extrabold text-white leading-snug">{doc.title}</h3>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-2">{doc.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-400">Oleh: {doc.uploadedBy}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedDocForDetail(doc)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all"
                      >
                        Detail & G-Drive
                      </button>
                      <button
                        onClick={() => handleOpenEditDoc(doc)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-950/60 border border-slate-700 text-emerald-300 transition-all"
                        title="Edit Dokumen"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDoc(doc.id, doc.title)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/60 border border-slate-700 text-red-400 transition-all"
                        title="Hapus Dokumen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Dokumen CRUD */}
        <CreateDocumentModal
          isOpen={showDocModal}
          onClose={() => {
            setShowDocModal(false);
            setEditingDoc(null);
          }}
          onSave={handleSaveDoc}
          initialData={editingDoc}
          currentUserDisplayName={currentAdminName}
        />

        <DocumentDetailModal
          doc={selectedDocForDetail}
          onClose={() => setSelectedDocForDetail(null)}
          onEdit={(doc) => {
            setSelectedDocForDetail(null);
            handleOpenEditDoc(doc);
          }}
          onDelete={(id) => {
            deleteDocument(id, currentAdminName);
          }}
          canManage={true}
        />

    </>
  );
}
