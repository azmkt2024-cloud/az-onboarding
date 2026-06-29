// 유관기관 바로가기 — 보험 실무 관련 공식 기관 링크.
export type RelatedOrg = { icon: string; name: string; desc: string; url: string };

export const relatedOrgs: RelatedOrg[] = [
  { icon: '🏛', name: '금융감독원', desc: '금융민원·분쟁·신고', url: 'https://www.fss.or.kr' },
  { icon: '🏦', name: '금융위원회', desc: '금융정책 총괄', url: 'https://www.fsc.go.kr' },
  { icon: '🛡', name: '손해보험협회', desc: '손해보험사 공시·자료', url: 'https://www.knia.or.kr' },
  { icon: '💙', name: '생명보험협회', desc: '생명보험사 공시·자료', url: 'https://www.klia.or.kr' },
  { icon: '📊', name: '보험개발원', desc: '보험통계·요율 산출', url: 'https://www.kidi.or.kr' },
  { icon: '🎓', name: '보험연수원', desc: '보험 교육·자격 정보', url: 'https://www.in.or.kr' },
  { icon: '⚖️', name: '한국소비자원', desc: '소비자 권익 보호', url: 'https://www.kca.go.kr' },
  { icon: '💰', name: '금융소비자포털 파인', desc: '금융상품 비교·공시', url: 'https://fine.fss.or.kr' },
];
