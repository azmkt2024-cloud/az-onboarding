// 보상 Q&A 오프라인 대량 재작성 (Anthropic Message Batches API)
//
// 용도: 크롤링 JSON(3,048건 등)을 docs/qna-rewrite-guide.md 기준으로 '쉬운 말 + 가상 예시'로
//       일괄 재작성 → lib/data/compensationQnaEasy.ts + supabase/seed_qna.sql 생성.
//
// 특징:
//   - Message Batches API (비동기·표준가 50%) 로 대량 처리.
//   - 가이드를 system 프롬프트 + prompt caching 으로 고정 → 일관성 + 비용 절감.
//   - 숫자/분류 보존을 자동 검증(누락 의심 항목 리포트).
//
// 사용법:
//   1) 환경변수: ANTHROPIC_API_KEY 설정 (.env.local 또는 셸)
//   2) 미리보기(과금 없음):  node scripts/rewrite_qna_batch.mjs [원본.json]
//   3) 실제 제출:            node scripts/rewrite_qna_batch.mjs [원본.json] --go
//   4) 모델 변경(비용↓):     QNA_MODEL=claude-sonnet-4-6 node scripts/rewrite_qna_batch.mjs ... --go
//
import fs from 'node:fs';
import Anthropic from '@anthropic-ai/sdk';

const SRC = process.argv[2] && !process.argv[2].startsWith('--')
  ? process.argv[2]
  : '키움보상_001-020p_20260606_1110/키움_보상질문_001-020p.json';
const GO = process.argv.includes('--go');
// 기본은 최상위 모델. 3,048건 비용을 줄이려면 QNA_MODEL=claude-sonnet-4-6 또는 claude-haiku-4-5.
const MODEL = process.env.QNA_MODEL || 'claude-opus-4-8';

// ---- 원본 파싱 (크롤 답변 텍스트에서 분류/질문/답변 추출) ----
const STOP = new Set(['이전글', '목록으로', '다음글', '유의사항']);
const DROP = /^(본문 바로가기|보험료비교|전문가 찾기|키움 AI 설계사|보상!키움!|인재채용|간편상담접수|Menu)/;
function parseItem(item) {
  const lines = (item.답변 || '').split('\n').map((s) => s.trim()).filter((s) => s.length);
  const qi = lines.indexOf('Q');
  if (qi < 0 || qi + 2 >= lines.length) return null;
  const ans = [];
  for (let i = qi + 3; i < lines.length; i++) { if (STOP.has(lines[i])) break; if (DROP.test(lines[i])) continue; ans.push(lines[i]); }
  const answer = ans.join('\n').trim();
  const question = lines[qi + 2];
  const category = item.분류 && item.분류.trim() ? item.분류.trim() : lines[qi + 1];
  if (!question || question.length < 4 || !answer) return null;
  return { category, question, answer };
}

const raw = JSON.parse(fs.readFileSync(SRC, 'utf8'));
let items = raw.map(parseItem).filter(Boolean);
const seen = new Set();
items = items.filter((p) => (seen.has(p.question) ? false : (seen.add(p.question), true)));
items = items.map((p, i) => ({ id: i + 1, ...p }));
const byId = new Map(items.map((i) => [i.id, i]));
console.log(`원본 파싱: ${items.length}건 (${SRC})`);

// ---- system 프롬프트(가이드 고정) ----
const GUIDE = fs.readFileSync('docs/qna-rewrite-guide.md', 'utf8');
const SYSTEM = [
  {
    type: 'text',
    text:
      `${GUIDE}\n\n---\n[출력 형식] 아래 원문 Q&A를 위 가이드대로 재작성하라. ` +
      `숫자·분류·기간·금액·조건은 원문 그대로 유지하고, 문체만 쉽게 + 가상 예시 1개. ` +
      `오직 아래 JSON 객체 하나만 출력(설명·코드펜스 금지):\n` +
      `{"question":"쉬운 질문","answer":"쉬운 답변(줄바꿈 \\n, 불릿 • 허용)"}`,
    cache_control: { type: 'ephemeral' }, // 가이드는 전 요청 공통 → 캐싱
  },
];

function buildRequest(it) {
  return {
    custom_id: `q-${it.id}`,
    params: {
      model: MODEL,
      max_tokens: 1500,
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: `분류: ${it.category}\n[원문 질문] ${it.question}\n[원문 답변]\n${it.answer}`,
        },
      ],
    },
  };
}

