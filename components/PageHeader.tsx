import React from 'react';

/** Judul halaman sederhana yang seragam di semua halaman. */
export default function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 pt-5 pb-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-stone-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
