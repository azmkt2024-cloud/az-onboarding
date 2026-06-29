// 원본 200건(정제) → 청크 파일로 분할 (병렬 재작성 입력용)
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
parsed = parsed.map((p, i) => ({ id: i + 1, ...p }));

const CHUNK = 30;
const dir = 'scripts/_qna_src';
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });
fs.mkdirSync('scripts/_qna_out', { recursive: true });

let n = 0;
for (let i = 0; i < parsed.length; i += CHUNK) {
  n++;
  fs.writeFileSync(`${dir}/chunk_${n}.json`, JSON.stringify(parsed.slice(i, i + CHUNK), null, 2), 'utf8');
}
console.log(`총 ${parsed.length}건 → ${n}개 청크 (개당 ${CHUNK})`);
