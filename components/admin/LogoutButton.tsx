'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await createClient().auth.signOut();
    router.replace('/admin/login');
    router.refresh();
  }
  return (
    <button
      onClick={logout}
      style={{
        fontSize: 12,
        fontWeight: 700,
        color: '#4e5968',
        background: '#f1f4f7',
        border: 'none',
        borderRadius: 999,
        padding: '7px 14px',
        cursor: 'pointer',
      }}
    >
      로그아웃
    </button>
  );
}
