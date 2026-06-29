'use client';

import { useEffect, useRef, useState } from 'react';
import { lessons, type Slide } from '@/lib/data/lessons';
import Icon from '@/components/Icon';

type Props = {
  open: boolean;
  cat: 'product' | 'skill' | null;
  onClose: () => void;
};

/** STEP 2 교육 자료 — 목록 → 스크롤형 레슨(깊은 본문). 게이트/CTA 없음 */
export default function LessonOverlay({ open, cat, onClose }: Props) {
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const overlayRef = useRef<HTMLDivElement>(null);

  const list = lessons.filter((l) => l.cat === cat);
  const lesson = list.find((l) => l.id === lessonId) ?? null;

  // 스크롤 맨 위로 + 읽기 진행바 + 문단 스크롤 등장 (레슨/목록 전환마다 재설정)
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    overlay.scrollTop = 0;
    setProgress(0);

    const onScroll = () => {
      const max = overlay.scrollHeight - overlay.clientHeight;
      setProgress(max > 12 ? Math.min(100, (overlay.scrollTop / max) * 100) : 0);
    };
    overlay.addEventListener('scroll', onScroll, { passive: true });

    let io: IntersectionObserver | undefined;
    if (lessonId) {
      const blocks = Array.from(overlay.querySelectorAll<HTMLElement>('.lesson-blocks > *'));
      if (typeof IntersectionObserver !== 'undefined') {
        io = new IntersectionObserver(
          (entries, obs) => {
            entries.forEach((e) => {
              if (e.isIntersecting) {
                e.target.classList.add('in');
                obs.unobserve(e.target);
              }
            });
          },
          { root: overlay, rootMargin: '0px 0px -6% 0px', threshold: 0.04 },
        );
        blocks.forEach((b) => io!.observe(b));
      } else {
        blocks.forEach((b) => b.classList.add('in'));
      }
    }
    return () => {
      overlay.removeEventListener('scroll', onScroll);
      io?.disconnect();
    };
  }, [lessonId, open]);

  function handleClose() {
    setLessonId(null);
    onClose();
  }

  const headTitle = cat === 'product' ? '실전 상품 가이드' : '세일즈 스킬 교육';
  const headIcon = cat === 'product' ? 'bell' : 'chat';

  return (
    <div className={`page-overlay lesson-overlay${open ? ' open' : ''}`} ref={overlayRef}>
      <div className="page-header">
        <div className="page-header-title">
          {lesson ? <span>{lesson.icon}</span> : <Icon name={headIcon} />}
          {lesson ? lesson.title : headTitle}
        </div>
        <button className="page-back" onClick={lesson ? () => setLessonId(null) : handleClose}>
          ← {lesson ? '목록으로' : '돌아가기'}
        </button>
      </div>

      {lesson && (
        <div className="lesson-progress" aria-hidden="true">
          <div className="lesson-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="page-body">
        {!lesson ? (
          <div className="lesson-list-wrap">
            <div className="section-title"><Icon name={headIcon} /> {headTitle}</div>
            <div className="section-desc">
              {cat === 'product'
                ? '현장에서 자주 받는 질문들을, 교육 담당자가 신입에게 말하듯 풀어 썼어요.'
                : '상담하다 막힐 때 꺼내 보는 이야기들이에요. 편하게 읽어보세요.'}
            </div>
            {cat === 'skill' && (
              <div className="lesson-draft-note">
                아직 회사 검수 전 초안이에요. 정답이라기보단 한 사람의 경험담으로 봐주세요.
              </div>
            )}
            <div className="guide-list">
              {list.map((l) => (
                <div key={l.id} className="guide-card fade-up" onClick={() => setLessonId(l.id)}>
                  <div className="guide-num">{l.icon}</div>
                  <div className="guide-text">
                    <div className="guide-title">
                      {l.title}
                      {l.draft && <span className="guide-pill guide-pill--soon">초안</span>}
                    </div>
                    <div className="guide-sub">{l.subtitle}</div>
                  </div>
                  <div className="guide-badge">{l.readMin}분</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <article className="lesson">
            <header className="lesson-head">
              <div className="lesson-head-meta">읽는 데 약 {lesson.readMin}분</div>
              <h1 className="lesson-head-title">{lesson.title}</h1>
              <p className="lesson-head-sub">{lesson.subtitle}</p>
            </header>

            <div className="lesson-blocks">
              {lesson.slides.map((s, i) => (
                <SlideView key={i} slide={s} index={i} />
              ))}
            </div>

            <div className="lesson-footer">
              <button className="lesson-back-btn" onClick={() => setLessonId(null)}>
                ← 다른 자료 보기
              </button>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}

function SlideView({ slide: s, index }: { slide: Slide; index: number }) {
  const accent = s.accent ?? 'blue';
  return (
    <section className="slide-block">
      <div className={`deck-slide deck-slide--${accent}`}>
        <span className="deck-slide-no">{String(index + 1).padStart(2, '0')}</span>
        <h3 className="deck-slide-title">{s.title}</h3>

        {s.lead && <p className="deck-slide-lead">{s.lead}</p>}

        {s.bullets && (
          <ul className="deck-slide-bullets">
            {s.bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        )}

        {s.stats && (
          <div className="deck-slide-stats">
            {s.stats.map((r, i) => (
              <div key={i} className="deck-slide-stat">
                <span className="deck-slide-stat-label">{r.label}</span>
                <span className="deck-slide-stat-value">{r.value}</span>
              </div>
            ))}
          </div>
        )}

        {s.table && (
          <table className="deck-slide-table">
            <thead>
              <tr>
                {s.table.head.map((h, i) => (
                  <th key={i}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {s.table.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((c, j) => (
                    <td key={j}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {s.statsSrc && <div className="deck-slide-src">{s.statsSrc}</div>}
      </div>

      <p className="deck-note">
        <span className="deck-note-tag">설명</span>
        {s.note}
      </p>
    </section>
  );
}
