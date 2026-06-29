// 크롤러 진입점 — 협회별 실제 구조에 맞춰 수집/저장.
//
// - KLIA(생보): 향후 N개월의 HTML 테이블 일정을 구조화 수집 → exam_schedules upsert.
// - KNIA(손보): 최신 분기 게시글의 일정 이미지(base64) 메타 수집 → exam_schedule_images upsert.
//               (행 데이터는 이미지 OCR 단계에서 추출 — 아래 note 참고)
import { crawlKlia } from './klia';
import { crawlKniaLatest } from './knia';
import { crawlVrbIbt } from './vrbibt';
import { upsertSchedules, upsertScheduleImage } from './upsert';
import { sleep } from './fetchHtml';
import type { CrawlResult, ExamScheduleRecord } from './types';

export async function runAllCrawlers(monthsAhead = 3): Promise<CrawlResult[]> {
  const now = new Date();
  const targets = upcomingMonths(now.getFullYear(), now.getMonth() + 1, monthsAhead);
  const results: CrawlResult[] = [];

  // 1) KLIA 생보 — 구조화 일정
  try {
    const collected: ExamScheduleRecord[] = [];
    for (const t of targets) {
      collected.push(...(await crawlKlia(t.year, t.month)));
      await sleep();
    }
    const count = await upsertSchedules(dedupeSchedules(collected));
    results.push({ source: 'klia', ok: true, count, note: '생보 설계사(서울) 일정' });
  } catch (e) {
    results.push({ source: 'klia', ok: false, count: 0, error: msg(e) });
  }

  // 2) 변액 IBT — 구조화 일정 (변액 전용 경로)
  try {
    const count = await upsertSchedules(dedupeSchedules(await crawlVrbIbt(now.getFullYear())));
    results.push({ source: 'vrb-ibt', ok: true, count, note: '변액보험 IBT 일정' });
    await sleep();
  } catch (e) {
    results.push({ source: 'vrb-ibt', ok: false, count: 0, error: msg(e) });
  }

  // 3) KNIA 손보 — 일정 이미지(OCR 대상)
  try {
    const post = await crawlKniaLatest();
    if (post) {
      const count = await upsertScheduleImage(post);
      results.push({
        source: 'knia',
        ok: true,
        count,
        note: '손보 일정은 이미지로 게시됨 → 행 추출은 OCR 필요',
      });
    } else {
      results.push({ source: 'knia', ok: true, count: 0, note: '최신 일정 게시글을 찾지 못함' });
    }
  } catch (e) {
    results.push({ source: 'knia', ok: false, count: 0, error: msg(e) });
  }

  return results;
}

function upcomingMonths(year: number, month: number, count: number): { year: number; month: number }[] {
  const out: { year: number; month: number }[] = [];
  for (let i = 0; i < count; i++) {
    const m0 = month - 1 + i;
    out.push({ year: year + Math.floor(m0 / 12), month: (m0 % 12) + 1 });
  }
  return out;
}

function dedupeSchedules(records: ExamScheduleRecord[]): ExamScheduleRecord[] {
  const seen = new Set<string>();
  return records.filter((r) => {
    const key = `${r.type}|${r.round}|${r.exam_date}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function msg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
