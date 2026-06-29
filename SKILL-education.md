# SKILL: 보험 기초 교육 메뉴

> 관련 작업: 교육 자료 업로드, 카테고리 관리, 학습 페이지 구성
> 이 skill을 읽은 후 교육 메뉴 관련 코드를 작성하세요.

---

## 개요

신입 설계사를 위한 보험 기초 교육 콘텐츠 허브.
어드민이 문서(PDF, 영상 링크, 텍스트)를 업로드하면 공개 페이지에 표시됩니다.

---

## Supabase 스키마

```sql
-- 교육 카테고리
create table edu_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,        -- '보험 기초', '실무 노하우', '상품 이해' 등
  icon        text,                 -- 이모지 또는 아이콘명
  sort_order  int default 0,
  is_active   boolean default true
);

-- 교육 자료
create table edu_materials (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid references edu_categories(id),
  title         text not null,
  description   text,
  type          text not null,   -- 'pdf' | 'video' | 'article'
  file_path     text,            -- Supabase Storage (pdf인 경우)
  video_url     text,            -- YouTube/Vimeo URL (video인 경우)
  content       text,            -- 마크다운 본문 (article인 경우)
  thumbnail_url text,
  duration_min  int,             -- 영상 재생 시간(분)
  sort_order    int default 0,
  is_active     boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
```

---

## Supabase Storage 버킷

```sql
-- 교육 자료 PDF 버킷
insert into storage.buckets (id, name, public)
values ('edu-materials', 'edu-materials', true);

create policy "public read edu"
  on storage.objects for select
  using (bucket_id = 'edu-materials');

create policy "admin upload edu"
  on storage.objects for insert
  using (
    bucket_id = 'edu-materials' and
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
```

---

## 어드민 (`/admin/education`)

### 카테고리 관리
- 카테고리 추가 / 이름 변경 / 순서 조정 / 비활성화
- 드래그로 순서 변경 (dnd-kit)

### 자료 업로드 폼
```
카테고리 선택: [드롭다운]
자료 유형: ○ PDF 문서  ○ 영상 링크  ○ 아티클(직접 작성)

[PDF 선택 시]
  - 파일 업로드 (드래그앤드롭)

[영상 링크 선택 시]
  - YouTube/Vimeo URL 입력
  - 재생 시간 입력

[아티클 선택 시]
  - 마크다운 에디터

공통 입력:
  - 제목 (필수)
  - 설명 (선택)
  - 썸네일 이미지 업로드 (선택)
  - 정렬 순서
```

---

## 공개 페이지 (`/education`)

### 레이아웃
```
[보험 기초] [실무 노하우] [상품 이해] ... (카테고리 탭)

카드 그리드:
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ 📄 썸네일   │  │ 🎬 썸네일   │  │ 📝 썸네일   │
│ 제목        │  │ 제목        │  │ 제목        │
│ 설명 요약   │  │ ⏱ 15분     │  │ 설명 요약   │
│ [열기]      │  │ [시청하기]  │  │ [읽기]      │
└─────────────┘  └─────────────┘  └─────────────┘
```

### 자료 타입별 동작
| 타입 | 동작 |
|------|------|
| PDF | 새 탭에서 Supabase Storage URL 열기 |
| 영상 | 페이지 내 YouTube embed 모달 |
| 아티클 | `/education/[id]` 페이지로 이동 (마크다운 렌더링) |

### 아티클 상세 페이지 (`/education/[id]`)
- 마크다운 → HTML 렌더링 (`react-markdown` + `remark-gfm`)
- 목차 자동 생성 (h2, h3 기준)
- 이전/다음 자료 네비게이션

---

## 초기 카테고리 예시

어드민에서 직접 추가하되, 아래를 초기값으로 seed 가능:

```sql
insert into edu_categories (name, icon, sort_order) values
  ('보험 기초', '📚', 1),
  ('상품 이해', '🛡️', 2),
  ('실무 노하우', '💼', 3),
  ('법규 & 컴플라이언스', '⚖️', 4),
  ('고객 상담 스킬', '💬', 5);
```

---

## 네비게이션 메뉴 추가

`CLAUDE.md`의 공통 규칙에 따라 Nav에 `보험 기초 교육` 메뉴 항목 추가:
```typescript
// components/Nav.tsx
{ label: '자격시험', href: '/exam' },
{ label: '요점정리', href: '/summary' },
{ label: '보험사 전산', href: '/tools' },
{ label: '보상 Q&A', href: '/qna' },
{ label: '기초 교육', href: '/education' },  // ← 신규
```
