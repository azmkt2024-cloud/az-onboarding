// 시험 일정 DB-우선 리더 (서버 전용).
//   - 손보(loss): 어드민 수동 입력분을 exam_schedules에서 읽음 (없으면 하드코딩 fallback)
//   - 생보(life): 크롤러 수집분을 exam_schedules에서 읽음 (없으면 빈 배열 → UI는 안내/링크 표시)
import 'server-only';
import { createClient } from '@/lib/supabase/server';
import {
  lossSchedule,
  type MonthSchedule,
  type LifeScheduleRow,
  type VariableScheduleRow,
} from './examSchedule';

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];

function toBadge(isoDate: string): string {
  const d = new Date(isoDate);
  return `${d.getMonth() + 1}/${d.getDate()}(${WEEKDAY[d.getDay()]})`;
}

function hasSupabase(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/** 이번 달 1일 ISO — 과거 일정 필터 기준. */
function firstOfThisMonthISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

/** 하드코딩 fallback에서 지난 월 제거 (현재 월 이후만). 비면 전체 유지. */
function upcomingFallback(): MonthSchedule[] {
  const cm = new Date().getMonth() + 1;
  const filtered = lossSchedule.filter((m) => {
    const mn = parseInt(m.label, 10);
    return Number.isNaN(mn) ? true : mn >= cm;
  });
  return filtered.length > 0 ? filtered : lossSchedule;
}

/** 손보 일정 — DB(type='loss') 우선, 없으면 하드코딩 fallback. 과거 월 제외 · 월별 그룹핑. */
export async function getLossSchedule(): Promise<MonthSchedule[]> {
  if (!hasSupabase()) return upcomingFallback();
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('exam_schedules')
      .select('round, exam_date, regions, insurers, month')
      .eq('type', 'loss')
      .gte('exam_date', firstOfThisMonthISO())
      .order('exam_date', { ascending: true });

    if (error || !data || data.length === 0) return upcomingFallback();

    const byMonth = new Map<number, MonthSchedule>();
    for (const r of data) {
      const month = r.month as number;
      if (!byMonth.has(month)) byMonth.set(month, { key: `m${month}`, label: `${month}월`, rows: [] });
      byMonth.get(month)!.rows.push({
        round: (r.round as string) || '',
        date: toBadge(r.exam_date as string),
        regions: Array.isArray(r.regions) ? (r.regions as string[]).join('·') : String(r.regions ?? ''),
        insurers: (r.insurers as string) ?? '',
      });
    }
    return [...byMonth.entries()].sort(([a], [b]) => a - b).map(([, v]) => v);
  } catch {
    return upcomingFallback();
  }
}

/** 생보 일정 — DB(type='life') 우선, 없으면 빈 배열(UI에서 안내/링크 노출). */
export async function getLifeSchedule(): Promise<LifeScheduleRow[]> {
  if (!hasSupabase()) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('exam_schedules')
      .select('exam_date, apply_period, result_date')
      .eq('type', 'life')
      .gte('exam_date', firstOfThisMonthISO())
      .order('exam_date', { ascending: true });

    if (error || !data) return [];
    return data.map((r) => ({
      date: toBadge(r.exam_date as string),
      applyPeriod: (r.apply_period as string) ?? '',
      resultDate: (r.result_date as string) ?? '',
    }));
  } catch {
    return [];
  }
}

/** 변액 IBT 일정 — DB(type='variable') 우선, 없으면 빈 배열(UI에서 안내/링크 노출). */
export async function getVariableSchedule(): Promise<VariableScheduleRow[]> {
  if (!hasSupabase()) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('exam_schedules')
      .select('exam_date, apply_period, result_date')
      .eq('type', 'variable')
      .gte('exam_date', firstOfThisMonthISO())
      .order('exam_date', { ascending: true });

    if (error || !data) return [];
    return data.map((r) => ({
      date: toBadge(r.exam_date as string),
      applyPeriod: (r.apply_period as string) ?? '',
      resultDate: (r.result_date as string) ?? '',
    }));
  } catch {
    return [];
  }
}
