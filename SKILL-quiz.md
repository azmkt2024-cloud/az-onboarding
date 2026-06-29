# SKILL: 실전 모의고사 엔진

> 관련 작업: 기출문제 기반 CBT 모의고사 구현
> 이 skill을 읽은 후 모의고사 관련 코드를 작성하세요.

---

## 개요

- CBT(Computer Based Test) 방식 — 실제 시험 환경과 동일하게
- 기출문제 DB에서 랜덤 출제 또는 연도별 세트 출제
- 타이머, 즉시 채점, 오답 노트 기능

---

## Supabase 스키마

```sql
-- 문제 테이블
create table quiz_questions (
  id           uuid primary key default gen_random_uuid(),
  type         text not null,      -- 'loss' | 'life' | 'variable'
  subject      text not null,      -- '손해보험 이론' | '자동차보험' 등
  year         int,
  round        int,                -- 회차
  question     text not null,
  options      jsonb not null,     -- ["①...", "②...", "③...", "④...", "⑤..."]
  answer       int not null,       -- 1~5 정답 인덱스
  explanation  text,               -- 해설
  is_active    boolean default true,
  created_at   timestamptz default now()
);

-- 모의고사 세션 (익명 가능)
create table mock_sessions (
  id            uuid primary key default gen_random_uuid(),
  session_key   text unique not null,  -- 브라우저 로컬 ID
  type          text not null,
  questions     jsonb not null,        -- 출제된 문제 id 목록
  answers       jsonb default '{}',    -- { "문제id": 선택한답 }
  score         int,
  total         int,
  started_at    timestamptz default now(),
  finished_at   timestamptz
);
```

---

## 어드민 문제 관리 (`/admin/quiz` 탭: 문제 관리)

- 문제 목록: 과목 필터 + 연도 필터
- 문제 추가: 수동 입력 폼 (문제, 보기 5개, 정답, 해설)
- **PDF에서 자동 추출**: 업로드된 PDF → Claude API로 문제 파싱 → 검토 후 승인
- 일괄 import: JSON/CSV 형식 지원

### PDF → 문제 자동 파싱 흐름
```
PDF 업로드 → Supabase Storage 저장
→ /api/admin/parse-pdf 호출
→ Claude API에 PDF 텍스트 + 파싱 프롬프트 전달
→ JSON 형태로 문제 배열 반환
→ 어드민 검토 화면에서 확인 후 [승인] → quiz_questions insert
```

---

## 공개 모의고사 페이지 (`/mock`)

### 시험 선택 화면
```
[손해보험설계사] [생명보험설계사] [변액보험판매관리사]

출제 방식:
○ 랜덤 출제 (최신 기출 기반)
○ 연도별 세트 선택: [2024년 1회] [2024년 2회] ...

[시험 시작]
```

### 시험 화면 컴포넌트
```typescript
// components/mock/ExamScreen.tsx
// - 상단: 타이머 + 문제 번호 / 전체 (예: 23 / 50)
// - 중앙: 문제 + 5지선다 보기
// - 하단: [이전] [다음] [답안 제출]
// - 우측: 문제 번호판 (answered / flagged / empty 색상 구분)
```

### 채점 화면
```typescript
// components/mock/ResultScreen.tsx
// - 점수 카드: X점 / 100점 (합격 여부 표시)
// - 과목별 정답률 차트 (recharts)
// - 오답 목록: 내 답 vs 정답 + 해설
// - [다시 풀기] [오답만 다시 풀기] [메인으로]
```

---

## 상태 관리

- 시험 진행 중 상태: `sessionStorage` (새로고침 복구용)
- 결과 저장: `mock_sessions` 테이블 (익명 세션키로)
- 오답 노트: 로컬스토리지에 문제 id 저장 → `/mock/review`에서 재출제

---

## 타이머 규칙

| 시험 종류 | 문항 수 | 제한 시간 |
|----------|--------|---------|
| 손해보험 | 50문항 | 50분 |
| 생명보험 | 40문항 | 40분 |
| 변액보험 | 45문항 | 45분 |

- 5분 전 경고 표시
- 시간 초과 시 자동 제출

---

## 주의사항

- 문제 DB가 충분히 쌓이기 전까지는 랜덤 출제 시 중복 방지 처리
- 정답/해설은 제출 전 절대 노출 금지 (클라이언트 상태에도 포함 금지)
- 정답은 서버사이드 API에서만 검증
