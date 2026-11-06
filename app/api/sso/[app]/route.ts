import { NextResponse } from 'next/server';
import { requireStaff, errorResponse } from '@/lib/server/auth';
import { adminDb } from '@/lib/server/firebase-admin';
import { getIntegration } from '@/lib/server/integrations';
import { SOURCE_KEYS, SOURCE_LABELS, SourceKey } from '@/lib/integration-contract';

export const runtime = 'nodejs';

/**
 * POST /api/sso/{reservasi|keuangan|posGudang|zeeyStudio}
 * Staf yang sudah login di portal meminta tiket masuk otomatis ke sub-aplikasi.
 * Portal hanya menjamin IDENTITAS (email terverifikasi & aktif di whitelist); hak akses di
 * sub-aplikasi tetap ditentukan oleh role akun di sub-aplikasi itu sendiri.
 */
export async function POST(req: Request, ctx: { params: Promise<{ app: string }> }) {
  try {
    const staff = await requireStaff(req);
    const { app } = await ctx.params;

    if (!SOURCE_KEYS.includes(app as SourceKey)) {
      return NextResponse.json({ error: 'Aplikasi tidak dikenal.', code: 'UNKNOWN_APP' }, { status: 404 });
    }
    const key = app as SourceKey;
    const config = getIntegration(key);
    if (!config) {
      return NextResponse.json(
        { error: 'Masuk otomatis belum disiapkan untuk aplikasi ini.', code: 'NOT_CONFIGURED' },
        { status: 404 }
      );
    }

    let res: Response;
    try {
      res = await fetch(`${config.baseUrl}/api/portal/sso/ticket`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${config.secret}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: staff.email, name: staff.name, portalRole: staff.role }),
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      return NextResponse.json({ error: 'Aplikasi tidak dapat dihubungi.', code: 'UPSTREAM_DOWN' }, { status: 502 });
    }

    const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string; code?: string };
    if (!res.ok) {
      return NextResponse.json(
        { error: body.error || `Aplikasi menolak permintaan (HTTP ${res.status}).`, code: body.code || 'UPSTREAM_ERROR' },
        { status: res.status === 404 || res.status === 403 ? res.status : 502 }
      );
    }

    // Jangan pernah mengarahkan pengguna ke luar domain sub-aplikasi yang dikonfigurasi.
    if (!body.url || !body.url.startsWith(`${config.baseUrl}/`)) {
      return NextResponse.json({ error: 'Respons aplikasi tidak valid.', code: 'UPSTREAM_ERROR' }, { status: 502 });
    }

    await adminDb()
      .collection('auditLogs')
      .add({
        userEmail: staff.email,
        userName: staff.name,
        actorEmail: staff.email,
        action: 'SSO_LAUNCH',
        details: `Masuk otomatis ke ${SOURCE_LABELS[key]}`,
        category: 'AUTH',
        timestamp: new Date().toISOString(),
      })
      .catch((err) => console.warn('Audit SSO gagal dicatat:', err));

    return NextResponse.json({ url: body.url }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return errorResponse(err);
  }
}
