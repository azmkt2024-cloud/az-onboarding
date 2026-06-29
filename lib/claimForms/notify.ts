// 청구서 동기화 실패 알림 — Resend HTTP API로 이메일 발송.
// 필요한 환경변수:
//   RESEND_API_KEY   : Resend API 키 (없으면 발송 건너뜀, 크론은 정상 동작)
//   CLAIM_ALERT_TO   : 수신 이메일 (기본 insu-balance@naver.com)
//   CLAIM_ALERT_FROM : 발신 (기본 onboarding@resend.dev — Resend 무료 테스트 발신자)
// 참고: onboarding@resend.dev는 "가입한 계정 본인 이메일"로만 발송돼요.
//   → Resend를 insu-balance@naver.com 으로 가입하면 그 주소로 수신 가능.
//   (도메인을 인증하면 임의 주소로도 발송 가능)

export async function sendClaimAlert(
  subject: string,
  html: string,
): Promise<{ sent: boolean; reason?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: false, reason: 'RESEND_API_KEY 미설정' };

  const to = process.env.CLAIM_ALERT_TO || 'insu-balance@naver.com';
  const from = process.env.CLAIM_ALERT_FROM || 'onboarding@resend.dev';

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) {
      const body = await res.text();
      return { sent: false, reason: `Resend ${res.status}: ${body.slice(0, 200)}` };
    }
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: e instanceof Error ? e.message : String(e) };
  }
}
