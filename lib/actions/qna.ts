'use server';

import { createClient } from '@/lib/supabase/server';
import { compensationQna } from '@/lib/data/compensationQnaEasy';
import type { QnaResult } from '@/lib/data/qnaTypes';

// Supabase 미연결 환경에서도 동작하도록 정적 데이터(crawl) fallback을 둡니다.
const STATIC: QnaResult[] = compensationQna.map((i) => ({
  id: String(i.id),
  category: i.category,
  question: i.question,
  answer: i.answer,
  viewCount: 0,
}));

function hasSupabase(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

// PostgREST or-filter / ILIKE 안전화 (필터 구문 깨짐 방지)
function safeTerm(q: string): string {
  return q.replace(/[,%()*]/g, ' ').trim();
}

type Row = { id: string; category: string; question: string; answer: string; view_count: number | null };
function mapRow(r: Row): QnaResult {
  return { id: String(r.id), category: r.category, question: r.question, answer: r.answer, viewCount: r.view_count ?? 0 };
}

/** 키워드 + 카테고리 검색 (limit개씩 페이지네이션). 한국어는 부분일치(ILIKE, trigram 가속). */
export async function searchQna(params: {
  q: string;
  category: string;
  offset: number;
  limit: number;
}): Promise<{ items: QnaResult[]; hasMore: boolean; total: number }> {
  const { q, category, offset, limit } = params;
  const term = safeTerm(q);

  if (hasSupabase()) {
    try {
      const supabase = await createClient();
      let query = supabase
        .from('qna_items')
        .select('id, category, question, answer, view_count', { count: 'exact' })
        .eq('is_active', true);
      if (category && category !== '전체') query = query.eq('category', category);
      if (term) query = query.or(`question.ilike.%${term}%,answer.ilike.%${term}%`);
      query = query.order('sort_order', { ascending: true }).range(offset, offset + limit - 1);
      const { data, count, error } = await query;
      if (!error && data) {
        const items = (data as Row[]).map(mapRow);
        return { items, hasMore: offset + items.length < (count ?? 0), total: count ?? items.length };
      }
    } catch {
      // fall through to static
    }
  }

  const list = STATIC.filter(
    (i) =>
      (category === '전체' || i.category === category) &&
      (!term || i.question.includes(term) || i.answer.includes(term))
  );
  const items = list.slice(offset, offset + limit);
  return { items, hasMore: offset + items.length < list.length, total: list.length };
}

/** 자주 찾는 질문 TOP N (조회수 내림차순). */
export async function getTopQna(limit = 10): Promise<QnaResult[]> {
  if (hasSupabase()) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('qna_items')
        .select('id, category, question, answer, view_count')
        .eq('is_active', true)
        .order('view_count', { ascending: false })
        .order('sort_order', { ascending: true })
        .limit(limit);
      if (!error && data) return (data as Row[]).map(mapRow);
    } catch {
      // fall through
    }
  }
  return STATIC.slice(0, limit);
}

/** 연관 질문 — 같은 카테고리 내 조회수 높은 순 N개 (현재 항목 제외). */
export async function getRelatedQna(id: string, category: string, limit = 3): Promise<QnaResult[]> {
  if (hasSupabase()) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('qna_items')
        .select('id, category, question, answer, view_count')
        .eq('is_active', true)
        .eq('category', category)
        .neq('id', id)
        .order('view_count', { ascending: false })
        .limit(limit);
      if (!error && data) return (data as Row[]).map(mapRow);
    } catch {
      // fall through
    }
  }
  return STATIC.filter((i) => i.category === category && i.id !== id).slice(0, limit);
}

/** 조회수 +1 (Supabase RPC). 미연결 시 no-op. */
export async function incrementQnaView(id: string): Promise<void> {
  if (!hasSupabase()) return;
  try {
    const supabase = await createClient();
    await supabase.rpc('increment_qna_view', { item_id: id });
  } catch {
    // 조회수 실패는 무시 (UX에 영향 없음)
  }
}
