import HubClient from '@/components/HubClient';
import { getLossSchedule, getLifeSchedule, getVariableSchedule } from '@/lib/data/getExamSchedules';

// 메인 허브 — 서버에서 시험 일정을 DB-우선으로 읽어 클라이언트로 전달.
//   손보: 어드민 수동 입력분 / 생보·변액: 크롤러 수집분 (없으면 fallback/링크)
export default async function HomePage() {
  const [lossMonths, lifeRows, variableRows] = await Promise.all([
    getLossSchedule(),
    getLifeSchedule(),
    getVariableSchedule(),
  ]);
  return <HubClient lossMonths={lossMonths} lifeRows={lifeRows} variableRows={variableRows} />;
}
