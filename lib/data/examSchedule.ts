// 손해보험설계사 자격시험 일정 (2026년 2분기 하드코딩 fallback)
// 추후 Supabase exam_schedules 테이블 + 크롤러(SKILL-crawling)로 대체 예정.

export type ScheduleRow = {
  round: string;
  date: string;
  regions: string;
  insurers: string;
};

export type MonthSchedule = {
  key: string;
  label: string;
  rows: ScheduleRow[];
};

// 생명보험설계사(KLIA) 일정 행 — 크롤러가 수집하는 컬럼 구조.
export type LifeScheduleRow = {
  date: string; // '6/9(화)'
  applyPeriod: string; // 응시신청기간
  resultDate: string; // 합격자발표일
};

// 변액보험 판매관리사 IBT 일정 행 — 변액 IBT 크롤러가 수집하는 컬럼 구조.
//   출처: 생명보험협회 자격시험센터 변액 IBT (exam.insure.or.kr/vrb/cbt/schd/list)
export type VariableScheduleRow = {
  date: string; // '6/24(수)'
  applyPeriod: string; // 응시신청기간
  resultDate: string; // 합격자발표일
};

export const lossSchedule: MonthSchedule[] = [
  {
    key: 'april',
    label: '4월',
    rows: [
      { round: '1차', date: '4/7(화)', regions: '서울·대전·광주·부산·인천·대구', insurers: '전 보험사' },
      { round: '2차', date: '4/8(수)', regions: '서울·대전·광주·전주', insurers: '전 보험사' },
      { round: '3차', date: '4/9(목)', regions: '서울·대전·광주·부산·강릉', insurers: '전 보험사' },
      { round: '4차', date: '4/13(월)', regions: '서울·수원·대전·광주·대구·부산', insurers: '전 보험사(메리츠·삼성·DB 제외)' },
      { round: '5차', date: '4/14(화)', regions: '서울·대전·광주·부산', insurers: '삼성' },
      { round: '6차', date: '4/15(수)', regions: '서울·대전·광주·부산', insurers: '전 보험사(메리츠·삼성·DB 제외)' },
      { round: '7차', date: '4/16(목)', regions: '서울·대전·광주·부산', insurers: 'DB' },
      { round: '8차', date: '4/17(금)', regions: '서울·대전·광주·부산', insurers: '전 보험사(메리츠·삼성·DB 제외)' },
      { round: '9차', date: '4/20(월)', regions: '서울·대전·부산', insurers: '메리츠' },
      { round: '10차', date: '4/21(화)', regions: '서울·수원·대전·광주·부산', insurers: '전 보험사(메리츠·삼성·DB 제외)' },
      { round: '11차', date: '4/22(수)', regions: '서울·대전·광주·대구·부산', insurers: '전 보험사(메리츠·삼성·DB 제외)' },
      { round: '12차', date: '4/23(목)', regions: '서울·일산·대전·광주·부산·포항', insurers: '전 보험사(메리츠·삼성·DB 제외)' },
      { round: '13차', date: '4/24(금)', regions: '서울·대구·부산', insurers: 'DB' },
      { round: '14차', date: '4/27(월)', regions: '서울·수원·대전·광주·대구·부산·제주', insurers: '현대 및 전 보험사(제주)' },
      { round: '15차', date: '4/28(화)', regions: '서울·대구·부산', insurers: '삼성' },
    ],
  },
  {
    key: 'may',
    label: '5월',
    rows: [
      { round: '1차', date: '5/6(수)', regions: '서울·대전·광주·부산·인천·대구', insurers: '전 보험사' },
      { round: '2차', date: '5/7(목)', regions: '서울·대전·광주·전주', insurers: '전 보험사' },
      { round: '3차', date: '5/8(금)', regions: '서울·대전·광주·부산·강릉', insurers: 'GA' },
      { round: '4차', date: '5/12(화)', regions: '서울·수원·대전·광주·대구·부산', insurers: '전 보험사(메리츠·삼성·DB 제외)' },
      { round: '5차', date: '5/13(수)', regions: '서울·대전·광주·부산', insurers: '삼성' },
      { round: '6차', date: '5/14(목)', regions: '서울·대전·광주·부산', insurers: '전 보험사(메리츠·삼성·DB 제외)' },
      { round: '7차', date: '5/15(금)', regions: '서울·대전·광주·부산', insurers: 'DB' },
      { round: '8차', date: '5/18(월)', regions: '서울·대전·광주·부산', insurers: '전 보험사(메리츠·삼성·DB 제외)' },
      { round: '9차', date: '5/19(화)', regions: '서울·대전·부산', insurers: '메리츠' },
      { round: '10차', date: '5/20(수)', regions: '서울·수원·대전·광주·부산', insurers: '전 보험사(메리츠·삼성·DB 제외)' },
      { round: '11차', date: '5/21(목)', regions: '서울·대전·광주·대구·부산', insurers: '전 보험사(메리츠·삼성·DB 제외)' },
      { round: '12차', date: '5/22(금)', regions: '서울·일산·대전·광주·부산·포항', insurers: '전 보험사(메리츠·삼성·DB 제외)' },
      { round: '13차', date: '5/26(화)', regions: '서울·대구·부산', insurers: 'DB' },
      { round: '14차', date: '5/27(수)', regions: '서울·수원·대전·광주·부산·제주', insurers: '현대 및 전 보험사(제주)' },
      { round: '15차', date: '5/28(목)', regions: '서울·대구·부산', insurers: '삼성' },
    ],
  },
  {
    key: 'june',
    label: '6월',
    rows: [
      { round: '1차', date: '6/4(목)', regions: '서울·대전·광주·부산·인천·대구', insurers: '전 보험사' },
      { round: '2차', date: '6/5(금)', regions: '서울·대전·광주·전주', insurers: '전 보험사' },
      { round: '3차', date: '6/8(월)', regions: '서울·대전·부산·강릉', insurers: 'GA' },
      { round: '4차', date: '6/10(수)', regions: '서울·수원·대전·광주·대구·부산', insurers: '전 보험사(메리츠·삼성·DB 제외)' },
      { round: '5차', date: '6/11(목)', regions: '서울·대전·광주·부산', insurers: '전 보험사(메리츠·삼성·DB 제외)' },
      { round: '6차', date: '6/12(금)', regions: '서울·대전·광주·부산', insurers: '전 보험사(메리츠·삼성·DB 제외)' },
      { round: '7차', date: '6/15(월)', regions: '서울·대전·광주·부산', insurers: 'DB' },
      { round: '8차', date: '6/17(수)', regions: '서울·대전·광주·부산', insurers: '전 보험사(메리츠·삼성·DB 제외)' },
      { round: '9차', date: '6/18(목)', regions: '서울·대전·부산', insurers: '메리츠' },
      { round: '10차', date: '6/19(금)', regions: '서울·수원·대전·광주·부산', insurers: '전 보험사(메리츠·삼성·DB 제외)' },
      { round: '11차', date: '6/23(화)', regions: '서울·대전·광주·대구·부산', insurers: '전 보험사(메리츠·삼성·DB 제외)' },
      { round: '12차', date: '6/24(수)', regions: '서울·일산·대전·광주·부산·포항', insurers: '전 보험사(메리츠·삼성·DB 제외)' },
      { round: '13차', date: '6/25(목)', regions: '서울·대구·부산', insurers: 'DB' },
      { round: '14차', date: '6/26(금)', regions: '서울·수원·대전·광주·부산·제주', insurers: '현대 및 전 보험사(제주)' },
      { round: '15차', date: '6/28(일)', regions: '서울·대구·부산', insurers: '삼성' },
    ],
  },
];
