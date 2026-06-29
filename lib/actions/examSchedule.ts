'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type ActionResult = { ok: boolean; message: string };

/** 손해보험(loss) 시험 일정 1건 수동 추가. RLS 'admin write' 정책으로 보호됨. */
export async function addLossSchedule(formData: FormData): Promise<ActionResult> {
  const round = String(formData.get('round') ?? '').trim();
  const examDate = String(formData.get('exam_date') ?? '').trim(); // YYYY-MM-DD
  const regionsRaw = String(formData.get('regions') ?? '').trim();
  const insurers = String(formData.get('insurers') ?? '').trim() || '전 보험사';

  if (!round || !examDate) {
    return { ok: false, message: '차수와 시험일은 필수입니다.' };
  }
  const d = new Date(examDate);
  if (Number.isNaN(d.getTime())) {
    return { ok: false, message: '시험일 형식이 올바르지 않습니다 (YYYY-MM-DD).' };
  }

  const regions = regionsRaw
    .split(/[·,]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const supabase = await createClient();
  const { error } = await supabase.from('exam_schedules').upsert(
    {
      type: 'loss',
      round,
      exam_date: examDate,
      regions: regions.length > 0 ? regions : ['전국'],
      insurers,
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      source_url: '수동 입력(어드민)',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'type,round,exam_date' }
  );

  if (error) return { ok: false, message: `저장 실패: ${error.message}` };

  revalidatePath('/admin/exam-schedule');
  revalidatePath('/');
  return { ok: true, message: `${round} (${examDate}) 저장 완료` };
}

/** 시험 일정 1건 삭제. */
export async function deleteSchedule(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('exam_schedules').delete().eq('id', id);
  if (error) return { ok: false, message: `삭제 실패: ${error.message}` };
  revalidatePath('/admin/exam-schedule');
  revalidatePath('/');
  return { ok: true, message: '삭제 완료' };
}
