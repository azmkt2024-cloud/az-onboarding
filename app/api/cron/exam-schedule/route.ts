// Vercel Cron 엔드포인트 — 주 1회 시험 일정 크롤링 실행.
// vercel.json의 crons 설정에서 호출됩니다.
import { runAllCrawlers } from '@/lib/crawlers';

// 크롤링은 네트워크 I/O가 길 수 있어 동적 실행 + 최대 실행시간 확보
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: Request) {
  // Vercel Cron 인증 헤더 검증 (CRON_SECRET 미설정 시 보호 없음 경고)
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const results = await runAllCrawlers();
    const total = results.reduce((sum, r) => sum + r.count, 0);
    return Response.json({ ok: true, total, results, ranAt: new Date().toISOString() });
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
