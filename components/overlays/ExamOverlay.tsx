'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import type {
  MonthSchedule,
  LifeScheduleRow,
  VariableScheduleRow,
} from '@/lib/data/examSchedule';
import Icon from '@/components/Icon';

type Props = {
  open: boolean;
  onClose: () => void;
  lossMonths: MonthSchedule[];
  lifeRows: LifeScheduleRow[];
  variableRows: VariableScheduleRow[];
};
type ScheduleTab = 'loss' | 'life' | 'variable';

// 제3보험 응시 케이스별 안내 (탭)
const THIRD_CASES: { icon: string; label: string; body: ReactNode }[] = [
  {
    icon: '🛡',
    label: '손해보험 응시',
    body: (
      <>
        손해보험 시험 접수 시 <strong>손해보험 + 제3보험</strong>을 함께 신청·응시합니다. 두 과목을 모두 합격해야
        손해보험 설계사로 등록할 수 있습니다.
      </>
    ),
  },
  {
    icon: '💙',
    label: '생명보험 응시',
    body: (
      <>
        생명보험 시험 접수 시 <strong>생명보험 + 제3보험</strong>을 함께 신청·응시합니다. 두 과목을 모두 합격해야
        생명보험 설계사로 등록할 수 있습니다.
      </>
    ),
  },
  {
    icon: '🔁',
    label: '제3보험만 합격',
    body: (
      <>
        손보(또는 생보) 본시험은 떨어지고 <strong>제3보험만 합격</strong>한 경우, 다음 시험에서{' '}
        <strong>손보 또는 생보 본시험만 추가로 합격</strong>하면 등록 요건이 완성됩니다. (제3보험은 다시 보지 않아도
        됩니다.)
      </>
    ),
  },
  {
    icon: '✅',
    label: '본시험만 합격',
    body: (
      <>
        손보(또는 생보) 본시험은 합격했지만 <strong>제3보험에서 떨어진</strong> 경우, 아직 등록할 수 없습니다. 다음
        시험에서 제3보험을 함께 응시해 합격하면 등록 요건이 완성됩니다.
      </>
    ),
  },
];

