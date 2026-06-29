// 보상 Q&A 공유 타입/상수 (클라이언트·서버 공용)
export type QnaResult = {
  id: string;
  category: string;
  question: string;
  answer: string;
  viewCount: number;
};

// 카테고리 탭 ('전체' 포함). 자동차·실손의료비는 추후 크롤링분 대비 미리 노출.
export const QNA_TABS = [
  '전체',
  '지급기준',
  '언더라이팅',
  '진단비',
  '수술비',
  '배상책임',
  '후유장해',
  '자동차',
  '실손의료비',
] as const;

export const QNA_PAGE_SIZE = 10;
