'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError('로그인 실패: 이메일 또는 비밀번호를 확인하세요.');
      return;
    }
    router.replace('/admin');
    router.refresh();
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg, #f5f7fa)',
        padding: 24,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: 380,
          background: '#fff',
          border: '1px solid #edf0f3',
          borderRadius: 20,
          padding: 32,
          boxShadow: '0 10px 30px rgba(3,101,219,.08)',
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 800, color: '#0365db', marginBottom: 4 }}>
          에즈금융서비스 <span style={{ color: '#191f28' }}>어드민</span>
        </div>
        <p style={{ fontSize: 13, color: '#8b95a1', marginBottom: 22 }}>관리자 계정으로 로그인하세요.</p>

        <label style={labelStyle}>이메일</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          style={inputStyle}
        />

        <label style={labelStyle}>비밀번호</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          style={inputStyle}
        />

        {error && <div style={{ color: '#e8603f', fontSize: 13, marginBottom: 12 }}>{error}</div>}

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? '로그인 중…' : '로그인'}
        </button>
      </form>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 700,
  color: '#4e5968',
  marginBottom: 6,
};
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 12,
  border: '1px solid #e3e7ec',
  fontSize: 14,
  marginBottom: 16,
  fontFamily: 'inherit',
};
const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 12,
  border: 'none',
  background: '#0365db',
  color: '#fff',
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
};
