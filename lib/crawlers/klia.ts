// 생명보험협회(KLIA) 시험 일정 크롤러 — 실제 페이지에 맞춰 튜닝됨.
//
// 페이지: https://exam.insure.or.kr/lp/schd/list  (보험설계사 PBT, examDivCd=6)
// 구조(검증 완료): #req-form 이 POST로 월/지역을 전환.
//   - searchDate: 'YYYY-M-1'  (해당 월)
//   - pageType / pageTypeNm: 지역 코드/이름 (서울=10)
//   - examDivCd: 시험 구분 (보험설계사=6)
// 결과 테이블: .table_t01 table tbody tr
//   - 시험일:        td p.tit         (예: '2026-06-09(화)')
//   - 응시신청기간:  td[data-label="응시신청기간"]
//   - 합격자발표일:  td[data-label="합격자발표일"]
import * as cheerio from 'cheerio';
import { postForm, parseAnyDate } from './fetchHtml';
import type { ExamScheduleRecord } from './types';

const KLIA_LIST_URL = 'https://exam.insure.or.kr/lp/schd/list';
const EXAM_DIV_DESIGNER = '6'; // 보험설계사(PBT)
// 기본 지역(서울). 필요 시 지역 코드를 추가해 반복 수집할 수 있습니다.
const DEFAULT_REGION = { code: '10', name: '서울' };

/** 특정 연/월의 생보 설계사 시험 일정을 수집. */
export async function crawlKlia(year: number, month: number, region = DEFAULT_REGION): Promise<ExamScheduleRecord[]> {
  try {
    const html = await postForm(KLIA_LIST_URL, {
      searchDate: `${year}-${month}-1`,
      pageType: region.code,
      pageTypeNm: region.name,
      examDivCd: EXAM_DIV_DESIGNER,
    });
    return parseKliaSchedule(html, year, region.name, KLIA_LIST_URL);
  } catch {
    return []; // 실패 시 빈 배열 — 기존 DB 보존
  }
}

export function parseKliaSchedule(
  html: string,
  fallbackYear: number,
  regionName: string,
  sourceUrl: string
): ExamScheduleRecord[] {
  const $ = cheerio.load(html);
  const records: ExamScheduleRecord[] = [];

  $('.table_t01 table tbody tr, table tbody tr').each((_, tr) => {
    const examText = $(tr).find('td p.tit').text().replace(/\s+/g, ' ').trim();
    if (!examText) return;
    const parsed = parseAnyDate(examText, fallbackYear);
    if (!parsed) return;

    const applyPeriod = $(tr).find('td[data-label="응시신청기간"]').text().replace(/\s+/g, ' ').trim();
    const resultDate = $(tr).find('td[data-label="합격자발표일"]').text().replace(/\s+/g, ' ').trim();

    records.push({
      type: 'life',
      round: '', // KLIA 설계사 일정엔 차수 개념이 없음
      exam_date: parsed.iso,
      regions: [regionName],
      insurers: '전 보험사',
      apply_period: applyPeriod || null,
      result_date: resultDate || null,
      year: parsed.year,
      month: parsed.month,
      source_url: sourceUrl,
    });
  });

  // 같은 날짜 중복 제거(테이블 셀렉터가 중복 매칭될 가능성 방지)
  const seen = new Set<string>();
  return records.filter((r) => {
    const key = r.exam_date;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
