// Vercel Cron 엔드포인트 — 월 1회 보험금청구서 PDF 동기화.
// vercel.json의 crons에서 호출. 수동 검증 시: Authorization: Bearer <CRON_SECRET> 로 GET.
import { syncClaimForms } from '@/lib/claimForms/sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  try {
    const ranAt = new Date().toISOString();
    const out = await syncClaimForms(ranAt);
    return Response.json({ ok: true, ...out, ranAt });
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
