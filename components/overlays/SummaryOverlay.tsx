'use client';

import { summaryGuides, type SummaryType } from '@/lib/data/summary';
import Icon from '@/components/Icon';

type Props = { type: SummaryType; open: boolean; onClose: () => void };

/** 자격시험 과목별 핵심 요약 — 과목별 요약집(정적 HTML)을 전체화면으로 띄우는 오버레이 */
export default function SummaryOverlay({ type, open, onClose }: Props) {
  const guide = summaryGuides[type];

  return (
    <div className={`page-overlay${open ? ' open' : ''}`}>
      <div className="page-header">
        <div className="page-header-title">
          <Icon name={guide.icon} /> {guide.title}
          {guide.ready && <span className="summary-update-chip">2026 최신 업데이트</span>}
        </div>
        <button className="page-back" onClick={onClose}>
          ← 돌아가기
        </button>
      </div>

      {guide.ready && guide.file ? (
        <div className="summary-frame-wrap">
          {/* 열렸을 때만 로드 (3개 동시 로딩 방지) */}
          {open && (
            <iframe className="summary-frame" src={guide.file} title={guide.title} loading="lazy" />
          )}
        </div>
      ) : (
        <div className="page-body">
          <div className="summary-soon">
            <div className="summary-soon-icon">🛠️</div>
            <div className="summary-soon-title">{guide.title} 준비 중</div>
            <div className="summary-soon-desc">
              {guide.sub}
              <br />
              요약집을 제작하는 대로 이곳에서 바로 학습할 수 있도록 올라갑니다.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