/** 보험설계사 자격시험 안내 전체화면 오버레이 (에즈금융서비스) */
export default function ExamOverlay({ open, onClose, lossMonths, lifeRows, variableRows }: Props) {
  const [scheduleTab, setScheduleTab] = useState<ScheduleTab>('loss');
  const [lossMonth, setLossMonth] = useState<string>(lossMonths[0]?.key ?? '');
  const [caseTab, setCaseTab] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 스크롤 시 섹션이 뷰포트에 들어오면 부드럽게 등장
  useEffect(() => {
    if (!open) return;
    const root = containerRef.current;
    if (!root) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>('.ep-reveal'));
    if (typeof IntersectionObserver === 'undefined') {
      els.forEach((el) => el.classList.add('in'));
      return;
    }
    els.forEach((el) => el.classList.remove('in'));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [open]);

  return (
    <div className={`page-overlay${open ? ' open' : ''}`}>
      <div className="page-header">
        <div className="page-header-title">
          <Icon name="calendar" /> 보험설계사 자격시험 안내
        </div>
        <button className="page-back" onClick={onClose}>
          ← 돌아가기
        </button>
      </div>
      <div className="page-body exam-page-body">
        <div className="ep-bands" ref={containerRef}>
          <div className="ep-band ep-band--white">
          <div className="ep-inner">
          {/* 필수 자격증 */}
          <div id="ep-exam-info" className="ep-reveal" style={{ marginBottom: 14 }}>
            <div className="ep-process-title">📋 필수 자격증</div>
            <div className="ep-extra-desc" style={{ marginBottom: 0 }}>
              에즈금융서비스는 손해보험·생명보험을 모두 취급하는 보험대리점입니다. 보험사 등록을 위해 갖춰야 할
              자격증을 확인하세요.
            </div>
          </div>

          {/* 준비 순서 안내 */}
          <div
            style={{
              background: '#f4f9ff',
              border: '1px solid rgba(3,101,219,0.12)',
              borderRadius: 14,
              padding: '16px 18px',
              margin: '14px 0 18px',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0254b8', marginBottom: 8 }}>
              🧭 어떤 자격증부터 준비할까요?
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#4e5968', lineHeight: 1.85 }}>
              <li>
                처음 준비한다면 <strong>손해보험 또는 생명보험</strong> 중 하나를 먼저 선택하세요.
              </li>
              <li>
                <strong>제3보험</strong>은 손해보험/생명보험과 함께 응시하는 경우가 많습니다.
              </li>
              <li>
                <strong>변액보험</strong>은 생명보험 자격 취득 이후 준비하는 별도 자격입니다.
              </li>
            </ul>
          </div>

          <div className="ep-cards ep-reveal">
            {/* 손해보험 */}
            <div className="ep-card ep-card--loss">
              <div className="ep-card-header">
                <div className="ep-card-badge">
                  <span className="ep-type-badge loss">손해보험</span>
                  <span className="ep-org">한국손해보험협회 주관</span>
                </div>
                <div className="ep-card-name">손해보험설계사 자격증</div>
                <div className="ep-meta-row">
                  <span className="ep-meta">📄 총 50문항</span>
                  <span className="ep-meta">⏱ 시험시간 50분</span>
                  <span className="ep-meta pass">✅ 합격 60점 이상</span>
                </div>
              </div>
              <div className="ep-card-body">
                <KeyNote text="손해보험 + 제3보험을 함께 응시" />
              </div>
            </div>

            {/* 생명보험 */}
            <div className="ep-card ep-card--life">
              <div className="ep-card-header">
                <div className="ep-card-badge">
                  <span className="ep-type-badge life">생명보험</span>
                  <span className="ep-org">한국생명보험협회 주관</span>
                </div>
                <div className="ep-card-name">생명보험설계사 자격증</div>
                <div className="ep-meta-row">
                  <span className="ep-meta">📄 총 40문항</span>
                  <span className="ep-meta">⏱ 시험시간 50분</span>
                  <span className="ep-meta pass">✅ 합격 60점 이상</span>
                </div>
              </div>
              <div className="ep-card-body">
                <KeyNote text="생명보험 + 제3보험을 함께 응시" />
              </div>
            </div>

            {/* 변액보험 */}
            <div className="ep-card ep-card--var">
              <div className="ep-card-header">
                <div className="ep-card-badge">
                  <span className="ep-type-badge var">변액보험</span>
                  <span className="ep-org">생명보험협회 주관 (별도 자격)</span>
                </div>
                <div className="ep-card-name">변액보험판매관리사 자격증</div>
                <div className="ep-meta-row">
                  <span className="ep-meta">📄 총 40문항</span>
                  <span className="ep-meta">⏱ 시험시간 60분</span>
                  <span className="ep-meta pass">✅ 합격 70점 이상</span>
                  <span className="ep-meta">🖥 IBT(CBT)</span>
                </div>
              </div>
              <div className="ep-card-body">
                <KeyNote text="생명보험 자격 취득 후 응시하는 별도 자격" />
              </div>
            </div>
          </div>

          </div>
          </div>

          <div className="ep-band ep-band--tint">
          <div className="ep-inner">
          {/* 설계사 등록 요건 */}
          <div className="ep-extra ep-reveal" style={{ marginBottom: 0 }}>
            {/* 핵심: 등록 요건이 먼저 */}
            <div
              style={{
                display: 'flex',
                gap: 14,
                alignItems: 'flex-start',
                background: 'linear-gradient(135deg, #eef5ff, #f0f7ff)',
                border: '1px solid #c8dff7',
                borderRadius: 16,
                padding: '20px 22px',
                marginBottom: 18,
              }}
            >
              <span style={{ fontSize: 26, lineHeight: 1, flexShrink: 0 }}>🪪</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0365db', marginBottom: 6 }}>
                  설계사 등록 요건
                </div>
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 800,
                    color: '#0254b8',
                    marginBottom: 8,
                    letterSpacing: '-0.4px',
                    lineHeight: 1.4,
                  }}
                >
                  (손해보험 또는 생명보험) + 제3보험을 모두 합격해야 등록됩니다
                </div>
                <p style={{ fontSize: 13, color: '#35506b', lineHeight: 1.7, margin: 0 }}>
                  제3보험은 단독으로 등록할 수 없어, 손해보험·생명보험과 <strong>함께 응시·합격</strong>해야 합니다.
                </p>
              </div>
            </div>

            {/* 응시 케이스 — 탭으로 확인 */}
            <div style={{ fontSize: 13, fontWeight: 700, color: '#4e5968', marginBottom: 10 }}>
              응시 케이스별 안내
            </div>
            <div className="ep-stype-tabs" style={{ marginBottom: 0 }}>
              {THIRD_CASES.map((c, i) => (
                <button
                  key={c.label}
                  className={`ep-stype-tab${caseTab === i ? ' active' : ''}`}
                  onClick={() => setCaseTab(i)}
                >
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
            <div
              style={{
                background: '#fff',
                border: '1px solid #e5e8eb',
                borderRadius: 14,
                padding: '18px 20px',
                marginTop: 14,
                fontSize: 13.5,
                color: '#4e5968',
                lineHeight: 1.8,
                minHeight: 64,
              }}
            >
              {THIRD_CASES[caseTab].body}
            </div>
          </div>

          </div>
          </div>

          <div className="ep-band ep-band--white">
          <div className="ep-inner">
          {/* 응시 절차 */}
          <div id="ep-process-section" className="ep-process ep-reveal">
            <div className="ep-process-title">🔄 접수부터 등록까지 5단계</div>
            <div className="ep-steps">
              <ProcessStep num="STEP 01" icon="📝" title="시험 접수" desc={['에즈금융서비스에서', '보험사로 신청']} />
              <ProcessStep num="STEP 02" icon="💳" title="수수료 납부" desc={['2만원', '에즈금융서비스 지원']} />
              <ProcessStep num="STEP 03" icon="🖥️" title="시험 응시" desc={['지정 시험장', '신분증 지참']} />
              <ProcessStep num="STEP 04" icon="🏆" title="합격 확인" desc={['생보 당일 20시·손보 익일 06시', '변액은 수일 후 확인']} />
              <ProcessStep num="STEP 05" icon="🪪" title="설계사 등록" desc={['에즈금융서비스에', '등록']} />
            </div>
          </div>

          </div>
          </div>

          <div className="ep-band ep-band--tint">
          <div className="ep-inner">
          {/* 시험 일정 */}
          <div id="ep-schedule-section" className="ep-schedule ep-reveal">
            <div className="ep-schedule-title">📅 자격시험 일정 (현재·예정)</div>
            <div className="ep-stype-tabs">
              <button
                className={`ep-stype-tab${scheduleTab === 'loss' ? ' active' : ''}`}
                onClick={() => setScheduleTab('loss')}
              >
                손해보험설계사
              </button>
              <button
                className={`ep-stype-tab${scheduleTab === 'life' ? ' active' : ''}`}
                onClick={() => setScheduleTab('life')}
              >
                생명보험설계사
              </button>
              <button
                className={`ep-stype-tab${scheduleTab === 'variable' ? ' active' : ''}`}
                onClick={() => setScheduleTab('variable')}
              >
                변액보험 IBT
              </button>
            </div>

            {/* 손해보험 패널 */}
            <div className={`ep-schedule-panel${scheduleTab === 'loss' ? ' active' : ''}`}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                {lossMonths.map((m) => (
                  <button
                    key={m.key}
                    className={`ep-quick-btn${lossMonth === m.key ? ' active' : ''}`}
                    style={{ fontSize: 12, padding: '6px 14px' }}
                    onClick={() => setLossMonth(m.key)}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              {lossMonths.map((m) => (
                <div key={m.key} className={`ep-schedule-panel${lossMonth === m.key ? ' active' : ''}`}>
                  <div className="ep-schedule-table-wrap">
                    <table className="ep-schedule-table">
                      <thead>
                        <tr>
                          <th>차수</th>
                          <th>시험일</th>
                          <th>지역</th>
                          <th>보험사</th>
                        </tr>
                      </thead>
                      <tbody>
                        {m.rows.map((row) => (
                          <tr key={row.round}>
                            <td>{row.round}</td>
                            <td>
                              <span className="ep-date-badge">{row.date}</span>
                            </td>
                            <td>{row.regions}</td>
                            <td>{row.insurers}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
              <p className="ep-table-note">
                ※ 시험장 상황에 따라 일정 변경 가능 | 출처: 손해보험협회(knia.or.kr)
              </p>
            </div>

            {/* 생명보험 패널 — DB 우선(크롤러 자동 수집), 없으면 안내/링크 */}
            <div className={`ep-schedule-panel${scheduleTab === 'life' ? ' active' : ''}`}>
              {lifeRows.length > 0 ? (
                <>
                  <div className="ep-schedule-table-wrap">
                    <table className="ep-schedule-table">
                      <thead>
                        <tr>
                          <th>시험일</th>
                          <th>응시신청기간</th>
                          <th>합격자 발표일</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lifeRows.map((row, i) => (
                          <tr key={i}>
                            <td>
                              <span className="ep-date-badge">{row.date}</span>
                            </td>
                            <td>{row.applyPeriod || '-'}</td>
                            <td>{row.resultDate || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="ep-table-note">
                    ※ 서울 기준 · 출처: 생명보험협회 자격시험센터(exam.insure.or.kr) · 매주 자동 수집
                  </p>
                </>
              ) : (
                <>
                  <div
                    style={{
                      background: '#f0f7ff',
                      border: '1px solid #c8dff7',
                      borderRadius: 12,
                      padding: '18px 20px',
                      marginBottom: 14,
                      fontSize: 13,
                      color: '#35506b',
                      lineHeight: 1.7,
                    }}
                  >
                    ℹ️ 생명보험설계사 시험 일정은 생명보험협회 홈페이지에서 지역별·보험사별로 확인하세요.
                  </div>
                  <a
                    href="https://www.klia.or.kr"
                    target="_blank"
                    rel="noopener"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '10px 20px',
                      background: '#0365db',
                      color: 'white',
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    생명보험협회 시험 일정 확인 →
                  </a>
                </>
              )}
            </div>

            {/* 변액보험 패널 — DB(크롤러) 우선, 없으면 협회 링크 */}
            <div className={`ep-schedule-panel${scheduleTab === 'variable' ? ' active' : ''}`}>
              <div style={{ fontSize: 13, color: '#4e5968', marginBottom: 14, lineHeight: 1.7 }}>
                변액보험 판매자격시험은 <strong>IBT(CBT)</strong> 방식으로 시행됩니다. · 시험시간 60분 · 40문항 ·
                합격기준 70점 이상 · 2026년 연 11회 시행
              </div>

              {variableRows.length > 0 ? (
                <>
                  <div className="ep-schedule-table-wrap">
                    <table className="ep-schedule-table">
                      <thead>
                        <tr>
                          <th>시험일</th>
                          <th>응시신청기간</th>
                          <th>합격자발표일</th>
                        </tr>
                      </thead>
                      <tbody>
                        {variableRows.map((row, i) => (
                          <tr key={i}>
                            <td>
                              <span className="ep-date-badge">{row.date}</span>
                            </td>
                            <td>{row.applyPeriod || '-'}</td>
                            <td>{row.resultDate || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="ep-table-note">
                    ※ 서울 기준 · 출처: 생명보험협회 자격시험센터(exam.insure.or.kr) · 매주 자동 수집
                    <br />※ 지역별 정원(명/차수)·응시수수료는 협회 공고에서 확인하세요
                  </p>
                </>
              ) : (
                <>
                  <div
                    style={{
                      background: '#f0f7ff',
                      border: '1px solid #c8dff7',
                      borderRadius: 12,
                      padding: '18px 20px',
                      marginBottom: 14,
                      fontSize: 13,
                      color: '#35506b',
                      lineHeight: 1.7,
                    }}
                  >
                    ℹ️ 변액보험 IBT 일정은 생명보험협회 자격시험센터에서 지역별로 확인하세요.
                  </div>
                  <a
                    href="https://exam.insure.or.kr/vrb/cbt/schd/list"
                    target="_blank"
                    rel="noopener"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '10px 20px',
                      background: '#0365db',
                      color: 'white',
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    변액보험 IBT 일정 확인 →
                  </a>
                </>
              )}
            </div>
          </div>

          </div>
          </div>

          <div className="ep-band ep-band--blue">
          <div className="ep-inner">
          {/* 에즈금융서비스 안내 */}
          <div id="ep-after-section" className="ep-reveal">
            <div
              style={{
                background: 'linear-gradient(135deg,#0254b8,#0365db)',
                borderRadius: 24,
                padding: '28px 30px',
                color: 'white',
                boxShadow: '0 22px 54px rgba(3,101,219,.16)',
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>💡 에즈금융서비스가 함께라면?</div>
              <p style={{ fontSize: 13.5, opacity: 0.9, marginBottom: 18, lineHeight: 1.6 }}>
                합격 후 설계사 등록부터 첫 계약, 정착까지 — 에즈금융서비스가 함께합니다.
              </p>
              <ul style={{ paddingLeft: 18, fontSize: 13.5, lineHeight: 2, opacity: 0.92 }}>
                <li>설계사 등록 절차 전담 지원</li>
                <li>위촉지원금 및 멘토링 프로그램</li>
                <li>전 보험사 비교 추천 시스템</li>
                <li>고객 분석 도구 및 CRM 플랫폼</li>
              </ul>
            </div>
          </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KeyNote({ text }: { text: string }) {
  return (
    <div
      style={{
        fontSize: 12.5,
        color: '#4e5968',
        borderLeft: '3px solid #d6e4f5',
        padding: '2px 0 2px 12px',
        lineHeight: 1.55,
      }}
    >
      <span style={{ fontWeight: 800, color: '#0254b8', marginRight: 6 }}>핵심 조건</span>
      {text}
    </div>
  );
}

function ProcessStep({ num, icon, title, desc }: { num: string; icon: string; title: string; desc: string[] }) {
  return (
    <div className="ep-step">
      <div className="ep-step-num">{num}</div>
      <div className="ep-step-icon">{icon}</div>
      <div className="ep-step-title">{title}</div>
      <div className="ep-step-desc">
        {desc[0]}
        <br />
        {desc[1]}
      </div>
    </div>
  );
}
