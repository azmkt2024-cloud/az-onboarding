import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function AdminDashboard() {
  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>대시보드</h1>
      <p style={{ fontSize: 14, color: '#8b95a1', marginBottom: 24 }}>
        에즈금융서비스 온보딩 허브 관리자 콘솔
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 14 }}>
        <Link
          href="/admin/exam-schedule"
          style={{
            display: 'block',
            background: '#fff',
            border: '1px solid #edf0f3',
            borderRadius: 16,
            padding: 22,
            textDecoration: 'none',
            color: 'inherit',
            boxShadow: '0 1px 2px rgba(24,31,41,.04)',
          }}
        >
          <div style={{ fontSize: 26, marginBottom: 10 }}>📅</div>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>손보 시험일정 입력</div>
          <div style={{ fontSize: 13, color: '#8b95a1', lineHeight: 1.5 }}>
            손해보험 시험 일정을 수동으로 등록·관리합니다. (생보는 자동 수집)
          </div>
        </Link>
      </div>
    </div>
  );
}
