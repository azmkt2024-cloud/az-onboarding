# SKILL: 어드민 CMS

> 관련 작업: 요점정리 편집, 보험사 전산 링크 수정, 보상 Q&A 업데이트
> 이 skill을 읽은 후 어드민 관련 코드를 작성하세요.

---

## 어드민 접근 방식

- **인증**: Supabase Auth (이메일/비밀번호)
- **접근 경로**: `/admin` (미인증 시 `/admin/login` 리다이렉트)
- **권한**: Supabase `profiles.role = 'admin'` 인 사용자만 접근
- **일반 사용자**: 어드민 메뉴 노출 없음, URL 직접 접근 시 차단

---

## 어드민 레이아웃

```
/admin
├── layout.tsx        ← 인증 체크 + 사이드바 레이아웃
├── login/page.tsx    ← 로그인 페이지
├── page.tsx          ← 대시보드 (각 메뉴 바로가기)
├── summary/page.tsx  ← 요점정리 편집
├── tools/page.tsx    ← 보험사 전산 링크 편집
├── qna/page.tsx      ← 보상 Q&A 편집
├── quiz/page.tsx     ← 기출문제 PDF 업로드
└── education/page.tsx← 교육 자료 업로드
```

---

## Supabase 테이블 스키마

### 요점정리
```sql
create table summary_sections (
  id          uuid primary key default gen_random_uuid(),
  type        text not null,   -- 'fire' | 'life' | 'variable'
  title       text not null,
  content     jsonb not null,  -- 아코디언 항목 배열
  sort_order  int default 0,
  updated_at  timestamptz default now()
);
-- content 예시:
-- [{ "trigger": "비례보상 기초", "body": "..." }, ...]
```

### 보험사 전산 링크
```sql
create table insurer_links (
  id           uuid primary key default gen_random_uuid(),
  category     text not null,   -- 'loss' | 'life' | 'mutual'
  name         text not null,   -- '삼성화재'
  portal_url   text,
  call_center  text,
  incall_mon   text,
  helpdesk     text,
  fax          text,
  policy_url   text,
  claim_url    text,
  sort_order   int default 0,
  updated_at   timestamptz default now()
);
```

### 보상 Q&A
```sql
create table qna_items (
  id          uuid primary key default gen_random_uuid(),
  category    text not null,   -- '지급기준' | '언더라이팅' | '배상책임'
  question    text not null,
  answer      text not null,
  sort_order  int default 0,
  is_active   boolean default true,
  updated_at  timestamptz default now()
);
```

---

## 어드민 UI 규칙

### 요점정리 편집 (`/admin/summary`)
- 탭: 손해보험 / 생명보험 / 변액보험
- 각 탭 안에 아코디언 항목 목록 (드래그 정렬)
- 항목 클릭 → 인라인 편집 (제목 + 본문 마크다운 에디터)
- 저장 버튼 → Supabase upsert → 성공 토스트

### 보험사 전산 링크 편집 (`/admin/tools`)
- 테이블 형태로 전체 보험사 목록 표시
- 각 셀 클릭 → 인라인 input으로 전환
- 행 추가 / 삭제 / 순서 변경
- 저장: 행 단위 저장 (변경된 행만)

### 보상 Q&A 편집 (`/admin/qna`)
- 카테고리 필터 탭
- Q&A 카드 목록 (활성/비활성 토글)
- 새 항목 추가 폼 (카테고리 선택 + 질문 + 답변)
- 삭제는 실제 삭제 대신 `is_active = false` (소프트 삭제)

---

## Row Level Security (RLS) 설정

```sql
-- 공개 읽기 허용
create policy "public read" on summary_sections for select using (true);
create policy "public read" on insurer_links for select using (true);
create policy "public read" on qna_items for select using (is_active = true);

-- 어드민만 쓰기
create policy "admin write" on summary_sections
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
-- insurer_links, qna_items 동일 패턴 적용
```

---

## 공통 컴포넌트

```
components/admin/
├── AdminLayout.tsx      ← 사이드바 + 헤더
├── InlineEdit.tsx       ← 셀 클릭 → input 전환
├── SortableList.tsx     ← 드래그 정렬 (dnd-kit 사용)
├── MarkdownEditor.tsx   ← 마크다운 편집기 (react-md-editor)
└── Toast.tsx            ← 저장 성공/실패 토스트
```
