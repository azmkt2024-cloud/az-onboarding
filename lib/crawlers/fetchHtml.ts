// 공통 fetch 유틸 — User-Agent 설정 + 타임아웃 + GET/POST(form) + rate limiting.

const UA =
  'Mozilla/5.0 (compatible; AsFinanceBot/1.0; +https://www.asfinance.co.kr) onboarding-hub schedule crawler';

const COMMON_HEADERS = {
  'User-Agent': UA,
  Accept: 'text/html,application/xhtml+xml',
  'Accept-Language': 'ko-KR,ko;q=0.9',
};

export async function fetchHtml(url: string, timeoutMs = 20000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: COMMON_HEADERS, signal: controller.signal, cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

/** application/x-www-form-urlencoded POST (KLIA 월/지역 전환에 사용). */
export async function postForm(url: string, params: Record<string, string>, timeoutMs = 20000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const body = new URLSearchParams(params).toString();
    const res = await fetch(url, {
      method: 'POST',
      headers: { ...COMMON_HEADERS, 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

/** 협회 사이트 부하 방지용 최소 요청 간격(1초+). */
export function sleep(ms = 1200): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** '2026-06-09(화)' 또는 '6/9' → ISO 날짜 + 연/월/일. 실패 시 null. */
export function parseAnyDate(text: string, fallbackYear: number): { iso: string; year: number; month: number; day: number } | null {
  const iso = text.match(/(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
  if (iso) {
    const [, y, mo, d] = iso;
    return { iso: `${y}-${pad(mo)}-${pad(d)}`, year: +y, month: +mo, day: +d };
  }
  const md = text.match(/(\d{1,2})\s*\/\s*(\d{1,2})/);
  if (md) {
    const [, mo, d] = md;
    if (+mo < 1 || +mo > 12 || +d < 1 || +d > 31) return null;
    return { iso: `${fallbackYear}-${pad(mo)}-${pad(d)}`, year: fallbackYear, month: +mo, day: +d };
  }
  return null;
}

function pad(n: string | number): string {
  return String(n).padStart(2, '0');
}

/** '서울·대전·광주' → ['서울','대전','광주'] */
export function splitRegions(text: string): string[] {
  return text
    .split(/[·,/]/)
    .map((s) => s.trim())
    .filter(Boolean);
}
