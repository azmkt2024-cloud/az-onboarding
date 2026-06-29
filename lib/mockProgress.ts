// 모의고사 학습 기록(푼 회차) — 현재는 localStorage 기반으로 로그인이 필요 없습니다.
// ★ 추후 카카오 로그인 + Supabase 도입 시, 이 파일의 load/save 만 DB 연동으로 교체하면 됩니다.
//   (호출부 MockExamOverlay 는 그대로 두고 이 모듈만 바꾸면 됨)

const KEY = 'mock-progress-v1';

export function loadCompleted(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? new Set<string>(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function saveCompleted(set: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify([...set]));
  } catch {
    /* 저장 실패(시크릿모드 등)는 무시 */
  }
}
