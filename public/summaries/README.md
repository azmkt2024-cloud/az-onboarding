# 자격시험 과목별 핵심 요약집 (정적 HTML)

이 폴더의 HTML 파일이 메인 화면 **"자격시험 과목별 핵심 요약"** 섹션의 각 과목 카드에서
전체화면(iframe)으로 열립니다. 앱이 직접 서빙하므로 파일만 넣으면 즉시 반영됩니다.

## 넣어야 할 파일 (파일명 정확히)

| 과목 | 파일 경로 | 원본(첨부) 파일 |
|------|-----------|----------------|
| 손해보험 | `public/summaries/fire.html` | `손해보험_핵심요약집.html` |
| 생명보험 | `public/summaries/life.html` | `생명보험_핵심요약집.html` |
| 변액보험 | `public/summaries/variable.html` | (별도 제작 중 — 추후) |

> 파일명은 **인코딩 안전을 위해 ASCII**(`fire.html` / `life.html`)로 저장하세요.
> 한글 원본 파일을 위 이름으로 복사/이름변경해 넣으면 됩니다.

## 변액보험 추가 시

1. 요약집 HTML을 `variable.html`로 이 폴더에 저장
2. `lib/data/summary.ts`의 `variable` 항목을 아래처럼 변경
   ```ts
   variable: {
     ...,
     file: '/summaries/variable.html',
     pages: 38,
     ready: true,   // false → true
   },
   ```
   → 카드의 "준비중" 칩이 "2026 업데이트"로 바뀌고 오버레이가 요약집을 띄웁니다.
