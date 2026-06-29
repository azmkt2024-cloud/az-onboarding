// 시험 일정 크롤러 공통 타입.
//
// 라이브 협회 페이지 조사 결과(2026-06 기준):
// - 생명보험협회(KLIA, exam.insure.or.kr): 시험일정이 정상 HTML 테이블 → 구조화 파싱 가능.
// - 손해보험협회(KNIA, misi.knia.or.kr): 분기별 일정이 게시판 글 안의 단일 base64 PNG 이미지
//   → HTML 텍스트로 행 데이터를 얻을 수 없음. 이미지/메타만 수집하고 행 추출은 OCR(비전) 단계 필요.

export type ExamType = 'loss' | 'life' | 'variable';

/** 구조화된 시험 일정 행 (주로 KLIA 생보에서 추출) — Supabase exam_schedules 매핑. */
export type ExamScheduleRecord = {
  type: ExamType;
  round: string; // KLIA엔 차수 개념이 없어 ''(빈값) 가능
  exam_date: string; // 'YYYY-MM-DD'
  regions: string[]; // 지역(탭) — KLIA는 단일 지역
  insurers: string; // '전 보험사' 등
  apply_period: string | null; // 응시신청기간 (KLIA)
  result_date: string | null; // 합격자발표일 (KLIA)
  year: number;
  month: number;
  source_url: string;
};

/** 게시판 글 안의 이미지로 게시되는 일정(주로 KNIA 손보) — exam_schedule_images 매핑. */
export type ScheduleImagePost = {
  type: ExamType; // 'loss'
  title: string; // '2026년 2분기(4월~6월) 설계사 자격시험 일정'
  posted_at: string | null; // 'YYYY-MM-DD'
  detail_url: string; // 원문 상세 URL
  /** base64 data URI (data:image/png;base64,...) — OCR 입력용. 매우 클 수 있음. */
  image_data_uri: string | null;
};

export type CrawlResult = {
  source: string;
  ok: boolean;
  count: number;
  note?: string;
  error?: string;
};
