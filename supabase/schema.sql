-- =========================================================
-- 더 프렌즈 온보딩 허브 — Supabase 스키마
-- 모든 skills 파일의 테이블/정책을 통합한 초기 스키마입니다.
-- Supabase 대시보드 → SQL Editor 에 붙여넣어 실행하세요.
-- =========================================================

-- ---------------------------------------------------------
-- 0. 프로필 (어드민 권한 판별용)
--    Supabase Auth 사용자와 1:1 매핑. role = 'admin' 인 사용자만 쓰기 권한.
-- ---------------------------------------------------------
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  role       text not null default 'user',  -- 'user' | 'admin'
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "own profile read" on profiles
  for select using (auth.uid() = id);

-- 신규 가입 시 자동으로 profiles 행 생성
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 어드민 여부를 확인하는 헬퍼 (정책에서 재사용)
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------
-- 1. 시험 일정 (SKILL-crawling)
-- ---------------------------------------------------------
create table if not exists exam_schedules (
  id            uuid primary key default gen_random_uuid(),
  type          text not null,        -- 'loss' | 'life' | 'variable'
  round         text not null default '', -- '1차' 등 (KLIA 생보엔 차수 없음 → '')
  exam_date     date not null,
  regions       text[] not null,      -- ['서울', '부산', ...]
  insurers      text not null,        -- '전 보험사' | '삼성' | ...
  apply_period  text,                 -- 응시신청기간 (KLIA)
  result_date   text,                 -- 합격자발표일 (KLIA)
  year          int not null,
  month         int not null,
  source_url    text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create unique index if not exists exam_schedules_unique
  on exam_schedules (type, round, exam_date);

alter table exam_schedules enable row level security;
create policy "public read" on exam_schedules for select using (true);
create policy "admin write" on exam_schedules for all using (public.is_admin());

-- 이미지로 게시되는 일정(손보 KNIA). 행 데이터는 image_data_uri를 OCR해 exam_schedules로 적재.
create table if not exists exam_schedule_images (
  id             uuid primary key default gen_random_uuid(),
  type           text not null,        -- 'loss'
  title          text not null,        -- '2026년 2분기(4월~6월) 설계사 자격시험 일정'
  detail_url     text not null unique, -- 원문 상세 URL (upsert 키)
  posted_at      date,
  image_data_uri text,                 -- base64 PNG (OCR 입력용)
  ocr_done       boolean default false,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

alter table exam_schedule_images enable row level security;
create policy "admin read" on exam_schedule_images for select using (public.is_admin());
create policy "admin write" on exam_schedule_images for all using (public.is_admin());

-- ---------------------------------------------------------
-- 2. 요점정리 (SKILL-admin)
-- ---------------------------------------------------------
create table if not exists summary_sections (
  id          uuid primary key default gen_random_uuid(),
  type        text not null,   -- 'fire' | 'life' | 'variable'
  title       text not null,
  content     jsonb not null,  -- [{ "trigger": "...", "body": "..." }, ...]
  sort_order  int default 0,
  updated_at  timestamptz default now()
);

alter table summary_sections enable row level security;
create policy "public read" on summary_sections for select using (true);
create policy "admin write" on summary_sections for all using (public.is_admin());

-- ---------------------------------------------------------
-- 3. 보험사 전산 링크 (SKILL-admin)
-- ---------------------------------------------------------
create table if not exists insurer_links (
  id           uuid primary key default gen_random_uuid(),
  category     text not null,   -- 'loss' | 'life' | 'mutual'
  name         text not null,
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

alter table insurer_links enable row level security;
create policy "public read" on insurer_links for select using (true);
create policy "admin write" on insurer_links for all using (public.is_admin());

-- ---------------------------------------------------------
-- 4. 보상 Q&A (SKILL-admin)
-- ---------------------------------------------------------
create table if not exists qna_items (
  id          uuid primary key default gen_random_uuid(),
  category    text not null,   -- '지급기준' | '언더라이팅' | '진단비' | '수술비' | '배상책임' | '후유장해' | '자동차' | '실손의료비'
  question    text not null,
  answer      text not null,
  view_count  int default 0,   -- 조회수 (TOP10 · 연관질문 정렬용)
  sort_order  int default 0,
  is_active   boolean default true,
  updated_at  timestamptz default now()
);

-- 한국어 검색: 형태소 분석기가 기본 제공되지 않아
--   (1) FTS('simple' config, 공백/구두점 토큰화) 인덱스와
--   (2) pg_trgm(부분 일치 ILIKE 가속) 인덱스를 함께 둡니다.
-- 앱에서는 부분 일치(ILIKE)가 한국어 키워드 검색에 더 적합해 trigram을 주로 사용합니다.
alter table qna_items add column if not exists view_count int default 0;

create extension if not exists pg_trgm;

create index if not exists qna_items_trgm_idx
  on qna_items using gin ((question || ' ' || answer) gin_trgm_ops);

create index if not exists qna_items_fts_idx
  on qna_items using gin (to_tsvector('simple', coalesce(question, '') || ' ' || coalesce(answer, '')));

create index if not exists qna_items_view_idx on qna_items (view_count desc);
create index if not exists qna_items_category_idx on qna_items (category);

alter table qna_items enable row level security;
create policy "public read" on qna_items for select using (is_active = true);
create policy "admin write" on qna_items for all using (public.is_admin());

-- 공개 사용자도 조회수 +1 가능하도록 하는 RPC (RLS 우회, 보안 정의자).
create or replace function public.increment_qna_view(item_id uuid)
returns void
language sql security definer set search_path = public
as $$
  update public.qna_items set view_count = view_count + 1 where id = item_id;
$$;

-- ---------------------------------------------------------
-- 5. 기출문제 PDF 메타 (SKILL-pdf)
-- ---------------------------------------------------------
create table if not exists quiz_files (
  id           uuid primary key default gen_random_uuid(),
  type         text not null,      -- 'loss' | 'life' | 'variable'
  year         int,
  title        text not null,
  file_path    text not null,
  file_size    bigint,
  page_count   int,
  is_active    boolean default true,
  sort_order   int default 0,
  uploaded_at  timestamptz default now()
);

alter table quiz_files enable row level security;
create policy "public read" on quiz_files for select using (is_active = true);
create policy "admin write" on quiz_files for all using (public.is_admin());

-- ---------------------------------------------------------
-- 6. 모의고사 문제 / 세션 (SKILL-quiz)
-- ---------------------------------------------------------
create table if not exists quiz_questions (
  id           uuid primary key default gen_random_uuid(),
  type         text not null,      -- 'loss' | 'life' | 'variable'
  subject      text not null,
  year         int,
  round        int,
  question     text not null,
  options      jsonb not null,     -- ["①...", "②...", ...]
  answer       int not null,       -- 1~5
  explanation  text,
  is_active    boolean default true,
  created_at   timestamptz default now()
);

alter table quiz_questions enable row level security;
-- 정답/해설 노출 방지를 위해 공개 SELECT는 허용하지 않습니다.
-- 출제/채점은 서버사이드(Service Role)에서만 수행하세요.
create policy "admin write" on quiz_questions for all using (public.is_admin());

create table if not exists mock_sessions (
  id            uuid primary key default gen_random_uuid(),
  session_key   text unique not null,  -- 브라우저 로컬 ID
  type          text not null,
  questions     jsonb not null,
  answers       jsonb default '{}',
  score         int,
  total         int,
  started_at    timestamptz default now(),
  finished_at   timestamptz
);

alter table mock_sessions enable row level security;
-- 익명 세션 — 서버사이드 API(Service Role)를 통해서만 읽고 씁니다.

-- ---------------------------------------------------------
-- 7. 교육 카테고리 / 자료 (SKILL-education)
-- ---------------------------------------------------------
create table if not exists edu_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  icon        text,
  sort_order  int default 0,
  is_active   boolean default true
);

alter table edu_categories enable row level security;
create policy "public read" on edu_categories for select using (is_active = true);
create policy "admin write" on edu_categories for all using (public.is_admin());

create table if not exists edu_materials (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid references edu_categories(id) on delete set null,
  title         text not null,
  description   text,
  type          text not null,   -- 'pdf' | 'video' | 'article'
  file_path     text,
  video_url     text,
  content       text,
  thumbnail_url text,
  duration_min  int,
  sort_order    int default 0,
  is_active     boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table edu_materials enable row level security;
create policy "public read" on edu_materials for select using (is_active = true);
create policy "admin write" on edu_materials for all using (public.is_admin());

-- 초기 교육 카테고리 seed
insert into edu_categories (name, icon, sort_order) values
  ('보험 기초', '📚', 1),
  ('상품 이해', '🛡️', 2),
  ('실무 노하우', '💼', 3),
  ('법규 & 컴플라이언스', '⚖️', 4),
  ('고객 상담 스킬', '💬', 5)
on conflict do nothing;

-- ---------------------------------------------------------
-- 8. Storage 버킷 (기출문제 PDF / 교육 자료)
-- ---------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('quiz-pdfs', 'quiz-pdfs', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('edu-materials', 'edu-materials', true)
on conflict (id) do nothing;

create policy "public read quiz pdfs"
  on storage.objects for select
  using (bucket_id = 'quiz-pdfs');

create policy "admin upload quiz pdfs"
  on storage.objects for insert
  with check (bucket_id = 'quiz-pdfs' and public.is_admin());

create policy "public read edu"
  on storage.objects for select
  using (bucket_id = 'edu-materials');

create policy "admin upload edu"
  on storage.objects for insert
  with check (bucket_id = 'edu-materials' and public.is_admin());
