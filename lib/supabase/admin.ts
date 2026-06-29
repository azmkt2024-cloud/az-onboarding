import { createClient } from '@supabase/supabase-js';

/**
 * 서버 전용 관리자 클라이언트 (Service Role Key 사용).
 * RLS를 우회하므로 크롤러 / Cron / 어드민 쓰기 작업 등 신뢰된 서버 코드에서만 사용하세요.
 * 절대 클라이언트 번들에 import하지 마세요.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}
