// 자격시험 과목별 핵심 요약 — 과목별 요약집(정적 HTML) 메타데이터
// 실제 콘텐츠는 public/summaries/*.html (앱과 동일한 디자인 토큰을 쓰는 완성형 학습 가이드).
// 각 과목 카드 클릭 → SummaryOverlay가 해당 HTML을 전체화면 iframe으로 띄웁니다.

export type SummaryType = 'fire' | 'life' | 'variable';

export type SummaryGuide = {
  type: SummaryType;
  icon: string;
  title: string; // 카드/헤더 제목
  badge: string; // 우측 칩
  sub: string; // 카드 설명
  file?: string; // /summaries/*.html (ready=true 일 때)
  pages?: number;
  ready: boolean;
};

export const summaryOrder: SummaryType[] = ['fire', 'life', 'variable'];

export const summaryGuides: Record<SummaryType, SummaryGuide> = {
  fire: {
    type: 'fire',
    icon: 'fire',
    title: '손해보험 시험 핵심 요약',
    badge: '손해보험',
    sub: '보험이론·윤리, 보험법규, 손해보험, 제3보험 — 4파트 38페이지 빈출 핵심 압축',
    file: '/summaries/fire.html',
    pages: 38,
    ready: true,
  },
  life: {
    type: 'life',
    icon: 'caution',
    title: '생명보험 시험 핵심 요약',
    badge: '생명보험',
    sub: '보험이론·윤리, 보험법규, 생명보험, 제3보험 — 4파트 38페이지 빈출 핵심 압축',
    file: '/summaries/life.html',
    pages: 38,
    ready: true,
  },
  variable: {
    type: 'variable',
    icon: 'coin',
    title: '변액보험 시험 핵심 요약',
    badge: '변액보험',
    sub: '금융시장·생명보험·변액보험·공시/판매준수 — 4개 장 30페이지 빈출 핵심 압축',
    file: '/summaries/variable.html',
    pages: 30,
    ready: true,
  },
};