// ---- dry-run (과금 없음) ----
if (!GO) {
  const sample = buildRequest(items[0]);
  console.log('\n[미리보기] --go 없이 실행됨 (API 호출/과금 없음).');
  console.log(`요청 수: ${items.length} · 모델: ${MODEL}`);
  console.log('샘플 요청(첫 항목):');
  console.log(JSON.stringify({ custom_id: sample.custom_id, params: { ...sample.params, system: '[가이드 system 생략]' } }, null, 2).slice(0, 700));
  console.log('\n실제 제출하려면 끝에 --go 를 붙이세요.');
  process.exit(0);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('✗ ANTHROPIC_API_KEY 환경변수가 없습니다. .env.local 또는 셸에 설정하세요.');
  process.exit(1);
}

const client = new Anthropic();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const main = async () => {
  console.log(`\n배치 생성 중… (${items.length}건, 모델 ${MODEL})`);
  const batch = await client.messages.batches.create({ requests: items.map(buildRequest) });
  console.log(`배치 ID: ${batch.id}`);

  // 폴링
  let b = batch;
  while (b.processing_status !== 'ended') {
    await sleep(20000);
    b = await client.messages.batches.retrieve(batch.id);
    const c = b.request_counts;
    console.log(`상태: ${b.processing_status} | 처리중 ${c.processing} 성공 ${c.succeeded} 실패 ${c.errored}`);
  }

  // 결과 수집
  const easy = [];
  const results = await client.messages.batches.results(batch.id);
  for await (const entry of results) {
    const id = Number(String(entry.custom_id).replace('q-', ''));
    const src = byId.get(id);
    if (!src) continue;
    if (entry.result.type !== 'succeeded') { console.warn(`  ✗ id=${id} ${entry.result.type}`); continue; }
    const text = (entry.result.message.content.find((bl) => bl.type === 'text') || {}).text || '';
    let parsed;
    try {
      const m = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(m ? m[0] : text);
    } catch {
      console.warn(`  ✗ id=${id} JSON 파싱 실패`);
      continue;
    }
    if (!parsed.question || !parsed.answer) { console.warn(`  ✗ id=${id} 빈 내용`); continue; }
    easy.push({ id, category: src.category, question: String(parsed.question).trim(), answer: String(parsed.answer).trim() });
  }
  easy.sort((a, b2) => a.id - b2.id);
  console.log(`\n재작성 완료: ${easy.length}/${items.length}건`);

  // 숫자 보존 검증
  const FACT = /\d+\s*(?:종|일|년|개월|%|만원|원|회|세)/g;
  const factWarn = [];
  for (const e of easy) {
    const s = byId.get(e.id);
    const srcTokens = [...new Set([...(s.answer.match(FACT) || [])].map((t) => t.replace(/\s/g, '')))];
    const norm = (e.answer + ' ' + e.question).replace(/\s/g, '');
    const missing = srcTokens.filter((t) => !norm.includes(t));
    if (missing.length) factWarn.push({ id: e.id, category: e.category, missing });
  }
  fs.writeFileSync('scripts/_qna_factcheck.json', JSON.stringify(factWarn, null, 2), 'utf8');
  console.log(`숫자 누락 의심(검수 권장): ${factWarn.length}건 → scripts/_qna_factcheck.json`);

  // 데이터 파일 + seed 생성
  const header =
    `// 보상 Q&A — 쉬운 말 재작성본 (오프라인 배치, docs/qna-rewrite-guide.md 기준)\n` +
    `// 사실(숫자·분류·조건)은 원문 유지, 문체·예시만 가상으로 재구성.\n\n` +
    `export type QnaItem = { id: number; category: string; question: string; answer: string };\n\n` +
    `export const compensationQna: QnaItem[] = `;
  fs.writeFileSync('lib/data/compensationQnaEasy.ts', header + JSON.stringify(easy, null, 2) + ';\n', 'utf8');

  const esc = (s) => s.replace(/'/g, "''");
  const rows = easy.map((p, i) => `  ('${esc(p.category)}', '${esc(p.question)}', '${esc(p.answer)}', ${i + 1})`).join(',\n');
  const sql =
    `-- 보상 Q&A seed (쉬운 말 재작성본, ${easy.length}건)\n\ntruncate table qna_items;\n\n` +
    `insert into qna_items (category, question, answer, sort_order) values\n${rows};\n`;
  fs.writeFileSync('supabase/seed_qna.sql', sql, 'utf8');
  console.log('→ lib/data/compensationQnaEasy.ts, supabase/seed_qna.sql 생성 완료');
  console.log('※ scripts/_qna_factcheck.json 의 항목만 원문과 대조해 검수하세요.');
};

main().catch((e) => { console.error('배치 실패:', e?.message || e); process.exit(1); });
