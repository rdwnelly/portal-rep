'use client';

import React, { useState } from 'react';
import { ChevronRight, FileText, Lock, Plus, Search } from 'lucide-react';
import { useAuth, isManagerRole } from '@/lib/auth-context';
import { addDocument, deleteDocument, getDocuments, SSR_DOCUMENTS, updateDocument } from '@/lib/storage';
import { useStoreValue } from '@/lib/use-store';
import type { DocumentCategory, FoundationDocument } from '@/lib/types';
import Navbar from '@/components/Navbar';
import PageHeader from '@/components/PageHeader';
import DocumentDetailModal, { getDocCategoryInfo } from '@/components/DocumentDetailModal';
import CreateDocumentModal from '@/components/CreateDocumentModal';

const CATEGORIES: { id: 'ALL' | DocumentCategory; label: string }[] = [
  { id: 'ALL', label: 'Semua' },
  { id: 'SOP_OPERASIONAL', label: 'Operasional' },
  { id: 'SOP_KEUANGAN', label: 'Keuangan' },
  { id: 'SOP_GUDANG_KASIR', label: 'Kasir & Stok' },
  { id: 'TEMPLATE_SURAT', label: 'Formulir' },
  { id: 'SOP_MEDIA_KREATIF', label: 'Media' },
  { id: 'LEGALITAS_YAYASAN', label: 'Legalitas' },
  { id: 'PANDUAN_IT', label: 'Panduan IT' },
];

/** Dokumen & SOP yayasan: cari, pilih kategori, ketuk untuk membuka. */
export default function DocumentsPage() {
  const { user } = useAuth();
  const canManage = isManagerRole(user?.role);
  const docs = useStoreValue('documents', getDocuments, SSR_DOCUMENTS);

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'ALL' | DocumentCategory>('ALL');
  const [selected, setSelected] = useState<FoundationDocument | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FoundationDocument | null>(null);

  const q = query.trim().toLowerCase();
  const filtered = docs.filter(
    (d) =>
      (category === 'ALL' || d.category === category) &&
      (!q || [d.title, d.code, d.description, d.department, ...d.tags].some((v) => v?.toLowerCase().includes(q)))
  );
  const author = user?.displayName || 'Admin Yayasan REP';

  return (
    <div className="dock-safe min-h-screen bg-[#f6f4ee] dark:bg-[#07130f] text-stone-900 dark:text-slate-100">
      <Navbar />
      <main className="max-w-xl mx-auto px-4">
        <PageHeader
          title="Dokumen & SOP"
          subtitle="Panduan kerja, formulir, dan arsip resmi yayasan."
          action={
            canManage && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
                className="h-10 px-3 flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Tambah
              </button>
            )
          }
        />

        <label className="relative block">
          <span className="sr-only">Cari dokumen</span>
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari dokumen…"
            className="w-full h-12 pl-10 pr-4 rounded-2xl bg-white dark:bg-[#0c241b] border border-stone-200 dark:border-white/10 text-[15px] placeholder-stone-400 focus:outline-none focus:border-emerald-500"
          />
        </label>

        <div className="mt-3 -mx-4 px-4 flex gap-2 overflow-x-auto scrollbar-none">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              aria-pressed={category === c.id}
              className={`h-9 px-3.5 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer ${
                category === c.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-[#0c241b] border border-stone-200 dark:border-white/10 text-stone-600 dark:text-slate-300'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <ul className="mt-4 space-y-2.5">
          {filtered.map((doc) => (
            <li key={doc.id}>
              <button
                type="button"
                onClick={() => setSelected(doc)}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#0c241b] border border-stone-200 dark:border-white/10 text-left cursor-pointer"
              >
                <span className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="text-[15px] font-semibold leading-snug line-clamp-2">{doc.title}</span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-xs text-stone-500 dark:text-slate-400">
                    {doc.isConfidential && <Lock className="w-3.5 h-3.5 text-rose-500 shrink-0" aria-label="Rahasia" />}
                    <span className="truncate">
                      {getDocCategoryInfo(doc.category).label} · {doc.fileType}
                    </span>
                  </span>
                </span>
                <ChevronRight className="w-5 h-5 text-stone-400 shrink-0" />
              </button>
            </li>
          ))}
        </ul>

        {filtered.length === 0 && (
          <div className="mt-4 p-8 text-center rounded-2xl bg-white dark:bg-[#0c241b] border border-dashed border-stone-300 dark:border-white/15">
            <p className="text-sm text-stone-600 dark:text-slate-300">
              {docs.length === 0 ? 'Dokumen sedang dimuat…' : 'Tidak ada dokumen yang cocok.'}
            </p>
            {docs.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setCategory('ALL');
                }}
                className="mt-3 h-10 px-4 rounded-xl bg-emerald-600 text-white text-sm font-semibold cursor-pointer"
              >
                Tampilkan semua
              </button>
            )}
          </div>
        )}
      </main>

      <DocumentDetailModal
        doc={selected}
        onClose={() => setSelected(null)}
        onEdit={(doc) => {
          setSelected(null);
          setEditing(doc);
          setFormOpen(true);
        }}
        onDelete={(id) => deleteDocument(id, author)}
        canManage={canManage}
      />
      <CreateDocumentModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={(data, id) => (id ? updateDocument(id, data, author) : addDocument(data, author))}
        initialData={editing}
        currentUserDisplayName={author}
      />
    </div>
  );
}
