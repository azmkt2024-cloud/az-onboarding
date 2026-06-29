'use client';

import { useState } from 'react';

type Props = {
  title: string;
  bodyHtml: string;
  defaultOpen?: boolean;
};

/** 요점정리 카드 내 아코디언 항목 (acc-item) */
export default function AccordionItem({ title, bodyHtml, defaultOpen = true }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`acc-item${open ? ' open' : ''}`}>
      <button className="acc-trigger" type="button" onClick={() => setOpen((v) => !v)}>
        <span>{title}</span>
        <span className="chevron">+</span>
      </button>
      <div className="acc-body" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
    </div>
  );
}
