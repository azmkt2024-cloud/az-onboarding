'use client';

import { useState } from 'react';
import { faqItems } from '@/lib/data/faq';

type Props = { open: boolean; onClose: () => void };

/** 보상 Q&A 모달 */
export default function FaqModal({ open, onClose }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div
      className={`modal-overlay${open ? ' open' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box">
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>
        <h3>💬 보상 Q&amp;A</h3>
        <p className="modal-sub">지급기준, 언더라이팅, 배상책임 자주 묻는 실무 질문 모음</p>
        <div className="faq-modal-list">
          {faqItems.map((item, i) => {
            const isOpen = openIdx === i;
            return (
              <div className={`faq-modal-item${isOpen ? ' open' : ''}`} key={i}>
                <button
                  className="faq-modal-trigger"
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                >
                  <span className="faq-modal-cat">{item.category}</span>
                  <span className="faq-modal-q">{item.question}</span>
                  <span className="faq-modal-chevron">{isOpen ? '×' : '+'}</span>
                </button>
                <div className="faq-modal-body">{item.answer}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
