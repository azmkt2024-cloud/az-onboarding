# SKILL: 자격시험 일정 크롤링

> 관련 작업: 시험 일정 자동 수집, DB 저장, 화면 표시
> 이 skill을 읽은 후 크롤링 관련 코드를 작성하세요.

---

## 수집 대상

| 협회 | URL | 수집 항목 |
|------|-----|----------|
| 손해보험협회 | https://www.knia.or.kr | 차수, 시험일, 지역, 대상 보험사 |
| 생명보험협회 | https://www.klia.or.kr | 차수, 시험일, 지역, 대상 보험사 |

---

## 구현 방식

### 기술 선택
- **크롤러**: `cheerio` + `node-fetch` (서버사이드)
- **스케줄**: Vercel Cron Jobs (매일 오전 6시 자동 실행)
- **저장소**: Supabase `exam_schedules` 테이블

### Supabase 테이블 스키마
```sql
create table exam_schedules (
  id          uuid primary key default gen_random_uuid(),
  type        text not null,        -- 'loss' | 'life' | 'variable'
  round       text not null,        -- '1차', '2차' ...
  exam_date   date not null,
  regions     text[] not null,      -- ['서울', '부산', ...]
  insurers    text not null,        -- '전 보험사' | '삼성' | ...
  year        int not null,
  month       int not null,
  source_url  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- 중복 방지 유니크 인덱스
create unique index on exam_schedules (type, round, exam_date);
```

### 파일 구조
```
lib/
└── crawlers/
    ├── index.ts          ← 진입점 (두 협회 모두 실행)
    ├── knia.ts           ← 손해보험협회 크롤러
    ├── klia.ts           ← 생명보험협회 크롤러
    └── upsert.ts         ← Supabase upsert 로직

app/
└── api/
    └── cron/
        └── exam-schedule/
            └── route.ts  ← Vercel Cron 엔드포인트
```

### Vercel Cron 설정 (`vercel.json`)
```json
{
  "crons": [
    {
      "path": "/api/cron/exam-schedule",
      "schedule": "0 6 * * *"
    }
  ]
}
```

### API Route 예시
```typescript
// app/api/cron/exam-schedule/route.ts
import { runAllCrawlers } from '@/lib/crawlers'

export async function GET(req: Request) {
  // Vercel Cron 인증 헤더 검증
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  const result = await runAllCrawlers()
  return Response.json(result)
}
```

### 크롤러 기본 패턴
```typescript
// lib/crawlers/knia.ts
import * as cheerio from 'cheerio'

export async function crawlKnia(year: number, month: number) {
  // 1. 협회 페이지 fetch
  // 2. cheerio로 테이블 파싱
  // 3. { type, round, exam_date, regions, insurers } 배열 반환
  // 4. 파싱 실패 시 빈 배열 반환 (에러로 전체 중단 방지)
}
```

---

## 화면 표시 규칙

- DB에 데이터가 있으면 DB 우선 표시
- DB가 비어있거나 크롤링 실패 시 → 하드코딩 fallback 데이터 표시
- 마지막 업데이트 시각을 화면 하단에 표시
- 협회 사이트 구조 변경으로 크롤링 실패 시 → 슬랙/이메일 알림 (선택)

---

## 주의사항

- 협회 사이트 robots.txt 확인 후 허용 범위 내에서만 수집
- 요청 간격 최소 1초 이상 (rate limiting)
- User-Agent 헤더 설정 필수
- 파싱 실패해도 기존 DB 데이터 삭제하지 않음
