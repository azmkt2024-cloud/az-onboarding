// 보험사 청구안내 페이지(HTML)에서 '보험금청구서' PDF 링크를 찾아내는 추출기.
// 정적 HTML에 .pdf 링크가 노출되는 보험사에만 동작 (SPA/JS렌더는 별도 처리).
// 파일명에 날짜가 박혀 갱신 시 URL이 바뀌므로, 매 실행마다 페이지를 다시 긁어 현재 PDF를 찾는다.

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

function decodeHtml(buf: Buffer, ctype: string): string {
  let cs = (ctype.match(/charset=([\w-]+)/i)?.[1] || '').toLowerCase();
  if (!cs) {
    const m = buf.toString('latin1').match(/charset=["']?([\w-]+)/i);
    cs = (m?.[1] || 'utf-8').toLowerCase();
  }
  if (cs.includes('euc') || cs.includes('ks_c') || cs.includes('949')) cs = 'euc-kr';
  try {
    return new TextDecoder(cs).decode(buf);
  } catch {
    return buf.toString('utf-8');
  }
}

// '보험금청구서' 양식 본체일수록 높은 점수. 안내문/소개/동의서 등은 감점.
function score(name: string): number {
  const n = name.toLowerCase();
  let s = 0;
  if (/보험금\s*청구서/.test(name)) s += 6;
  else if (/청구서/.test(name)) s += 4;
  else if (/청구/.test(name) || /claim/.test(n) || /clm/.test(n)) s += 2;
  if (/form/.test(n)) s += 1;
  if (/안내|소개|intro|bro|guide|가이드/.test(name + n)) s -= 3;
  if (/동의서|위임장|rating|webaccess|corruption|prdt|mdtcp|agnt/.test(name + n)) s -= 4;
  return s;
}

// 표시용 파일명 정리: download 파라미터 우선, 다운로드 래퍼 확장자 제거
function cleanName(absUrl: string): string {
  try {
    const u = new URL(absUrl);
    const dl = u.searchParams.get('downFileName') || u.searchParams.get('fileName');
    let raw = dl || decodeURIComponent(u.pathname.split('/').pop() || '');
    raw = raw.split('/').pop() || raw;
    raw = raw.replace(/(?:\.pdf)?\.coredownload\.inline\.pdf$/i, '.pdf');
    return raw.trim();
  } catch {
    return absUrl.split('/').pop() || absUrl;
  }
}

export type ExtractResult = { pdfUrl: string; fileName: string; score: number };

export async function extractClaimPdf(pageUrl: string): Promise<ExtractResult | null> {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 25000);
  let html: string;
  try {
    const res = await fetch(pageUrl, {
      redirect: 'follow',
      signal: ctrl.signal,
      headers: { 'User-Agent': UA, Accept: 'text/html,*/*' },
    });
    html = decodeHtml(Buffer.from(await res.arrayBuffer()), res.headers.get('content-type') || '');
  } finally {
    clearTimeout(to);
  }

  const re = /(?:href|src)\s*=\s*["']([^"']*\.(?:pdf|hwp|hwpx|docx?))(?:["'?#])/gi;
  const cands = new Map<string, { abs: string; fname: string; sc: number }>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    let abs: string;
    try {
      abs = new URL(m[1], pageUrl).href;
    } catch {
      continue;
    }
    const fname = cleanName(abs);
    if (!cands.has(abs)) cands.set(abs, { abs, fname, sc: score(fname) });
  }

  // PDF 우선, 점수>0 만 채택
  const ranked = [...cands.values()]
    .filter((c) => c.sc > 0 && /\.pdf$/i.test(c.abs))
    .sort((a, b) => b.sc - a.sc);
  if (!ranked.length) return null;
  const best = ranked[0];
  return { pdfUrl: best.abs, fileName: best.fname, score: best.sc };
}
