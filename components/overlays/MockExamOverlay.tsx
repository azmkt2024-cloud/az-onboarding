'use client';

import { useEffect, useState } from 'react';
import { mockExams, mockSubjectOrder, type MockExamItem, type MockSubject } from '@/lib/data/mockExams';
import { summaryGuides, type SummaryType } from '@/lib/data/summary';
import { loadCompleted, saveCompleted } from '@/lib/mockProgress';
import { getAnswerKey } from '@/lib/data/answerKeys';
import Icon from '@/components/Icon';

type Props = {
  open: boolean;
  onClose: () => void;
  onOpenSummary?: (type: SummaryType) => void;
};

type Selected = { item: MockExamItem; subjectTitle: string } | null;
type Order = 'new' | 'old';
type Mark = number | 'O' | 'X';
type GradeResult = {
  correct: number;
  total: number;
  wrong: { q: number; mine: Mark | ''; answer: Mark }[];
};

const monthOf = (label: string) => parseInt(label, 10) || 0;
const roundOf = (label: string) => {
  const m = label.match(/(\d+)\s*회/);
  return m ? parseInt(m[1], 10) : 0;
};

function latestYearOf(subject: MockSubject): number {
  const ys = mockExams[subject].exams.map((e) => e.year);
  return ys.length ? Math.max(...ys) : 0;
}

