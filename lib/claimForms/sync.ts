// 보험금청구서 동기화 — 청구안내 페이지에서 PDF를 찾거나(AUTO), 직링크를 받아(MANUAL)
// 다운로드해 Supabase Storage(claim-forms 버킷)에 보관한다. 내용이 바뀐 것만 업로드.
// 메타데이터는 같은 버킷의 _index.json으로 관리(DB 테이블 불필요).
// 점검 실패가 1건이라도 있으면 이메일로 알린다(notify).

import { createHash } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { AUTO_INSURERS, MANUAL_SOURCES, claimPageFor, slugFor } from './sources';
import { extractClaimPdf } from './extract';
import { sendClaimAlert } from './notify';

const BUCKET = 'claim-forms';
const INDEX = '_index.json';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

export type ClaimFormEntry = {
  insurer: string;
  key: string; // Storage 파일 키(=path without .pdf) / 중복 판별용
  label?: string; // 보험사당 여러 문서일 때 표시명 (예: 청구서/동의서)
  hosted: boolean; // 우리 Storage에 보관 중인지
  fileName: string;
  sourcePage: string;
  pdfUrl: string;
  path: string;
  publicUrl: string;
  size: number;
  sha256: string;
  updatedAt: string;
};
export type ClaimCheck = { insurer: string; lastCheckedAt: string; ok: boolean; error?: string };
export type ClaimIndex = { updatedAt: string; forms: ClaimFormEntry[]; checks?: ClaimCheck[] };

