'use client';

import { useEffect, useState } from 'react';
import { lossInsurers, lifeInsurers, mutualInsurers, type InsurerRow } from '@/lib/data/insurers';
import { relatedOrgs } from '@/lib/data/relatedOrgs';
import Icon from '@/components/Icon';

type Props = { open: boolean; onClose: () => void };

// 보험금청구서 인덱스(Supabase Storage claim-forms/_index.json)
type ClaimEntry = {
  insurer: string;
  label?: string;
  hosted?: boolean;
  fileName: string;
  publicUrl: string;
  updatedAt: string;
};

// 보험사명 → 청구서 항목 배열 맵을 1회 로드 (보험사당 복수 문서 가능)
function useClaimForms(): Map<string, ClaimEntry[]> {
  const [map, setMap] = useState<Map<string, ClaimEntry[]>>(new Map());
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!base) return;
    fetch(`${base}/storage/v1/object/public/claim-forms/_index.json`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { forms?: ClaimEntry[] }) => {
        if (!d?.forms?.length) return;
        const m = new Map<string, ClaimEntry[]>();
        for (const f of d.forms) {
          if (!m.has(f.insurer)) m.set(f.insurer, []);
          m.get(f.insurer)!.push(f);
        }
        setMap(m);
      })
      .catch(() => {});
  }, []);
  return map;
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** 약관확인 셀 — 단일 링크 또는 판매중/판매중지 복수 링크 렌더링 */
function PolicyCell({ value }: { value: InsurerRow['policyUrl'] }) {
  if (typeof value === 'string') {
    return (
      <a href={value} target="_blank" rel="noopener">
        약관확인
      </a>
    );
  }
  return (
    <span style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
      {value.map((p) => (
        <a key={p.label} href={p.url} target="_blank" rel="noopener">
          {p.label}
        </a>
      ))}
    </span>
  );
}

