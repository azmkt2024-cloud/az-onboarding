import { createBrowserClient } from '@supabase/ssr';

/**
 * 브라우저(클라이언트 컴포넌트)용 Supabase 클라이언트.
 * NEXT_PUBLIC_ 환경변수만 사용하므로 클라이언트에 안전하게 노출됩니다.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