type SyncResult = { insurer: string; label?: string; ok: boolean; changed?: boolean; note?: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function readIndex(sb: any): Promise<ClaimIndex> {
  const { data } = await sb.storage.from(BUCKET).download(INDEX);
  if (!data) return { updatedAt: '', forms: [] };
  try {
    return JSON.parse(await data.text());
  } catch {
    return { updatedAt: '', forms: [] };
  }
}

function baseName(url: string): string {
  try {
    return decodeURIComponent(new URL(url).pathname.split('/').pop() || '').trim() || '보험금청구서.pdf';
  } catch {
    return '보험금청구서.pdf';
  }
}

// PDF를 받아 변경 시에만 업로드하고 엔트리를 만든다. 실패 시 throw.
async function hostPdf(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sb: any,
  prev: ClaimFormEntry | undefined,
  nowIso: string,
  job: { insurer: string; key: string; label?: string; fileName: string; pdfUrl: string; sourcePage: string },
): Promise<{ entry: ClaimFormEntry; changed: boolean }> {
  const dl = await fetch(job.pdfUrl, { redirect: 'follow', headers: { 'User-Agent': UA } });
  const buf = Buffer.from(await dl.arrayBuffer());
  if (!buf.subarray(0, 5).toString('latin1').startsWith('%PDF')) {
    throw new Error(`PDF 다운로드 실패 (HTTP ${dl.status})`);
  }
  const sha = createHash('sha256').update(buf).digest('hex');
  const changed = !prev || prev.sha256 !== sha;
  const path = `${job.key}.pdf`;
  if (changed) {
    const up = await sb.storage.from(BUCKET).upload(path, buf, {
      contentType: 'application/pdf',
      upsert: true,
    });
    if (up.error) throw up.error;
  }
  const publicUrl = sb.storage.from(BUCKET).getPublicUrl(path, { download: job.fileName }).data.publicUrl;
  const entry: ClaimFormEntry = {
    insurer: job.insurer,
    key: job.key,
    label: job.label,
    hosted: true,
    fileName: job.fileName,
    sourcePage: job.sourcePage,
    pdfUrl: job.pdfUrl,
    path,
    publicUrl,
    size: buf.length,
    sha256: sha,
    updatedAt: changed ? nowIso : prev?.updatedAt || nowIso,
  };
  return { entry, changed };
}

export async function syncClaimForms(
  nowIso: string,
): Promise<{ results: SyncResult[]; total: number; alert?: { sent: boolean; reason?: string } }> {
  const sb = createAdminClient();
  await sb.storage.createBucket(BUCKET, { public: true, fileSizeLimit: '25MB' }).catch(() => {});

  const idx = await readIndex(sb);
  const prevByPath = new Map<string, ClaimFormEntry>(idx.forms.map((f) => [f.path, f]));
  const entries: ClaimFormEntry[] = [];
  const results: SyncResult[] = [];
  const checks: ClaimCheck[] = [];

  // 1) AUTO — 청구안내 페이지에서 PDF 추출
  for (const name of AUTO_INSURERS) {
    try {
      const page = claimPageFor(name);
      if (!page) throw new Error('claimUrl 없음');
      const ex = await extractClaimPdf(page);
      if (!ex) throw new Error('청구서 PDF를 페이지에서 찾지 못함 (사이트 구조 변경 의심)');
      const key = slugFor(name);
      const { entry, changed } = await hostPdf(sb, prevByPath.get(`${key}.pdf`), nowIso, {
        insurer: name,
        key,
        fileName: ex.fileName,
        pdfUrl: ex.pdfUrl,
        sourcePage: page,
      });
      entries.push(entry);
      results.push({ insurer: name, ok: true, changed });
      checks.push({ insurer: name, lastCheckedAt: nowIso, ok: true });
    } catch (e) {
      const note = e instanceof Error ? e.message : String(e);
      results.push({ insurer: name, ok: false, note });
      checks.push({ insurer: name, lastCheckedAt: nowIso, ok: false, error: note });
    }
  }

  // 2) MANUAL — 직링크 PDF (보험사당 복수 문서 가능)
  for (const src of MANUAL_SOURCES) {
    for (const doc of src.docs) {
      try {
        const { entry, changed } = await hostPdf(sb, prevByPath.get(`${doc.slug}.pdf`), nowIso, {
          insurer: src.insurer,
          key: doc.slug,
          label: doc.label,
          fileName: baseName(doc.url),
          pdfUrl: doc.url,
          sourcePage: doc.url,
        });
        entries.push(entry);
        results.push({ insurer: src.insurer, label: doc.label, ok: true, changed });
        checks.push({ insurer: `${src.insurer}${doc.label ? `(${doc.label})` : ''}`, lastCheckedAt: nowIso, ok: true });
      } catch (e) {
        const note = e instanceof Error ? e.message : String(e);
        results.push({ insurer: src.insurer, label: doc.label, ok: false, note });
        checks.push({ insurer: `${src.insurer}${doc.label ? `(${doc.label})` : ''}`, lastCheckedAt: nowIso, ok: false, error: note });
      }
    }
  }

  const newIdx: ClaimIndex = {
    updatedAt: nowIso,
    forms: entries.sort((a, b) => a.insurer.localeCompare(b.insurer) || (a.label || '').localeCompare(b.label || '')),
    checks: checks.sort((a, b) => a.insurer.localeCompare(b.insurer)),
  };
  await sb.storage.from(BUCKET).upload(INDEX, Buffer.from(JSON.stringify(newIdx, null, 2)), {
    contentType: 'application/json',
    upsert: true,
  });

  // 실패가 있으면 이메일 알림
  let alert: { sent: boolean; reason?: string } | undefined;
  const failures = results.filter((r) => !r.ok);
  const updated = results.filter((r) => r.ok && r.changed);
  if (failures.length > 0) {
    const when = nowIso.slice(0, 10);
    const rows = failures
      .map(
        (f) =>
          `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee;font-weight:600">${f.insurer}${f.label ? ` (${f.label})` : ''}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;color:#c0392b">${f.note ?? ''}</td></tr>`,
      )
      .join('');
    const updLine = updated.length
      ? `<p style="color:#1a7f37">이번에 갱신: ${updated.map((u) => `${u.insurer}${u.label ? `(${u.label})` : ''}`).join(', ')}</p>`
      : '';
    const html = `
      <div style="font-family:sans-serif;font-size:14px;color:#191f28">
        <h2 style="margin:0 0 6px">보험금청구서 자동 점검 — 실패 ${failures.length}건</h2>
        <p style="color:#6b7684;margin:0 0 14px">점검일 ${when} · 아래는 최신 청구서를 받지 못했습니다. 사이트 주소 변경 등을 확인해 주세요.</p>
        <table style="border-collapse:collapse;font-size:13px"><thead><tr>
          <th style="text-align:left;padding:6px 10px;border-bottom:2px solid #ddd">보험사</th>
          <th style="text-align:left;padding:6px 10px;border-bottom:2px solid #ddd">사유</th>
        </tr></thead><tbody>${rows}</tbody></table>
        ${updLine}
        <p style="color:#8b95a1;margin-top:16px;font-size:12px">에즈금융서비스 온보딩 허브 · 자동 발송</p>
      </div>`;
    alert = await sendClaimAlert(`[에즈 온보딩] 보험금청구서 점검 실패 ${failures.length}건 (${when})`, html);
  }

  return { results, total: newIdx.forms.length, alert };
}
