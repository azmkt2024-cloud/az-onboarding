'use client';

import { useEffect, useRef, useState } from 'react';
import { QNA_TABS, type QnaResult } from '@/lib/data/qnaTypes';
import { searchQna, getTopQna, getRelatedQna, incrementQnaView } from '@/lib/actions/qna';
import Icon from '@/components/Icon';

type Props = { open: boolean; onClose: () => void };

const PAGE_SIZES = [20, 50, 100] as const;

export default function QnaOverlay({ open, onClose }: Props) {
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [category, setCategory] = useState<string>('전체');
  const [pageSize, setPageSize] = useState<number>(20);
  const [page, setPage] = useState(0);

  const [items, setItems] = useState<QnaResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [top10, setTop10] = useState<QnaResult[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [openRelatedId, setOpenRelatedId] = useState<string | null>(null);
  const [relatedMap, setRelatedMap] = useState<Record<string, QnaResult[]>>({});

  const incrementedRef = useRef<Set<string>>(new Set());
  const listTopRef = useRef<HTMLDivElement>(null);

  // 검색어 디바운스 (300ms) — 변경 시 첫 페이지로
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(q);
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  // TOP10 (최초 오픈 1회)
  useEffect(() => {
    if (!open || top10.length > 0) return;
    getTopQna(10).then(setTop10);
  }, [open, top10.length]);

  // 검색/탭/페이지 변경 시 로드
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setOpenId(null);
    setOpenRelatedId(null);
    searchQna({ q: debouncedQ, category, offset: page * pageSize, limit: pageSize }).then((res) => {
      if (cancelled) return;
      setItems(res.items);
      setTotal(res.total);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open, debouncedQ, category, pageSize, page]);

  function toggle(item: QnaResult) {
    if (openId === item.id) {
      setOpenId(null);
      setOpenRelatedId(null);
      return;
    }
    setOpenId(item.id);
    setOpenRelatedId(null);
    if (!incrementedRef.current.has(item.id)) {
      incrementedRef.current.add(item.id);
      void incrementQnaView(item.id);
    }
    if (!relatedMap[item.id]) {
      getRelatedQna(item.id, item.category, 3).then((rel) =>
        setRelatedMap((m) => ({ ...m, [item.id]: rel }))
      );
    }
  }

  function goPage(next: number) {
    setPage(next);
    listTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const showTop = category === '전체' && debouncedQ.trim() === '' && top10.length > 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : page * pageSize + 1;
  const end = Math.min(total, page * pageSize + items.length);

  const renderRow = (item: QnaResult, keyPrefix: string) => {
    const isOpen = openId === item.id;
    const related = relatedMap[item.id] ?? [];
    return (
      <div className={`qna-item${isOpen ? ' open' : ''}`} key={keyPrefix + item.id}>
        <button className="qna-trigger" onClick={() => toggle(item)}>
          <span className="qna-cat">{item.category}</span>
          <span className="qna-q">{item.question}</span>
          <span className="qna-chevron">{isOpen ? '×' : '+'}</span>
        </button>
        {isOpen && (
          <div className="qna-body">
            <div className="qna-answer">{item.answer}</div>
            {related.length > 0 && (
              <div className="qna-related">
                <div className="qna-related-title">🔗 연관 질문</div>
                {related.map((r) => {
                  const rOpen = openRelatedId === r.id;
                  return (
                    <div key={r.id}>
                      <button
                        className="qna-related-item"
                        onClick={() => setOpenRelatedId(rOpen ? null : r.id)}
                      >
                        <span className="qna-cat sm">{r.category}</span>
                        <span className="qna-related-q">{r.question}</span>
                        <span className="qna-related-plus">{rOpen ? '−' : '+'}</span>
                      </button>
                      {rOpen && <div className="qna-related-answer">{r.answer}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`page-overlay${open ? ' open' : ''}`}>
      <div className="page-header">
        <div className="page-header-title">
          <Icon name="lightbulb" /> 보상 Q&amp;A
        </div>
        <button className="page-back" onClick={onClose}>
          ← 돌아가기
        </button>
      </div>

      <div className="page-body policy-page-body">
        {/* HERO */}
        <div className="pol-hero">
          <div className="pol-hero-inner">
            <span className="pol-hero-badge"><Icon name="lightbulb" /> 보상 Q&amp;A</span>
            <h1>보상이 궁금하다면?</h1>
            <p>실제 보상 상담사례를 쉬운 말로 풀어, 자주 묻는 보상 질문을 찾아보세요.</p>
          </div>
        </div>

        {/* 검색 바 */}
        <div className="pol-bar">
          <div className="pol-bar-inner">
            <p className="pol-note">키워드 또는 카테고리로 보상 실무 질문을 검색하세요.</p>
            <input
              className="pol-search"
              type="search"
              placeholder="예) 수술비, 누수, 후유장해"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        <div className="container">
          {/* 카테고리 탭 */}
          <div className="ep-stype-tabs" style={{ marginBottom: 20, maxWidth: '100%' }}>
            {QNA_TABS.map((c) => (
              <button
                key={c}
                className={`ep-stype-tab${category === c ? ' active' : ''}`}
                onClick={() => {
                  setCategory(c);
                  setPage(0);
                }}
              >
                {c}
              </button>
            ))}
          </div>

          {/* 자주 찾는 질문 TOP 10 */}
          {showTop && (
            <div style={{ marginBottom: 28 }}>
              <div className="qna-section-title">🔥 자주 찾는 질문 TOP 10</div>
              <div className="qna-list">{top10.map((it) => renderRow(it, 'top-'))}</div>
            </div>
          )}

          {/* 목록 헤더 + 페이지 크기 선택 */}
          <div ref={listTopRef} className="qna-listhead">
            <div className="qna-section-title" style={{ margin: 0 }}>
              {debouncedQ.trim()
                ? `‘${debouncedQ.trim()}’ 검색 결과`
                : showTop
                  ? '전체 질문'
                  : `${category} 질문`}
              <span className="qna-count">{total}건</span>
            </div>
            <div className="qna-pagesize">
              <span>표시 개수</span>
              {PAGE_SIZES.map((n) => (
                <button
                  key={n}
                  className={`qna-size-btn${pageSize === n ? ' active' : ''}`}
                  onClick={() => {
                    setPageSize(n);
                    setPage(0);
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="qna-list">
            {items.length === 0 && !loading ? (
              <div className="pol-empty">검색 결과가 없습니다.</div>
            ) : (
              items.map((it) => renderRow(it, 'list-'))
            )}
          </div>

          {loading && <div className="qna-loading">불러오는 중…</div>}

          {/* 페이지네이션 */}
          {total > pageSize && (
            <div className="qna-pager">
              <button className="qna-page-btn" disabled={page === 0} onClick={() => goPage(page - 1)}>
                ← 이전
              </button>
              <span className="qna-page-info">
                {start}–{end} / {total}건 · {page + 1} / {totalPages} 페이지
              </span>
              <button
                className="qna-page-btn"
                disabled={page + 1 >= totalPages}
                onClick={() => goPage(page + 1)}
              >
                다음 →
              </button>
            </div>
          )}

          <p className="ep-table-note" style={{ marginTop: 18 }}>
            ※ 실제 보상 상담사례를 쉬운 말로 재구성했으며, 사례 속 인물·상황은 이해를 돕기 위한 가상 예시입니다.
            단순 참고용이며 실제 보상은 약관과 개별 심사 기준을 따릅니다.
          </p>
        </div>
      </div>
    </div>
  );
}
