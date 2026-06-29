# 더 프렌즈 온보딩 허브 — CLAUDE.md

> Claude Code가 이 프로젝트를 열면 **반드시 이 파일을 먼저 읽고** 작업을 시작합니다.
> 추가 skill 파일은 `/skills/` 폴더에 있습니다. 관련 작업 전 해당 skill을 먼저 확인하세요.

---

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | 더 프렌즈 온보딩 허브 |
| 폴더명 | `the-friends-novice` (바탕화면) |
| 목적 | 신입 보험설계사를 위한 자격시험·실무도구·교육 허브 |
| 현재 단계 | HTML 프로토타입 완성 → 풀스택 앱으로 전환 중 |
| 기술 스택 | Next.js 15 · TypeScript · Tailwind CSS · Supabase · Vercel |

---

## 현재 완성된 것 (HTML 프로토타입)

`더프렌즈_온보딩허브_v2.html` — 단일 파일 프로토타입

### 구현된 섹션
- **자격시험** — 설계사 자격시험 정보(오버레이), 기출문제, 실전 모의고사 카드
- **과목별 요점정리** — 손해·생명·변액보험 아코디언 페이지 오버레이
- **보험사 포탈** — 전산 바로가기(policy.html 내장), 보장분석 동의 모달
- **보상 Q&A** — 카드 클릭 시 아코디언 모달
- **푸터**

---

## 전환 아키텍처

```
the-friends-novice/
├── CLAUDE.md                  ← 이 파일 (Claude Code 자동 읽기)
├── skills/                    ← 작업별 skill 파일 모음
│   ├── SKILL-crawling.md
│   ├── SKILL-admin.md
│   ├── SKILL-pdf.md
│   ├── SKILL-quiz.md
│   └── SKILL-education.md
├── app/                       ← Next.js App Router
│   ├── (public)/              ← 공개 페이지
│   │   ├── page.tsx           ← 메인 허브
│   │   ├── exam/page.tsx      ← 자격시험 정보
│   │   ├── summary/page.tsx   ← 요점정리
│   │   ├── quiz/page.tsx      ← 기출문제
│   │   ├── mock/page.tsx      ← 실전 모의고사
│   │   ├── tools/page.tsx     ← 보험사 전산
│   │   ├── qna/page.tsx       ← 보상 Q&A
│   │   └── education/page.tsx ← 보험 기초 교육 (신규)
│   └── admin/                 ← 어드민 (인증 필요)
│       ├── layout.tsx
│       ├── summary/page.tsx   ← 요점정리 편집
│       ├── tools/page.tsx     ← 보험사 전산 링크 편집
│       ├── qna/page.tsx       ← 보상 Q&A 편집
│       ├── quiz/page.tsx      ← 기출문제 PDF 업로드
│       └── education/page.tsx ← 교육 자료 업로드
├── components/
├── lib/
│   ├── supabase.ts
│   └── crawlers/              ← 시험 일정 크롤러
├── public/
│   └── uploads/               ← PDF 등 정적 파일
└── supabase/
    └── schema.sql             ← DB 스키마
```

---

## 작업 우선순위

1. `SKILL-crawling.md` → 시험 일정 자동 수집
2. `SKILL-admin.md` → 어드민 CMS 구축
3. `SKILL-pdf.md` → 기출문제 PDF 업로드·뷰어
4. `SKILL-quiz.md` → 실전 모의고사 엔진
5. `SKILL-education.md` → 보험 기초 교육 메뉴

---

## 공통 규칙

- **언어**: 한국어 UI, TypeScript 코드
- **스타일**: Tailwind CSS, 디자인 토큰은 HTML 프로토타입의 CSS 변수 참조
- **인증**: Supabase Auth (어드민만 적용, 일반 페이지는 공개)
- **배포**: Vercel (main 브랜치 push → 자동 배포)
- **환경변수**: `.env.local` 참조, 절대 커밋 금지
