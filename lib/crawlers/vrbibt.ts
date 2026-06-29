// 변액보험 판매관리사 IBT 일정 크롤러 — 생명보험협회 자격시험센터.
//
// 페이지: https://exam.insure.or.kr/vrb/cbt/schd/list  (변액 IBT 전용 경로)
// 구조(2026-06 확인): 기본 GET 시 현재 시행 회차의 HTML 표를 노출. data-label 없음, 위치 기반 td.
//   컬럼: 시험일 / 구분 / 응시신청기간 / 취소마감일 / 추가접수기간 / 합격자 발표일
//   ★ 시험일·합격자발표일 셀은 rowspan=2 — 한 시험일이 [단체신청][개인신청] 두 tr을 공유한다.
//     · 1행(p.tit 있음, td 6개): [시험일, 구분, 응시신청기간, 취소마감일, 추가접수기간, 발표일]
//     · 2행(p.tit 없음, td 4개): [구분, 응시신청기간, 취소마감일, 추가접수기간]
//   - 월/지역 전환은 POST 폼이지만, 기본 GET이 "현재·예정" 회차를 보여주므로 GET으로 충분.
//   - 지역별 정원(명/차수)·응시수수료는 이 표에 없음(공고 별도) → 수집 대상에서 제외.
import * as cheerio from 'cheerio';
import { fetchHtml, parseAnyDate } from './fetchHtml';
import type { ExamScheduleRecord } from './types';

const VRB_IBT_URL = 'https://exam.insure.or.kr/vrb/cbt/schd/list';

/** 변액 IBT 현재·예정 일정을 수집. */
export async function crawlVrbIbt(fallbackYear: number): Promise<ExamScheduleRecord[]> {
  try {
    const html = await fetchHtml(VRB_IBT_URL);
    return parseVrbIbtSchedule(html, fallbackYear, VRB_IBT_URL);
  } catch {
    return []; // 실패 시 빈 배열 — 기존 DB 보존
  }
}

export function parseVrbIbtSchedule(
  html: string,
  fallbackYear: number,
  sourceUrl: string,
): ExamScheduleRecord[] {
  const $ = cheerio.load(html);
  const records: ExamScheduleRecord[] = [];

  // rowspan 페어링: 1행(시험일 보유) 기준으로 record 생성, 2행(개인신청)에서 개인신청 기간만 보강.
  let pending: ExamScheduleRecord | null = null;
  const flush = () => {
    if (pending) records.push(pending);
    pending = null;
  };

  $('table tbody tr').each((_, tr) => {
    const $tr = $(tr);
    const tds = $tr.find('td');
    if (tds.length === 0) return;
    const txt = (i: number) => $(tds[i]).text().replace(/\s+/g, ' ').trim();
    const titEl = $tr.find('td p.tit').first();

    if (titEl.length > 0) {
      // 1행(단체신청): [시험일, 구분, 응시신청기간, 취소마감, 추가접수, 발표일]
      flush();
      const parsed = parseAnyDate(titEl.text().replace(/\s+/g, ' ').trim(), fallbackYear);
      if (!parsed) return;
      pending = {
        type: 'variable',
        round: '', // 회차 개념 대신 시험일로 식별
        exam_date: parsed.iso,
        regions: ['서울'], // 전 지역 시행, 표는 서울 기준
        insurers: '전 보험사',
        apply_period: txt(2) || null, // 우선 단체신청 기간
        result_date: txt(tds.length - 1) || null, // 마지막 셀 = 합격자발표일
        year: parsed.year,
        month: parsed.month,
        source_url: sourceUrl,
      };
    } else if (pending) {
      // 2행(개인신청 등): [구분, 응시신청기간, 취소마감, 추가접수] — 개인신청이면 그 기간을 우선 채택
      if (txt(0).includes('개인') && txt(1)) pending.apply_period = txt(1);
    }
  });
  flush();

  // 같은 시험일 중복 제거
  const seen = new Set<string>();
  return records.filter((r) => {
    if (seen.has(r.exam_date)) return false;
    seen.add(r.exam_date);
    return true;
  });
}
