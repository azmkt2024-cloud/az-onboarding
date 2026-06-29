import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import LogoutButton from '@/components/admin/LogoutButton';

export const dynamic = 'force-dynamic';

const NAV = [
  { href: '/admin', label: '대시보드', icon: '🏠' },
  { href: '/admin/exam-schedule', label: '손보 시험일정', icon: '📅' },
];

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const isAdmin = profile?.role === 'admin';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f7fa' }}>
      <aside
        style={{
          width: 240,
          flexShrink: 0,
          background: '#fff',
          borderRight: '1px solid #edf0f3',
          padding: '22px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 800, color: '#0365db', padding: '4px 10px 16px' }}>
          에즈금융서비스 <span style={{ color: '#191f28' }}>어드민</span>
        </div>
        {isAdmin &&
          NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '11px 12px',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                color: '#4e5968',
                textDecoration: 'none',
              }}
            >
              <span>{n.icon}</span> {n.label}
            </Link>
          ))}
        <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #edf0f3' }}>
          <div style={{ fontSize: 12, color: '#8b95a1', padding: '0 4px 10px', wordBreak: 'break-all' }}>
            {user.email}
          </div>
          <LogoutButton />
        </div>
      </aside>

      <main style={{ flex: 1, padding: '36px 32px', maxWidth: 1000 }}>
        {isAdmin ? (
          children
        ) : (
          <div
            style={{
              background: '#fff',
              border: '1px solid #edf0f3',
              borderRadius: 16,
              padding: 28,
            }}
          >
            <h1 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>접근 권한이 없습니다</h1>
            <p style={{ fontSize: 14, color: '#4e5968', lineHeight: 1.7 }}>
              이 계정(<strong>{user.email}</strong>)에는 관리자 권한이 없습니다.
              <br />
              Supabase <code>profiles</code> 테이블에서 해당 사용자의 <code>role</code>을 <code>admin</code>으로
              설정해 주세요.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
