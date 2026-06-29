// 재작성 청크 조립 + 사실 보존(숫자/분류) 검증 → compensationQnaEasy.ts + seed_qna.sql
import fs from 'node:fs';

// 원본(검증 기준)
const SRC = '키움보상_001-020p_20260606_1110/키움_보상질문_001-020p.json';
const raw = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const STOP = new Set(['이전글', '목록으로', '다음글', '유의사항']);
const DROP = /^(본문 바로가기|보험료비교|전문가 찾기|키움 AI 설계사|보상!키움!|인재채용|간편상담접수|Menu)/;
function parse(item) {
  const lines = (item.답변 || '').split('\n').map((s) => s.trim()).filter((s) => s.length);
  const qi = lines.indexOf('Q');
  if (qi < 0 || qi + 2 >= lines.length) return null;
  const ans = [];
  for (let i = qi + 3; i < lines.length; i++) { if (STOP.has(lines[i])) break; if (DROP.test(lines[i])) continue; ans.push(lines[i]); }
  const answer = ans.join('\n').trim();
  const question = lines[qi + 2], category = lines[qi + 1];
  if (!question || question.length < 4 || !answer) return null;
  return { category, question, answer };
}
let src = raw.map(parse).filter(Boolean);
const seen = new Set();
src = src.filter((p) => (seen.has(p.question) ? false : (seen.add(p.question), true)));
src = src.map((p, i) => ({ id: i + 1, ...p }));
const srcById = new Map(src.map((s) => [s.id, s]));

// 청크 조립
let easy = [];
for (let n = 1; n <= 7; n++) {
  const f = `scripts/_qna_out/chunk_${n}.json`;
  const arr = JSON.parse(fs.readFileSync(f, 'utf8'));
  easy.push(...arr);
}
easy.sort((a, b) => a.id - b.id);

// 검증
const errors = [];
const factWarn = [];
if (easy.length !== src.length) errors.push(`항목 수 불일치: easy=${easy.length}, src=${src.length}`);
const ids = new Set();
const FACT = /\d+\s*(?:종|일|년|개월|%|만원|원|회|세)/g;
for (const e of easy) {
  if (ids.has(e.id)) errors.push(`중복 id: ${e.id}`);
  ids.add(e.id);
  const s = srcById.get(e.id);
  if (!s) { errors.push(`원본에 없는 id: ${e.id}`); continue; }
  if (e.category !== s.category) errors.push(`category 변경 id=${e.id}: ${s.category} → ${e.category}`);
  if (!e.question || !e.answer) errors.push(`빈 내용 id=${e.id}`);
  // 사실(숫자) 보존: 원문 답변의 숫자토큰이 재작성 답변에 남아있는지
  const srcTokens = [...(s.answer.match(FACT) || [])].map((t) => t.replace(/\s/g, ''));
  const eaNorm = (e.answer + ' ' + e.question).replace(/\s/g, '');
  const missing = [...new Set(srcTokens)].filter((t) => !eaNorm.includes(t));
  if (missing.length) factWarn.push({ id: e.id, category: e.category, missing });
}

console.log(`조립: ${easy.length}건`);
console.log(`오류: ${errors.length}건`);
errors.slice(0, 20).forEach((e) => console.log('  ✗', e));
console.log(`숫자토큰 누락 의심(검수 권장): ${factWarn.length}건`);
factWarn.slice(0, 25).forEach((w) => console.log(`  ⚠ id=${w.id}[${w.category}] 누락: ${w.missing.join(', ')}`));
fs.writeFileSync('scripts/_qna_factcheck.json', JSON.stringify(factWarn, null, 2), 'utf8');

if (errors.length) { console.log('\n오류로 인해 데이터 파일 생성 중단.'); process.exit(1); }

// compensationQnaEasy.ts
const header =
  `// 보상 Q&A — 쉬운 말 재작성본 (키움 보상지원센터 1~20p 크롤링 → docs/qna-rewrite-guide.md 기준 재작성)\n` +
  `// 사실(숫자·분류·조건)은 원문 유지, 문체·예시만 가상으로 재구성. 추후 전체분도 동일 형식으로 교체.\n\n` +
  `export type QnaItem = { id: number; category: string; question: string; answer: string };\n\n` +
  `export const QNA_CATEGORIES = ["지급기준", "언더라이팅", "진단비", "수술비", "후유장해", "배상책임"] as const;\n\n` +
  `export const compensationQna: QnaItem[] = `;
fs.writeFileSync('lib/data/compensationQnaEasy.ts', header + JSON.stringify(easy, null, 2) + ';\n', 'utf8');

// seed 재생성 (easy 기준)
const esc = (s) => s.replace(/'/g, "''");
const rows = easy.map((p, i) => `  ('${esc(p.category)}', '${esc(p.question)}', '${esc(p.answer)}', ${i + 1})`).join(',\n');
const sql =
  `-- 보상 Q&A seed (쉬운 말 재작성본, ${easy.length}건)\n` +
  `-- schema.sql 실행 후 이 파일을 실행하세요.\n\ntruncate table qna_items;\n\n` +
  `insert into qna_items (category, question, answer, sort_order) values\n${rows};\n`;
fs.writeFileSync('supabase/seed_qna.sql', sql, 'utf8');
console.log('\n→ lib/data/compensationQnaEasy.ts, supabase/seed_qna.sql 생성 완료');
