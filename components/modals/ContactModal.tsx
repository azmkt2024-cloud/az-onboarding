'use client';

import { useState } from 'react';

type Props = { open: boolean; onClose: () => void };

const INTERESTS = ['신입 설계사 지원', '경력 설계사 지원', '제휴·기타 문의'];

/** 입사 문의 폼 모달 — 카드뉴스 CTA에서 열림. 접수 시 /api/contact 로 저장 */
export default function ContactModal({ open, onClose }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [interest, setInterest] = useState(INTERESTS[0]);
  const [message, setMessage] = useState('');
  const [agree, setAgree] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  function reset() {
    setName('');
    setPhone('');
    setInterest(INTERESTS[0]);
    setMessage('');
    setAgree(false);
    setStatus('idle');
    setError('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'sending') return;
    setError('');
    if (!name.trim() || !phone.trim()) {
      setError('이름과 연락처를 입력해주세요.');
      return;
    }
    if (!agree) {
      setError('개인정보 수집·이용에 동의해주세요.');
      return;
    }
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, interest, message, agree }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus('error');
        setError(data.error || '접수에 실패했습니다. 잠시 후 다시 시도해주세요.');
        return;
      }
      setStatus('done');
    } catch {
      setStatus('error');
      setError('네트워크 오류로 접수에 실패했습니다. 전화로 문의해주세요.');
    }
  }

  return (
    <div
      className={`modal-overlay${open ? ' open' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="modal-box">
        <button className="modal-close" onClick={handleClose}>
          ✕
        </button>

        {status === 'done' ? (
          <div className="contact-done">
            <div className="contact-done-icon">✅</div>
            <h3>문의가 접수되었습니다</h3>
            <p className="modal-sub">
              담당자가 입력하신 연락처로 빠르게 연락드리겠습니다.
              <br />
              급하시면 아래로 바로 연락주셔도 됩니다.
            </p>
            <div className="contact-channels">
              <a className="contact-channel" href="tel:1644-0503">
                📞 1644-0503
              </a>
              <a className="contact-channel" href="mailto:az_ko@azfins.com">
                ✉️ az_ko@azfins.com
              </a>
            </div>
            <button className="contact-submit" onClick={handleClose}>
              닫기
            </button>
          </div>
        ) : (
          <>
            <h3>📩 입사 문의하기</h3>
            <p className="modal-sub">
              무경력도 괜찮습니다. 연락처를 남겨주시면 정규 교육 과정과 함께 담당자가 안내드립니다.
            </p>
            <form className="contact-form" onSubmit={submit}>
              <label className="contact-field">
                <span>
                  이름 <em>*</em>
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="홍길동"
                  autoComplete="name"
                />
              </label>
              <label className="contact-field">
                <span>
                  연락처 <em>*</em>
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010-1234-5678"
                  autoComplete="tel"
                  inputMode="tel"
                />
              </label>
              <label className="contact-field">
                <span>관심 분야</span>
                <select value={interest} onChange={(e) => setInterest(e.target.value)}>
                  {INTERESTS.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </label>
              <label className="contact-field">
                <span>남기실 말씀 (선택)</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="궁금한 점이나 편한 연락 시간 등을 적어주세요."
                  rows={3}
                />
              </label>
              <label className="contact-agree">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                <span>
                  개인정보 수집·이용에 동의합니다. (수집항목: 이름·연락처 / 목적: 입사 상담 / 보유: 상담 완료 후
                  파기)
                </span>
              </label>

              {error && <div className="contact-error">{error}</div>}

              <button type="submit" className="contact-submit" disabled={status === 'sending'}>
                {status === 'sending' ? '접수 중…' : '문의 접수하기'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