function InsurerTable({
  rows,
  faxLabel = '보험금 청구팩스',
  claims,
}: {
  rows: InsurerRow[];
  faxLabel?: string;
  claims: Map<string, ClaimEntry[]>;
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>보험사 (영업포털 바로가기)</th>
            <th>고객센터</th>
            <th>인콜 모니터링</th>
            <th>전산 헬프데스크</th>
            <th>{faxLabel}</th>
            <th>약관확인</th>
            <th>청구양식</th>
            <th>보험금청구서</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}>
              <td className="pol-name-cell">
                <a className="pol-portal-link" href={r.portalUrl} target="_blank" rel="noopener">
                  <span>{r.name}</span>
                  <svg
                    className="pol-ext-ico"
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M14 3h7v7M21 3l-9 9M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
                  </svg>
                </a>
              </td>
              <td>{r.callCenter}</td>
              <td>{r.incallMon}</td>
              <td>{r.helpdesk}</td>
              <td>{r.fax}</td>
              <td>
                <PolicyCell value={r.policyUrl} />
              </td>
              <td>
                <a href={r.claimUrl} target="_blank" rel="noopener">
                  {r.claimLabel ?? '청구양식'}
                </a>
              </td>
              <td>
                {claims.get(r.name)?.length ? (
                  <span className="pol-claim-wrap">
                    {claims.get(r.name)!.map((d) => (
                      <a
                        key={d.label ?? d.publicUrl}
                        className="pol-claim-pdf"
                        href={d.hosted === false ? d.publicUrl : d.publicUrl.split('?')[0]}
                        target="_blank"
                        rel="noopener"
                        title={d.fileName}
                      >
                        {d.label ?? 'PDF 보기'}
                      </a>
                    ))}
                  </span>
                ) : (
                  <span className="pol-claim-none">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** 보험사 전산 / 약관 / 청구양식 전체화면 오버레이 (리디자인) */
export default function PolicyOverlay({ open, onClose }: Props) {
  const [q, setQ] = useState('');
  const claims = useClaimForms();
  const norm = (s: string) => s.replace(/\s/g, '').toLowerCase();
  const filter = (rows: InsurerRow[]) =>
    q.trim() ? rows.filter((r) => norm(r.name).includes(norm(q))) : rows;

  const loss = filter(lossInsurers);
  const life = filter(lifeInsurers);
  const mutual = filter(mutualInsurers);
  const noResult = q.trim() !== '' && loss.length === 0 && life.length === 0 && mutual.length === 0;

  return (
    <div className={`page-overlay${open ? ' open' : ''}`}>
      <div className="page-header">
        <div className="page-header-title">
          <Icon name="phone" /> 보험사 전산 바로가기
        </div>
        <button className="page-back" onClick={onClose}>
          ← 돌아가기
        </button>
      </div>

      <div className="page-body policy-page-body">
        {/* HERO */}
        <div className="pol-hero">
          <div className="pol-hero-inner">
            <span className="pol-hero-badge"><Icon name="phone" /> 보험사 전산</span>
            <h1>
              보험사 전산 및 약관 · 청구양식
            </h1>
            <p>전 보험사 전산 접속, 고객센터, 약관, 청구양식을 한눈에 확인하세요.</p>
            <div className="pol-hero-tabs">
              <button onClick={() => scrollToId('pol-loss')}>🛡 손해보험</button>
              <button onClick={() => scrollToId('pol-life')}>💙 생명보험</button>
              <button onClick={() => scrollToId('pol-mutual')}>🏛 공제회사</button>
              <button onClick={() => scrollToId('pol-related')}>🔗 유관기관</button>
            </div>
          </div>
        </div>

        {/* 검색 + 안내 바 */}
        <div className="pol-bar">
          <div className="pol-bar-inner">
            <p className="pol-note">
              ℹ️ 보험사 클릭 시 해당 보험사 전산으로 이동합니다. 링크는 변경될 수 있으니 접속 불가 시 고객센터로 문의하세요.
            </p>
            <input
              className="pol-search"
              type="search"
              placeholder="보험사명 검색…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        <div className="container">
          {noResult && <div className="pol-empty">‘{q}’ 검색 결과가 없습니다.</div>}

          {/* 손해보험 */}
          {loss.length > 0 && (
            <section id="pol-loss" className="pol-section">
              <div className="pol-sec-head">
                <span className="pol-sec-num">01</span>
                <h2>손해보험</h2>
                <span className="pol-sec-count">{loss.length}개사</span>
              </div>
              <InsurerTable rows={loss} claims={claims} />
            </section>
          )}

          {/* 생명보험 */}
          {life.length > 0 && (
            <section id="pol-life" className="pol-section">
              <div className="pol-sec-head">
                <span className="pol-sec-num">02</span>
                <h2>생명보험</h2>
                <span className="pol-sec-count">{life.length}개사</span>
              </div>
              <InsurerTable rows={life} faxLabel="청구팩스" claims={claims} />
            </section>
          )}

          {/* 공제회사 */}
          {mutual.length > 0 && (
            <section id="pol-mutual" className="pol-section">
              <div className="pol-sec-head">
                <span className="pol-sec-num">03</span>
                <h2>공제회사</h2>
                <span className="pol-sec-count">{mutual.length}개사</span>
              </div>
              <InsurerTable rows={mutual} faxLabel="청구팩스" claims={claims} />
            </section>
          )}

          {/* 유관기관 바로가기 */}
          <section id="pol-related" className="pol-section">
            <div className="pol-sec-head">
              <span className="pol-sec-num">04</span>
              <h2>유관기관 바로가기</h2>
            </div>
            <div className="pol-related-grid">
              {relatedOrgs.map((o) => (
                <a key={o.name} className="pol-org-card" href={o.url} target="_blank" rel="noopener">
                  <span className="pol-org-icon">{o.icon}</span>
                  <span>
                    <span className="pol-org-name">{o.name}</span>
                    <span className="pol-org-desc">{o.desc}</span>
                  </span>
                </a>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
