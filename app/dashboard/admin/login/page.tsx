import { redirect } from 'next/navigation';

/**
 * Alamat lama halaman login. Login kini berlaku untuk seluruh staf (bukan hanya admin),
 * sehingga alamat resminya adalah `/masuk`. Tautan & bookmark lama tetap bekerja lewat redirect ini.
 */
export default async function LegacyAdminLoginRedirect({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  const target = Array.isArray(next) ? next[0] : next;
  redirect(target ? `/masuk?next=${encodeURIComponent(target)}` : '/masuk');
}
