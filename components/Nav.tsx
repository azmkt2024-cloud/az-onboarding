'use client';

import { useState } from 'react';

const links = [
  { label: '홈', href: '#top' },
  { label: '자격시험 대비', href: '#exam' },
  { label: '실전 영업', href: '#sales' },
  { label: '실무 도구', href: '#tools' },
];

type Props = { onNavigate?: () => void };

export default function Nav({ onNavigate }: Props) {
  const [open, setOpen] = useState(false);

  function go(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    e.preventDefault();
    setOpen(false);
    onNavigate?.(); // 열려 있던 오버레이/모달을 닫는다

    // 오버레이가 닫히고 스크롤 잠금이 풀린 뒤에 이동
    setTimeout(() => {
      if (href === '#top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 70);
  }

  return (
    <nav>
      <div className="nav-inner">
        <a className="nav-logo" href="#top" onClick={(e) => go(e, '#top')}>
          에즈금융서비스<span> 온보딩 허브</span>
        </a>
        <ul className="nav-links">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} onClick={(e) => go(e, l.href)}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="hamburger" onClick={() => setOpen((v) => !v)}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
      <div className={`mobile-menu${open ? ' open' : ''}`}>
        {links.map((l) => (
          <a key={l.href} href={l.href} onClick={(e) => go(e, l.href)}>
            {l.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
