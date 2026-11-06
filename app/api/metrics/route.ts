import { NextResponse } from 'next/server';
import { requireStaff, errorResponse } from '@/lib/server/auth';
import { adminDb } from '@/lib/server/firebase-admin';
import { fetchSectionSummary } from '@/lib/server/integrations';
import { LiveMetricsResponse, METRICS_PERIODS } from '@/lib/integration-contract';
import type { MetricsPeriod } from '@/lib/types';

// Admin SDK membutuhkan runtime Node.js.
export const runtime = 'nodejs';

/**
 * GET /api/metrics?period=TODAY|THIS_WEEK|THIS_MONTH
 * Hanya untuk pimpinan & IT. Mengumpulkan ringkasan dari keempat sub-aplikasi secara paralel,
 * ditambah statistik operasional portal yang dihitung langsung dari Firestore.
 */
export async function GET(req: Request) {
  try {
    await requireStaff(req, ['IT_ADMIN', 'EXECUTIVE']);

    const requested = new URL(req.url).searchParams.get('period') as MetricsPeriod | null;
    const period: MetricsPeriod = requested && METRICS_PERIODS.includes(requested) ? requested : 'TODAY';

    const db = adminDb();
    const [reservasi, keuangan, posGudang, zeeyStudio, staffCount, pendingCount, noticeCount] = await Promise.all([
      fetchSectionSummary('reservasi', period),
      fetchSectionSummary('keuangan', period),
      fetchSectionSummary('posGudang', period),
      fetchSectionSummary('zeeyStudio', period),
      db.collection('whitelist').where('active', '==', true).count().get(),
      db.collection('accessRequests').where('status', '==', 'PENDING').count().get(),
      db.collection('notices').count().get(),
    ]);

    const sections = { reservasi, keuangan, posGudang, zeeyStudio };
    const configured = Object.values(sections).filter((s) => s.status !== 'NOT_CONFIGURED');
    const live = configured.filter((s) => s.status === 'LIVE');

    const body: LiveMetricsResponse = {
      period,
      generatedAt: new Date().toISOString(),
      sections,
      operasional: {
        activeStaffOnDuty: staffCount.data().count,
        pendingAccessRequests: pendingCount.data().count,
        activeNoticesCount: noticeCount.data().count,
        // Persentase sub-aplikasi terkonfigurasi yang berhasil dihubungi.
        systemHealthScore: configured.length ? Math.round((live.length / configured.length) * 1000) / 10 : 0,
      },
    };

    return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return errorResponse(err);
  }
}
