import { createClient } from '@/lib/supabase/server';
import LossScheduleManager, { type AdminLossRow } from '@/components/admin/LossScheduleManager';

export const dynamic = 'force-dynamic';

export default async function AdminExamSchedulePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('exam_schedules')
    .select('id, round, exam_date, regions, insurers')
    .eq('type', 'loss')
    .order('exam_date', { ascending: true });

  const rows: AdminLossRow[] = (data ?? []).map((r) => ({
    id: r.id as string,
    round: (r.round as string) ?? '',
    exam_date: r.exam_date as string,
    regions: Array.isArray(r.regions) ? (r.regions as string[]).join('·') : String(r.regions ?? ''),
    insurers: (r.insurers as string) ?? '',
  }));

  return <LossScheduleManager initialRows={rows} />;
}
