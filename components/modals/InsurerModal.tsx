'use client';

import { consentInsurers } from '@/lib/data/insurers';
import Icon from '@/components/Icon';

type Props = { open: boolean; onClose: () => void };

/** 보험사 보장분석 동의 모달 (한화·KB·DB) */
export default function InsurerModal({ open, onClose }: Props) {
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
        <h3><Icon name="key" /> 보험사 보장분석 동의</h3>
        <p className="modal-sub">한화손보, KB손보, DB손보 보장분석 동의방법 및 연결 링크</p>
        <div className="insurer-list">
          {consentInsurers.map((ins) => (
            <div className="insurer-item" key={ins.name}>
              <div className="insurer-item-left">
                <div className="insurer-item-icon">{ins.icon}</div>
                <div>
                  <div className="insurer-item-name">{ins.name}</div>
                  <div className="insurer-item-desc">{ins.desc}</div>
                </div>
              </div>
              <a className="insurer-item-btn" href={ins.url} target="_blank" rel="noopener">
                연결 →
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
