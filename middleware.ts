import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Supabase 미설정 환경에서는 통과 (어드민은 Supabase 연결 후 사용)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.next();
  return updateSession(request);
}

export const config = {
  matcher: ['/admin/:path*'],
};
