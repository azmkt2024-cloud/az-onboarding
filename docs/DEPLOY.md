# 배포 가이드 — the_friends_onboarding

> 계정: `bomappfriends.1@gmail.com` (GitHub · Supabase · Vercel)
> 로컬은 이미 `main` 브랜치에 커밋 완료 + 원격(origin) 비어 있음 → 아래 1번부터 진행.

---

## 1. GitHub 저장소 생성 + 푸시

**방법 A — gh CLI (새 계정 인증 후)**
```bash
gh auth login          # bomappfriends 계정으로 인증
gh repo create the_friends_onboarding --private --source=. --remote=origin --push
```

**방법 B — 웹에서 빈 repo 만든 뒤**
- GitHub → New repository → 이름 the_friends_onboarding``, **Private**, README/.gitignore 추가하지 말 것(빈 repo)
```bash
git remote add origin https://github.com/<계정>/the_friends_onboarding.git
git push -u origin main
```
> 모의고사 PDF 약 200MB라 첫 푸시는 몇 분 걸릴 수 있음.

---

## 2. Supabase (DB · 인증)

1. https://supabase.com → **New project** (Region: `Northeast Asia (Seoul)`)
2. 좌측 **SQL Editor** → [`supabase/schema.sql`](../supabase/schema.sql) 전체 붙여넣고 **Run**
   - (선택) 보상 Q&A 시드가 필요하면 [`supabase/seed_qna.sql`](../supabase/seed_qna.sql) 도 Run
3. **Settings → API** 에서 3개 복사:
   | 항목 | 환경변수 |
   |---|---|
   | Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
   | anon public | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
   | service_role (비밀) | `SUPABASE_SERVICE_ROLE_KEY` |
4. **Authentication → Users → Add user** 로 어드민 로그인용 계정 1개 생성(이메일/비번)

---

## 3. 로컬 `.env.local` (로컬 테스트용 · 선택)

`.env.local` 의 플레이스홀더를 위 실제 값으로 교체:
```
NEXT_PUBLIC_SUPABASE_URL=<Project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public>
SUPABASE_SERVICE_ROLE_KEY=<service_role>
CRON_SECRET=<랜덤 시크릿 — node -e "console.log(require('crypto').randomBytes(24).toString('hex'))">
```

---

## 4. Vercel 배포

1. https://vercel.com/new → GitHub의 `the_friends_onboarding` **Import**
2. Framework는 Next.js 자동 인식 → 그대로
3. **Environment Variables** 에 4개 입력:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CRON_SECRET`  (← 위에서 만든 동일한 값)
4. **Deploy**
5. **Settings → Domains** → `www.azfinancial.co.kr` 추가 → 안내되는 DNS(CNAME) 등록

> `vercel.json` 에 매주 월요일 06시 크롤링 cron이 이미 설정돼 있어, 배포되면 자동 등록됨.

---

## 5. 배포 후 마무리

- **시험일정 초기 채우기(크롤러 1회 수동 실행)** — cron을 기다리지 않고 바로:
  ```bash
  curl -H "Authorization: Bearer <CRON_SECRET>" https://<배포도메인>/api/cron/exam-schedule
  ```
  → 생보·변액 일정이 DB에 채워지고 화면에 표로 나옴.
- **어드민**: `https://<도메인>/admin/login` → Supabase에서 만든 계정으로 로그인 → 손보 일정 입력.
- ⚠️ **입사문의 폼**: 현재 로컬 파일(`.data`)에 저장하는 구조라 Vercel(서버리스)에선 **접수가 저장되지 않음**. `inquiries` 테이블 추가 + 라우트를 Supabase 저장으로 교체 필요(배포 직후 작업 권장).

---

## 6. (선택) 로컬 폴더 이름 변경

VS Code 닫고 → `c:\dev\the-friends-novice` → `c:\dev\the_friends_onboarding` 로 변경 → 다시 열기.
(배포에는 영향 없음. GitHub repo 이름만 `the_friends_onboarding` 이면 됨.)
