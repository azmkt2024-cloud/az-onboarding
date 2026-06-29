// 크롤링 결과를 Supabase에 upsert (Service Role, RLS 우회).
import { createAdminClient } from '@/lib/supabase/admin';
import type { ExamScheduleRecord, ScheduleImagePost } from './types';

/** 구조화된 시험 일정 행(KLIA 생보 등)을 exam_schedules에 upsert. */
export async function upsertSchedules(records: ExamScheduleRecord[]): Promise<number> {
  if (records.length === 0) return 0;
  const supabase = createAdminClient();

  const rows = records.map((r) => ({
    type: r.type,
    round: r.round,
    exam_date: r.exam_date,
    regions: r.regions,
    insurers: r.insurers,
    apply_period: r.apply_period,
    result_date: r.result_date,
    year: r.year,
    month: r.month,
    source_url: r.source_url,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('exam_schedules')
    .upsert(rows, { onConflict: 'type,round,exam_date' });
  if (error) throw new Error(`exam_schedules upsert 실패: ${error.message}`);
  return rows.length;
}

/** 이미지로 게시되는 일정(KNIA 손보)의 메타+이미지를 exam_schedule_images에 upsert. */
export async function upsertScheduleImage(post: ScheduleImagePost): Promise<number> {
  const supabase = createAdminClient();
  const { error } = await supabase.from('exam_schedule_images').upsert(
    {
      type: post.type,
      title: post.title,
      detail_url: post.detail_url,
      posted_at: post.posted_at,
      image_data_uri: post.image_data_uri,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'detail_url' }
  );
  if (error) throw new Error(`exam_schedule_images upsert 실패: ${error.message}`);
  return 1;
}
