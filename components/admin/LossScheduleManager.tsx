'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addLossSchedule, deleteSchedule } from '@/lib/actions/examSchedule';

export type AdminLossRow = {
  id: string;
  round: string;
  exam_date: string;
  regions: string;
  insurers: string;
};

export default function LossScheduleManager({ initialRows }: { initialRows: AdminLossRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function onAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const res = await addLossSchedule(fd);
      setMsg({ ok: res.ok, text: res.message });
      if (res.ok) {
        form.reset();
        router.refresh();
      }
    });
  }

  function onDelete(id: string) {
    startTransition(async () => {
      const res = await deleteSchedule(id);
      setMsg({ ok: res.ok, text: res.message });
      if (res.ok) router.refresh();
    });
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>손보 시험일정 입력</h1>
      <p style={{ fontSize: 14, color: '#8b95a1', marginBottom: 22 }}>
        손해보험 시험 일정을 직접 등록합니다. 등록 즉시 공개 페이지(자격시험 안내 → 시험 일정)에 반영됩니다.
        <br />
        생명보험 일정은 매주 자동 수집되므로 여기서 입력하지 않습니다.
      </p>

      {/* 추가 폼 */}
      <form
        onSubmit={onAdd}
        style={{
          background: '#fff',
          border: '1px solid #edf0f3',
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr)) auto',
          gap: 12,
          alignItems: 'end',
        }}
      >
        <Field label="차수" name="round" placeholder="예: 1차" required />
        <Field label="시험일" name="exam_date" type="date" required />
        <Field label="지역 (· 또는 , 구분)" name="regions" placeholder="서울·대전·부산" />
        <Field label="대상 보험사" name="insurers" placeholder="전 보험사" />
        <button type="submit" disabled={pending} style={primaryBtn}>
          {pending ? '저장 중…' : '추가'}
        </button>
      </form>

      {msg && (
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: msg.ok ? '#0c8a64' : '#e8603f',
            background: msg.ok ? '#e7f8f1' : '#fdeee9',
            border: `1px solid ${msg.ok ? '#bfead9' : '#f6d2c7'}`,
            borderRadius: 10,
            padding: '10px 14px',
            marginBottom: 18,
          }}
        >
          {msg.text}
        </div>
      )}

      {/* 목록 */}
      <div style={{ background: '#fff', border: '1px solid #edf0f3', borderRadius: 16, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f4f9ff' }}>
              <Th>차수</Th>
              <Th>시험일</Th>
              <Th>지역</Th>
              <Th>보험사</Th>
              <Th>관리</Th>
            </tr>
          </thead>
          <tbody>
            {initialRows.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#8b95a1' }}>
                  등록된 손보 일정이 없습니다. 위에서 추가하세요.
                </td>
              </tr>
            ) : (
              initialRows.map((r) => (
                <tr key={r.id} style={{ borderTop: '1px solid #f1f4f7' }}>
                  <Td>{r.round}</Td>
                  <Td>{r.exam_date}</Td>
                  <Td>{r.regions}</Td>
                  <Td>{r.insurers}</Td>
                  <Td>
                    <button onClick={() => onDelete(r.id)} disabled={pending} style={deleteBtn}>
                      삭제
                    </button>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = 'text',
  placeholder,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4e5968', marginBottom: 6 }}>
        {label}
      </span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: 10,
          border: '1px solid #e3e7ec',
          fontSize: 13,
          fontFamily: 'inherit',
        }}
      />
    </label>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{ padding: '11px 14px', textAlign: 'left', color: '#173a5e', fontWeight: 700, fontSize: 12 }}>
      {children}
    </th>
  );
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: '11px 14px', color: '#3f4b5b' }}>{children}</td>;
}

const primaryBtn: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: 10,
  border: 'none',
  background: '#0365db',
  color: '#fff',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
  height: 'fit-content',
};
const deleteBtn: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: '#e8603f',
  background: '#fdeee9',
  border: 'none',
  borderRadius: 8,
  padding: '6px 12px',
  cursor: 'pointer',
};
