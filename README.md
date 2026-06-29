# 더 프렌즈 온보딩 허브 — Claude Code 시작 가이드

## 1. 이 폴더를 바탕화면 `the-friends-novice` 폴더에 넣기

```
바탕화면/
└── the-friends-novice/
    ├── CLAUDE.md                 ← Claude Code 자동 읽기
    ├── README.md                 ← 이 파일
    ├── skills/                   ← 작업별 가이드
    │   ├── SKILL-crawling.md
    │   ├── SKILL-admin.md
    │   ├── SKILL-pdf.md
    │   ├── SKILL-quiz.md
    │   └── SKILL-education.md
    └── 더프렌즈_온보딩허브_v2.html  ← 완성된 HTML 프로토타입
```

---

## 2. VS Code에서 Claude Code 실행

```bash
# VS Code 터미널에서
cd ~/Desktop/the-friends-novice
claude   # Claude Code 시작
```

Claude Code가 시작되면 `CLAUDE.md`를 자동으로 읽고 프로젝트 컨텍스트를 파악합니다.

---

## 3. 첫 번째 명령어 예시

Claude Code에 이렇게 말하면 됩니다:

```
CLAUDE.md와 skills/ 폴더를 모두 읽고,
Next.js 15 + TypeScript + Tailwind + Supabase 프로젝트를
the-friends-novice 폴더에 초기 세팅해줘.
package.json, tsconfig, tailwind.config, supabase schema.sql 포함해서.
```

---

## 4. 작업별 명령어 예시

### 시험 일정 크롤러
```
SKILL-crawling.md를 읽고,
손해보험협회 시험 일정 크롤러를 lib/crawlers/knia.ts에 구현해줘.
Vercel Cron 설정까지 포함해서.
```

### 어드민 CMS
```
SKILL-admin.md를 읽고,
요점정리 어드민 페이지 /admin/summary를 먼저 만들어줘.
Supabase Auth 인증 미들웨어도 포함해서.
```

### 모의고사
```
SKILL-quiz.md를 읽고,
손해보험 모의고사 시험 화면 컴포넌트부터 만들어줘.
타이머, 문제 번호판, 5지선다 UI 포함해서.
```

---

## 5. 환경 변수 설정 (`.env.local`)

프로젝트 초기화 후 아래 항목을 입력해야 합니다:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CRON_SECRET=your-random-secret
```

Supabase 대시보드 → Settings → API에서 확인하세요.

---

## 6. 배포 (Vercel)

```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 연결 및 배포
vercel

# 환경 변수는 Vercel 대시보드에서 추가
# Settings → Environment Variables
```

GitHub 저장소 연결 시 `main` 브랜치 push → 자동 배포됩니다.
