// 크롤링 JSON → supabase/seed_qna.sql 생성 (1회용 스크립트)
import fs from 'node:fs';

const SRC = '키움보상_001-020p_20260606_1110/키움_보상질문_001-020p.json';
const data = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const STOP = new Set(['이전글', '목록으로', '다음글', '유의사항']);
const DROP = /^(본문 바로가기|보험료비교|전문가 찾기|키움 AI 설계사|보상!키움!|인재채용|간편상담접수|Menu)/;

function parse(item) {
  const lines = (item.답변 || '').split('\n').map((s) => s.trim()).filter((s) => s.length);
  const qi = lines.indexOf('Q');
  if (qi < 0 || qi + 2 >= lines.length) return null;
  const category = lines[qi + 1];
  const question = lines[qi + 2];
  const ans = [];
  for (let i = qi + 3; i < lines.length; i++) {
    if (STOP.has(lines[i])) break;
    if (DROP.test(lines[i])) continue;
    ans.push(lines[i]);
  }
  const answer = ans.join('\n').trim();
  if (!question || question.length < 4 || !answer) return null;
  return { category, question, answer };
}

let parsed = data.map(parse).filter(Boolean);
const seen = new Set();
parsed = parsed.filter((p) => (seen.has(p.question) ? false : (seen.add(p.question), true)));

const esc = (s) => s.replace(/'/g, "''");
const rows = parsed
  .map((p, i) => `  ('${esc(p.category)}', '${esc(p.question)}', '${esc(p.answer)}', ${i + 1})`)
  .join(',\n');

const sql =
  `-- 보상 Q&A seed (키움 보상지원센터 1~20p 크롤링, ${parsed.length}건)\n` +
  `-- Supabase SQL Editor에서 schema.sql 실행 후 이 파일을 실행하세요.\n\n` +
  `truncate table qna_items;\n\n` +
  `insert into qna_items (category, question, answer, sort_order) values\n${rows};\n`;

fs.writeFileSync('supabase/seed_qna.sql', sql, 'utf8');
console.log(`seed_qna.sql 생성: ${parsed.length}건, ${fs.statSync('supabase/seed_qna.sql').size} bytes`);
