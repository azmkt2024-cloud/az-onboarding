// 모의고사 PDF 마지막 페이지에서 정답키를 추출해 lib/data/answerKeys.ts 를 생성합니다.
//
// 사용법:
//   ANTHROPIC_API_KEY=sk-ant-... node scripts/extract_answer_keys.mjs            # 전체
//   node scripts/extract_answer_keys.mjs --subject fire --limit 4               # 손해 4개만 (파일럿)
//   node scripts/extract_answer_keys.mjs --force                                # 이미 추출된 것도 재추출
//
// 동작:
//   - public/mock-exams/{fire,life,variable}-*.pdf 를 Claude(claude-opus-4-8)에 PDF로 전달
//   - 마지막 페이지 정답표를 구조화 출력(json_schema)으로 받아 { total, answers:[1~5,...] } 파싱
//   - scripts/_answer_keys.json 에 누적 저장(중단/재개 가능) 후 lib/data/answerKeys.ts 재생성
//   - ⚠️ 추출 결과는 반드시 사람이 표본 검수하세요(인쇄 정답표 OCR은 오탈자 가능).

import fs from 'node:fs';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';

const ROOT = path.resolve(process.cwd());
const DIR = path.join(ROOT, 'public', 'mock-exams');
const CACHE = path.join(ROOT, 'scripts', '_answer_keys.json');
const OUT_TS = path.join(ROOT, 'lib', 'data', 'answerKeys.ts');
const MODEL = process.argv.includes('--model')
  ? process.argv[process.argv.indexOf('--model') + 1]
  : 'claude-opus-4-8';

const args = process.argv.slice(2);
const getArg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const subject = getArg('--subject'); // fire | life | variable
const limit = getArg('--limit') ? parseInt(getArg('--limit'), 10) : Infinity;
const force = args.includes('--force');

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('✋ ANTHROPIC_API_KEY 환경변수가 필요합니다. (.env.local 또는 셸 export)');
  process.exit(1);
}

const PROMPT = `이 PDF는 보험설계사 자격시험 대비 모의고사입니다. 보통 마지막 페이지(또는 마지막 부분)에 "정답" 표가 있습니다.
그 정답표를 읽어 1번부터 마지막 문항까지의 정답을 순서대로 추출하세요.
- 대부분 문항은 5지선다이며 정답은 1~5 정수입니다(①=1, ②=2, ③=3, ④=4, ⑤=5).
- 단, 일부 시험(특히 변액보험)은 앞쪽 1~4번이 ○/× 형식입니다. 이런 O/X 문항의 정답은 정수 대신 문자열 "O"(맞음/○) 또는 "X"(틀림/×)로 표기하세요.
- answers 배열에 각 문항 정답을 순서대로 넣되, O/X 문항은 "O" 또는 "X", 5지선다 문항은 1~5 정수를 넣습니다.
- "해설" 본문에서 추론하지 말고, 명시된 "정답표"의 값을 그대로 옮기세요.
- 정답표를 명확히 못 찾았거나 일부가 불확실하면 confidence를 "low" 또는 "medium"으로 표시하세요.

반드시 아래 JSON 형식 하나만 출력하세요. 코드블록·설명·다른 텍스트 금지:
{"total": <전체 문항 수>, "answers": <정답 배열, 예: ["O","O","O","X",1,3,4,2,...]>, "confidence": "high"|"medium"|"low"}`;

// 응답 텍스트에서 JSON 객체만 안전하게 파싱
function parseJson(text) {
  const s = text.indexOf('{');
  const e = text.lastIndexOf('}');
  if (s < 0 || e < 0) throw new Error('JSON 없음: ' + text.slice(0, 80));
  return JSON.parse(text.slice(s, e + 1));
}

const client = new Anthropic();

const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};

let files = fs
  .readdirSync(DIR)
  .filter((f) => /^(fire|life|variable)-\d{4}-\d{2}-\d\.pdf$/.test(f))
  .sort();
if (subject) files = files.filter((f) => f.startsWith(subject + '-'));

// 스캔본(>2MB)은 OCR 정확도가 낮아(검증결과 텍스트 100% vs 스캔 ~86%, confidence도 거짓 high)
// 자동 추출에서 제외합니다. 강제로 포함하려면 --include-scanned 옵션 사용.
if (!args.includes('--include-scanned')) {
  const isScan = (f) => fs.statSync(path.join(DIR, f)).size > 2_000_000;
  const scanned = files.filter(isScan);
  if (scanned.length) {
    console.error(`⚠️ 스캔본 ${scanned.length}개 자동제외(수동 처리 필요): ${scanned.join(', ')}`);
  }
  files = files.filter((f) => !isScan(f));
}

if (!force) files = files.filter((f) => !cache[`/mock-exams/${f}`]);
files = files.slice(0, limit);

console.error(`대상 ${files.length}개 (subject=${subject ?? '전체'}, force=${force})`);

let ok = 0;
let lowConf = 0;
for (const f of files) {
  const key = `/mock-exams/${f}`;
  try {
    const data = fs.readFileSync(path.join(DIR, f)).toString('base64');
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data } },
            { type: 'text', text: PROMPT },
          ],
        },
      ],
    });
    const text = res.content.find((b) => b.type === 'text')?.text ?? '{}';
    const parsed = parseJson(text);
    cache[key] = parsed.answers;
    fs.writeFileSync(CACHE, JSON.stringify(cache, null, 0));
    ok++;
    if (parsed.confidence !== 'high') lowConf++;
    const u = res.usage;
    console.error(
      `  ✓ ${f}  (${parsed.total}문항, conf=${parsed.confidence})  [in=${u.input_tokens} out=${u.output_tokens}]`,
    );
  } catch (e) {
    console.error(`  ✗ ${f}  실패: ${e.message}`);
  }
}

// answerKeys.ts 재생성 — 값: 5지선다=1~5 정수, O/X형=문자열 'O'/'X'
const fmt = (v) => (typeof v === 'number' ? v : `'${v}'`);
const entries = Object.keys(cache)
  .sort()
  .map((k) => `  '${k}': [${cache[k].map(fmt).join(', ')}],`)
  .join('\n');
const ts = `// 모의고사 정답키 — 회차(PDF 파일)별 정답 배열 (index = 문항번호-1)
//   값: 5지선다 = 1~5 정수 / O·X형(변액 1~4번 등) = 'O' | 'X'
// ⚠️ 자동 생성 파일: scripts/extract_answer_keys.mjs 로 생성/갱신됩니다. 직접 수정 시 다음 실행에 덮어쓰여요.
// 텍스트 PDF만 자동 추출(검증 100%). 스캔 PDF는 정확도가 낮아 제외 → 해당 회차는 채점 비활성(다운로드 전용).

export type AnswerValue = number | 'O' | 'X';

export const answerKeys: Record<string, AnswerValue[]> = {
${entries}
};

/** 해당 회차의 정답키 반환 (없으면 null → 채점 비활성) */
export function getAnswerKey(file: string): AnswerValue[] | null {
  return answerKeys[file] ?? null;
}
`;
fs.writeFileSync(OUT_TS, ts);

console.error(`\n완료: 성공 ${ok}개 / 저(低)신뢰 ${lowConf}개 · 총 ${Object.keys(cache).length}개 회차`);
console.error('→ lib/data/answerKeys.ts 갱신됨. 저신뢰 항목은 PDF와 대조해 검수하세요.');