/** 모의고사 — 과목 탭 + 필터 + 연도 아코디언 + 완료 추적 + PDF 뷰어 + 온라인 답안지/채점 */
export default function MockExamOverlay({ open, onClose, onOpenSummary }: Props) {
  const [selected, setSelected] = useState<Selected>(null);
  const [activeSubject, setActiveSubject] = useState<MockSubject>('fire');
  const [openYears, setOpenYears] = useState<Set<number>>(() => new Set([latestYearOf('fire')]));
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [order, setOrder] = useState<Order>('new');
  const [unsolvedOnly, setUnsolvedOnly] = useState(false);

  // 답안지/채점 상태
  const [sheetOpen, setSheetOpen] = useState(false);
  const [marks, setMarks] = useState<Record<number, Mark>>({});
  const [graded, setGraded] = useState<GradeResult | null>(null);

  useEffect(() => {
    setCompleted(loadCompleted());
  }, []);

  // 회차가 바뀌면 답안지 초기화
  useEffect(() => {
    setSheetOpen(false);
    setMarks({});
    setGraded(null);
  }, [selected]);

  function handleClose() {
    setSelected(null);
    onClose();
  }

  function switchSubject(s: MockSubject) {
    setActiveSubject(s);
    setOpenYears(new Set([latestYearOf(s)]));
  }

  function toggleYear(y: number) {
    setOpenYears((prev) => {
      const next = new Set(prev);
      if (next.has(y)) next.delete(y);
      else next.add(y);
      return next;
    });
  }

  function toggleCompleted(file: string) {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(file)) next.delete(file);
      else next.add(file);
      saveCompleted(next);
      return next;
    });
  }

  function markDone(file: string) {
    setCompleted((prev) => {
      if (prev.has(file)) return prev;
      const next = new Set(prev);
      next.add(file);
      saveCompleted(next);
      return next;
    });
  }

  const group = mockExams[activeSubject];

  const latestYear = Math.max(0, ...group.exams.map((e) => e.year));
  const latestYearExams = group.exams.filter((e) => e.year === latestYear);
  const latestMonth = latestYearExams.length ? Math.max(...latestYearExams.map((e) => monthOf(e.label))) : 0;
  const isNew = (e: MockExamItem) => e.year === latestYear && monthOf(e.label) === latestMonth;

  const q = query.trim();
  const filtering = q !== '' || unsolvedOnly;
  const cmp = (a: MockExamItem, b: MockExamItem) => {
    const d = order === 'new' ? -1 : 1;
    return d * (a.year - b.year) || d * (monthOf(a.label) - monthOf(b.label)) || d * (roundOf(a.label) - roundOf(b.label));
  };
  const visible = group.exams
    .filter((e) => {
      if (unsolvedOnly && completed.has(e.file)) return false;
      if (q && !`${e.year}년 ${e.label}`.includes(q)) return false;
      return true;
    })
    .sort(cmp);

  const yearOrder: number[] = [];
  const byYear = new Map<number, MockExamItem[]>();
  for (const e of visible) {
    if (!byYear.has(e.year)) {
      byYear.set(e.year, []);
      yearOrder.push(e.year);
    }
    byYear.get(e.year)!.push(e);
  }

  const completedCount = group.exams.filter((e) => completed.has(e.file)).length;
  const summary = summaryGuides[activeSubject];
  const isDone = selected ? completed.has(selected.item.file) : false;
  const answerKey = selected ? getAnswerKey(selected.item.file) : null;

  function grade() {
    if (!answerKey || !selected) return;
    const wrong: GradeResult['wrong'] = [];
    let correct = 0;
    answerKey.forEach((ans, i) => {
      const num = i + 1;
      const mine = marks[num];
      if (mine === ans) correct++;
      else wrong.push({ q: num, mine: mine ?? '', answer: ans });
    });
    setGraded({ correct, total: answerKey.length, wrong });
    markDone(selected.item.file);
  }

  return (
    <div className={`page-overlay${open ? ' open' : ''}`}>
      <div className="page-header">
        <div className="page-header-title">
          <Icon name="book" />
          {selected ? `${selected.subjectTitle} · ${selected.item.label}` : '모의고사'}
        </div>
        {selected ? (
          <button className="page-back" onClick={() => setSelected(null)}>
            ← 목록으로
          </button>
        ) : (
          <button className="page-back" onClick={handleClose}>
            ← 돌아가기
          </button>
        )}
      </div>

      {selected ? (
        <>
          <div className="mock-toolbar">
            <a className="mock-tool-btn" href={selected.item.file} download>
              ⬇ 다운로드
            </a>
            <a className="mock-tool-btn" href={selected.item.file} target="_blank" rel="noopener">
              🖨 인쇄 (새 탭)
            </a>
            {answerKey && (
              <button
                className={`mock-tool-btn${sheetOpen ? ' mock-tool-btn--on' : ''}`}
                onClick={() => setSheetOpen((v) => !v)}
              >
                ✍ {sheetOpen ? '답안지 닫기' : '답안지·채점'}
              </button>
            )}
            <button
              className={`mock-tool-btn${isDone ? ' mock-tool-btn--done' : ''}`}
              onClick={() => toggleCompleted(selected.item.file)}
            >
              {isDone ? '✓ 완료됨' : '완료로 표시'}
            </button>
            {!answerKey && (
              <span className="mock-noscore">
                📄 스캔본 회차 — 화면 채점 미지원. 다운로드·인쇄해서 풀고 마지막 페이지에서 정답을 확인하세요.
              </span>
            )}
          </div>

          <div className={`mock-viewer${sheetOpen && answerKey ? ' mock-viewer--split' : ''}`}>
            <div className="summary-frame-wrap">
              {open && (
                <iframe
                  className="summary-frame"
                  src={`${selected.item.file}#toolbar=0&navpanes=0&statusbar=0`}
                  title={`${selected.subjectTitle} ${selected.item.label}`}
                />
              )}
            </div>

            {sheetOpen && answerKey && (
              <div className="mock-sheet">
                {!graded ? (
                  <>
                    <div className="mock-sheet-head">답안지 · {answerKey.length}문항</div>
                    <div className="mock-sheet-grid">
                      {answerKey.map((ans, i) => {
                        const num = i + 1;
                        const isOX = ans === 'O' || ans === 'X';
                        const opts: Mark[] = isOX ? ['O', 'X'] : [1, 2, 3, 4, 5];
                        return (
                          <div key={num} className="mock-sheet-row">
                            <span className="mock-sheet-qn">{num}</span>
                            {opts.map((c) => (
                              <button
                                key={c}
                                className={`mock-bubble${marks[num] === c ? ' mock-bubble--on' : ''}${
                                  isOX ? ' mock-bubble--ox' : ''
                                }`}
                                onClick={() => setMarks((m) => ({ ...m, [num]: c }))}
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                    <button className="mock-sheet-submit" onClick={grade}>
                      채점하기
                    </button>
                  </>
                ) : (
                  <div className="mock-result">
                    <div className="mock-result-score">
                      {graded.correct}
                      <span> / {graded.total}</span>
                    </div>
                    <div className="mock-result-pct">정답률 {Math.round((graded.correct / graded.total) * 100)}%</div>
                    {graded.wrong.length > 0 ? (
                      <div className="mock-result-wrong">
                        <div className="mock-result-wrong-head">틀린 문항 {graded.wrong.length}개</div>
                        {graded.wrong.map((w) => (
                          <div key={w.q} className="mock-result-wrong-row">
                            <b>{w.q}번</b> · 내 답 {w.mine || '–'} → 정답 <b className="ok">{w.answer}</b>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mock-result-perfect">🎉 만점입니다!</div>
                    )}
                    <button className="mock-sheet-submit" onClick={() => setGraded(null)}>
                      다시 풀기
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="page-body mock-body">
          <div className="section-title"><Icon name="book" /> 연도별 모의고사</div>
          <div className="section-desc">과목을 선택하고 원하는 회차를 클릭하여 바로 시작하세요.</div>

          <div className="mock-tabs">
            {mockSubjectOrder.map((s) => {
              const g = mockExams[s];
              const active = s === activeSubject;
              return (
                <button
                  key={s}
                  className={`mock-tab${active ? ' mock-tab--active' : ''}`}
                  onClick={() => switchSubject(s)}
                >
                  <span className="mock-tab-icon"><Icon name={summaryGuides[s].icon} /></span>
                  <span className="mock-tab-name">{g.badge}</span>
                  <span className="mock-tab-count">{g.exams.length}회</span>
                </button>
              );
            })}
          </div>

          {summary?.ready && onOpenSummary && (
            <button className="mock-summary-cta" onClick={() => onOpenSummary(activeSubject)}>
              <span className="mock-summary-cta-label">💡 시험 전 필수 확인 — {summary.badge} 핵심 요약</span>
              <span className="mock-summary-cta-go">보러가기 →</span>
            </button>
          )}

          <div className="mock-filterbar">
            <input
              className="mock-search"
              placeholder="🔍 회차 검색 (예: 2025, 3월)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="mock-filter-btn" onClick={() => setOrder((o) => (o === 'new' ? 'old' : 'new'))}>
              {order === 'new' ? '최신순 ▼' : '오래된순 ▲'}
            </button>
            <button
              className={`mock-filter-btn${unsolvedOnly ? ' mock-filter-btn--on' : ''}`}
              onClick={() => setUnsolvedOnly((v) => !v)}
            >
              미응시만
            </button>
          </div>
          <div className="mock-progress-line">
            {group.badge} 학습 현황 · 완료 <b>{completedCount}</b> / 전체 {group.exams.length}회차
          </div>

          {yearOrder.length === 0 ? (
            <div className="mock-empty">{filtering ? '조건에 맞는 회차가 없습니다.' : '준비 중'}</div>
          ) : (
            yearOrder.map((year) => {
              const list = byYear.get(year)!;
              const isOpen = filtering ? true : openYears.has(year);
              return (
                <div key={year} className="mock-acc">
                  <button className="mock-acc-head" onClick={() => toggleYear(year)} aria-expanded={isOpen}>
                    <span className="mock-acc-arrow">{isOpen ? '▼' : '▶'}</span>
                    <span className="mock-acc-year">{year}년</span>
                    {year === latestYear && <span className="mock-acc-latest">최신</span>}
                    <span className="mock-acc-count">{list.length}회차</span>
                  </button>
                  {isOpen && (
                    <div className="mock-year-grid">
                      {list.map((e) => {
                        const done = completed.has(e.file);
                        return (
                          <button
                            key={e.file}
                            className={`mock-year-chip${isNew(e) && !done ? ' mock-year-chip--new' : ''}${
                              done ? ' mock-year-chip--done' : ''
                            }`}
                            onClick={() => setSelected({ item: e, subjectTitle: group.title })}
                          >
                            {done && <span className="mock-chip-check">✓</span>}
                            {e.label}
                            {isNew(e) && !done && <span className="mock-new-badge">NEW</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
