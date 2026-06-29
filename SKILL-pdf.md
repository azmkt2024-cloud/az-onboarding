# SKILL: 기출문제 PDF 업로드 & 뷰어

> 관련 작업: 기출문제 PDF 업로드, 목록 표시, 인라인 뷰어
> 이 skill을 읽은 후 PDF 관련 코드를 작성하세요.

---

## 저장소

- **파일**: Supabase Storage `quiz-pdfs` 버킷 (공개 읽기)
- **메타**: Supabase `quiz_files` 테이블

---

## Supabase 스키마

```sql
create table quiz_files (
  id           uuid primary key default gen_random_uuid(),
  type         text not null,      -- 'loss' | 'life' | 'variable'
  year         int,                -- 출제 연도 (예: 2024)
  title        text not null,      -- '2024년 손해보험 기출문제 1회'
  file_path    text not null,      -- storage path
  file_size    bigint,             -- bytes
  page_count   int,
  is_active    boolean default true,
  sort_order   int default 0,
  uploaded_at  timestamptz default now()
);
```

---

## 어드민 업로드 (`/admin/quiz`)

### UI 흐름
1. 드래그앤드롭 또는 파일 선택 (`.pdf` only)
2. 메타 입력: 과목 선택(손해/생명/변액), 연도, 제목
3. 업로드 버튼 → Supabase Storage PUT → 테이블 insert
4. 업로드 목록에 즉시 반영

### 업로드 코드 패턴
```typescript
const { data, error } = await supabase.storage
  .from('quiz-pdfs')
  .upload(`${type}/${year}/${fileName}`, file, {
    contentType: 'application/pdf',
    upsert: false,
  })

if (!error) {
  await supabase.from('quiz_files').insert({
    type, year, title, file_path: data.path, file_size: file.size
  })
}
```

---

## 공개 페이지 (`/quiz`)

### 목록 UI
- 탭: 손해보험 / 생명보험 / 변액보험
- 연도별 그룹핑 (최신순)
- 각 파일 카드: 제목, 연도, 파일 크기, [열기] 버튼

### PDF 뷰어
- **방법 A (간단)**: 새 탭에서 Supabase Storage 공개 URL 열기
- **방법 B (인라인)**: `react-pdf` 라이브러리로 페이지 내 렌더링
- **기본은 방법 A** (빠른 구현), 추후 방법 B로 업그레이드

### 공개 URL 생성
```typescript
const { data } = supabase.storage
  .from('quiz-pdfs')
  .getPublicUrl(file.file_path)
// → data.publicUrl 을 <a href> 또는 window.open 으로 사용
```

---

## Supabase Storage 설정

```sql
-- 버킷 생성 (Supabase 대시보드 또는 SQL)
insert into storage.buckets (id, name, public)
values ('quiz-pdfs', 'quiz-pdfs', true);

-- 공개 읽기 정책
create policy "public read quiz pdfs"
  on storage.objects for select
  using (bucket_id = 'quiz-pdfs');

-- 어드민만 업로드
create policy "admin upload quiz pdfs"
  on storage.objects for insert
  using (
    bucket_id = 'quiz-pdfs' and
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
```

---

## 주의사항

- PDF 파일명에 한글 포함 시 인코딩 이슈 → 파일명은 UUID로 저장, 원본명은 테이블에 보관
- 최대 파일 크기: 50MB (Supabase Storage 기본 제한)
- 업로드 진행률 표시 필요 (큰 파일 대비)
