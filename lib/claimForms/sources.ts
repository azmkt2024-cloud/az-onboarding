// 보험금청구서 자동수집 대상 보험사.
// 정적 추출(extractClaimPdf)로 '보험금청구서' PDF가 안정적으로 잡히는 곳만 우선 등록.
// 확장 시: 검증(scripts 탐침)을 거쳐 이름을 추가하거나, SPA는 직링크 방식으로 별도 처리.

import { lossInsurers, lifeInsurers, mutualInsurers } from '@/lib/data/insurers';

// insurers.ts의 name과 정확히 일치해야 함
export const AUTO_INSURERS: string[] = [
  'DB손해보험',
  '흥국 생명',
  'ABL 생명',
  '하나 생명',
  'AIA 생명',
  'BNP파리카디프',
];

// Supabase Storage 키는 ASCII만 허용 → 보험사별 안정적 슬러그(파일 경로용).
// (다운로드 시 보여줄 파일명은 한글 원본을 ?download= 로 따로 지정한다)
export const SLUG: Record<string, string> = {
  'DB손해보험': 'db-sonhae',
  '흥국 생명': 'heungkuk-life',
  'ABL 생명': 'abl-life',
  '하나 생명': 'hana-life',
  'AIA 생명': 'aia-life',
  'BNP파리카디프': 'bnp-cardif',
};

// 슬러그 미정의 보험사도 안전하게 ASCII 키 생성
export function slugFor(name: string): string {
  if (SLUG[name]) return SLUG[name];
  const ascii = name.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
  if (ascii) return ascii;
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return `insurer-${h.toString(36)}`;
}

export function claimPageFor(name: string): string | null {
  const all = [...lossInsurers, ...lifeInsurers, ...mutualInsurers];
  return all.find((r) => r.name === name)?.claimUrl ?? null;
}

// 직접 PDF URL을 가진 보험사(정적 추출 불가한 SPA 등 — 사람이 찾은 직링크).
// slug = Storage 파일 키(ASCII), label = 문서가 여럿일 때 표시명. url은 매월 재다운로드.
export type ManualDoc = { slug: string; url: string; label?: string };
export const MANUAL_SOURCES: { insurer: string; docs: ManualDoc[] }[] = [
  {
    insurer: '예별손해보험',
    docs: [
      {
        slug: 'yebyeol-claim',
        url: 'https://www.yebyeol.co.kr/webdocs/resources/files/rw031010dm/inbohum_chunggu.pdf?time=20260622',
      },
    ],
  },
  {
    insurer: 'NH농협손해',
    docs: [
      {
        slug: 'nhfire-claim',
        url: 'https://www.nhfire.co.kr/file/service/%EB%B3%B4%ED%97%98%EA%B8%88%EC%B2%AD%EA%B5%AC%EC%84%9C_V20.pdf',
      },
    ],
  },
  {
    insurer: '메리츠화재',
    docs: [
      {
        slug: 'meritz-claim',
        url: 'https://cmdown.meritzfire.com/manager/cm/document/meritzfire_claim_form.pdf',
        label: '청구서',
      },
      {
        slug: 'meritz-consent',
        url: 'https://cmdown.meritzfire.com/manager/cm/document/personal_info_consent_form.pdf',
        label: '개인정보동의서',
      },
    ],
  },
];
