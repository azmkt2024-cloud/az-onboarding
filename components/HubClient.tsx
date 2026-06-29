'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import Footer from '@/components/Footer';
import Icon from '@/components/Icon';
import ExamOverlay from '@/components/overlays/ExamOverlay';
import PolicyOverlay from '@/components/overlays/PolicyOverlay';
import SummaryOverlay from '@/components/overlays/SummaryOverlay';
import MockExamOverlay from '@/components/overlays/MockExamOverlay';
import LessonOverlay from '@/components/overlays/LessonOverlay';
import InsurerModal from '@/components/modals/InsurerModal';
import ContactModal from '@/components/modals/ContactModal';
import QnaOverlay from '@/components/overlays/QnaOverlay';
import { summaryGuides, summaryOrder, type SummaryType } from '@/lib/data/summary';
import type { MonthSchedule, LifeScheduleRow, VariableScheduleRow } from '@/lib/data/examSchedule';

type Props = {
  lossMonths: MonthSchedule[];
  lifeRows: LifeScheduleRow[];
  variableRows: VariableScheduleRow[];
};

export default function HubClient({ lossMonths, lifeRows, variableRows }: Props) {
  const [examOpen, setExamOpen] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [summaryType, setSummaryType] = useState<SummaryType | null>(null);
  const [mockOpen, setMockOpen] = useState(false);
  const [salesCat, setSalesCat] = useState<'product' | 'skill' | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [insurerOpen, setInsurerOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);

  // 채용 배너: 화면에 들어오면 한 번 슬라이드업으로 등장
  const recruitRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = recruitRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('in');
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          el.classList.add('in');
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const closeAll = useCallback(() => {
    setExamOpen(false);
    setPolicyOpen(false);
    setSummaryType(null);
    setMockOpen(false);
    setSalesCat(null);
    setContactOpen(false);
    setInsurerOpen(false);
    setFaqOpen(false);
  }, []);

  // 오버레이가 열려 있으면 본문 스크롤 잠금 (프로토타입 동작과 동일)
  const anyOverlayOpen =
    examOpen || policyOpen || faqOpen || mockOpen || salesCat !== null || summaryType !== null;
  useEffect(() => {
    document.body.style.overflow = anyOverlayOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [anyOverlayOpen]);

  // ESC 로 모두 닫기
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeAll();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [closeAll]);

  return (
    <>
      <Nav onNavigate={closeAll} />

      <div className="band band--blue">
        <Hero />
      </div>

      {/* ===== STEP 1 · 자격시험 완벽 대비 ===== */}
      <div className="band band--white">
      <section className="section section-stage stage-1" id="exam">
        <div className="section-header">
          <div className="section-title"><Icon name="notice" /> 자격시험 완벽 대비</div>
          <div className="section-desc">
            합격이 최우선 — 자격시험 정보 · 과목별 핵심 요약 · 모의고사로 합격까지 집중 학습
          </div>
        </div>
        <div className="card-grid">
          <div className="card card--featured fade-up" onClick={() => setExamOpen(true)} style={{ cursor: 'pointer' }}>
            <div className="card-icon"><Icon name="calendar" /></div>
            <div className="card-title">설계사 자격시험 정보</div>
            <div className="card-desc">시험일정, 과목, 합격기준, 응시절차 완벽 안내</div>
            <div className="card-tags">
              <span className="card-tag">시험일정</span>
              <span className="card-tag">합격기준</span>
              <span className="card-tag">응시절차</span>
            </div>
            <div className="card-arrow">자세히 보기 →</div>
          </div>
          <div className="card card--featured fade-up" onClick={() => setMockOpen(true)} style={{ cursor: 'pointer' }}>
            <div className="card-icon"><Icon name="book" /></div>
            <div className="card-title">모의고사</div>
            <div className="card-desc">손해·생명·변액보험 연도별 모의고사 · 화면에서 바로 풀기·다운로드</div>
            <div className="card-tags">
              <span className="card-tag">손해보험</span>
              <span className="card-tag">생명보험</span>
              <span className="card-tag">변액보험</span>
            </div>
            <div className="card-arrow">자세히 보기 →</div>
          </div>
        </div>

        {/* 과목별 핵심 요약 (1단계로 통합) */}
        <div className="subsection">
          <div className="subsection-title">
            과목별 핵심 요약
            <span className="section-update-badge">2026 최신 업데이트</span>
          </div>
          <div className="subsection-desc">
            시험 빈출 핵심만 압축한 과목별 요약집 · 클릭하면 전체 페이지를 바로 학습할 수 있어요
          </div>
          <div className="guide-list">
            {summaryOrder.map((t) => {
              const g = summaryGuides[t];
              return (
                <div
                  key={t}
                  className={`guide-card fade-up${g.ready ? '' : ' guide-card--soon'}`}
                  onClick={() => setSummaryType(t)}
                >
                  <div className="guide-num"><Icon name={g.icon} /></div>
                  <div className="guide-text">
                    <div className="guide-title">
                      {g.title}
                      {g.ready ? (
                        <span className="guide-pill guide-pill--new">2026 업데이트</span>
                      ) : (
                        <span className="guide-pill guide-pill--soon">준비중</span>
                      )}
                    </div>
                    <div className="guide-sub">{g.sub}</div>
                  </div>
                  <div className="guide-badge">{g.badge}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      </div>

      {/* ===== STEP 2 · 실전 세일즈 무기 장착 (핵심 차별화) ===== */}
      <div className="band band--tint">
      <section className="section section-stage stage-2" id="sales">
        <div className="section-header">
          <div className="section-title"><Icon name="search" /> 미리 보는 실전 영업</div>
          <div className="section-desc">
            상품 지식 + 세일즈 스킬 — 신입도 현직도 실무에 바로 쓰는 교육 자료
          </div>
        </div>
        <div className="card-grid">
          <div className="card fade-up" onClick={() => setSalesCat('product')} style={{ cursor: 'pointer' }}>
            <div className="card-icon"><Icon name="bell" /></div>
            <div className="card-title">실전 상품 가이드</div>
            <div className="card-desc card-desc--tight">고객 중심으로 정리한 상품 지식 — 교육 자료 5편</div>
            <ul className="card-preview">
              <li>보험의 본질과 설계사의 역할</li>
              <li>암진단비 적정액 · 만기환급금 구조</li>
              <li>갱신·비갱신 · 증권 읽는 법</li>
            </ul>
            <div className="card-arrow">자료 보기 →</div>
          </div>
          <div className="card fade-up" onClick={() => setSalesCat('skill')} style={{ cursor: 'pointer' }}>
            <div className="card-icon"><Icon name="chat" /></div>
            <div className="card-title">세일즈 스킬 교육</div>
            <div className="card-desc card-desc--tight">상담부터 클로징까지, 현장 화법 — 교육 자료 4편</div>
            <ul className="card-preview">
              <li>첫 상담 오프닝 · 보장분석 권유 화법</li>
              <li>거절 극복 화법 ("보험 많아요" 등)</li>
              <li>결정을 돕는 클로징 한마디</li>
            </ul>
            <div className="card-arrow">자료 보기 →</div>
          </div>
        </div>

        <div className="recruit-banner" ref={recruitRef}>
          <div className="recruit-banner-text">
            <div className="recruit-banner-title">에즈금융서비스와 함께 성장하고 싶다면</div>
            <div className="recruit-banner-sub">
              무경력도 괜찮습니다. 체계적인 교육과 현장 지원이 준비돼 있어요.
            </div>
          </div>
          <button className="recruit-banner-btn" onClick={() => setContactOpen(true)}>
            입사 문의하기 <span className="arrow">→</span>
          </button>
        </div>
      </section>
      </div>

      {/* ===== STEP 3 · 현장 실무 지원 도구 ===== */}
      <div className="band band--white">
      <section className="section section-stage stage-3" id="tools">
        <div className="section-header">
          <div className="section-title"><Icon name="check" /> 현장 실무 지원 도구</div>
          <div className="section-desc">
            업무 중 막힐 때 즉시 찾는 실무 레퍼런스 — 전산 · 보장분석 · 보상 Q&amp;A
          </div>
        </div>
        <div className="card-grid">
          <div className="card fade-up" onClick={() => setPolicyOpen(true)} style={{ cursor: 'pointer' }}>
            <div className="card-icon"><Icon name="phone" /></div>
            <div className="card-title">보험사 전산 바로가기</div>
            <div className="card-desc">
              손해, 생명보험사 영업포탈 바로가기, 고객센터, 청구팩스, 약관 링크 연결 한눈에 정리
            </div>
            <div className="card-tags">
              <span className="card-tag">영업포탈</span>
              <span className="card-tag">약관</span>
              <span className="card-tag">청구팩스</span>
            </div>
            <div className="card-arrow">바로가기 →</div>
          </div>
          <div className="card fade-up" onClick={() => setInsurerOpen(true)} style={{ cursor: 'pointer' }}>
            <div className="card-icon"><Icon name="key" /></div>
            <div className="card-title">보험사 보장분석 동의</div>
            <div className="card-desc">한화손보, KB손보, DB손보 보장분석 동의방법과 연결</div>
            <div className="card-tags">
              <span className="card-tag">한화손보</span>
              <span className="card-tag">KB손보</span>
              <span className="card-tag">DB손보</span>
            </div>
            <div className="card-arrow">바로가기 →</div>
          </div>
          <div className="card fade-up" id="faq" onClick={() => setFaqOpen(true)} style={{ cursor: 'pointer' }}>
            <div className="card-icon"><Icon name="lightbulb" /></div>
            <div className="card-title">보상 Q&amp;A</div>
            <div className="card-desc">지급기준, 언더라이팅, 배상책임 자주 묻는 실무 질문 모음</div>
            <div className="card-tags">
              <span className="card-tag">지급기준</span>
              <span className="card-tag">언더라이팅</span>
              <span className="card-tag">배상책임</span>
            </div>
            <div className="card-arrow">바로가기 →</div>
          </div>
        </div>
      </section>
      </div>

      <Footer />

      {/* 오버레이 / 모달 */}
      <ExamOverlay
        open={examOpen}
        onClose={() => setExamOpen(false)}
        lossMonths={lossMonths}
        lifeRows={lifeRows}
        variableRows={variableRows}
      />
      <PolicyOverlay open={policyOpen} onClose={() => setPolicyOpen(false)} />
      <SummaryOverlay type="fire" open={summaryType === 'fire'} onClose={() => setSummaryType(null)} />
      <SummaryOverlay type="life" open={summaryType === 'life'} onClose={() => setSummaryType(null)} />
      <SummaryOverlay type="variable" open={summaryType === 'variable'} onClose={() => setSummaryType(null)} />
      <MockExamOverlay
        open={mockOpen}
        onClose={() => setMockOpen(false)}
        onOpenSummary={(t) => {
          setMockOpen(false);
          setSummaryType(t);
        }}
      />
      <LessonOverlay open={salesCat !== null} cat={salesCat} onClose={() => setSalesCat(null)} />
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
      <InsurerModal open={insurerOpen} onClose={() => setInsurerOpen(false)} />
      <QnaOverlay open={faqOpen} onClose={() => setFaqOpen(false)} />
    </>
  );
}
