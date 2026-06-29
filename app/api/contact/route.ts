import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';

// 입사 문의 접수 API
//   현재: 로컬 .data/inquiries.json 에 적재 (노트북 dev 서버 + 터널 공유 환경에서 동작)
//   추후: Supabase insert 로 교체 (saveInquiry 함수만 바꾸면 됨)
export const runtime = 'nodejs';

type Inquiry = {
  id: string;
  name: string;
  phone: string;
  interest: string;
  message: string;
  createdAt: string;
};

const DATA_DIR = path.join(process.cwd(), '.data');
const FILE = path.join(DATA_DIR, 'inquiries.json');

async function readAll(): Promise<Inquiry[]> {
  try {
    const raw = await fs.readFile(FILE, 'utf-8');
    return JSON.parse(raw) as Inquiry[];
  } catch {
    return [];
  }
}

async function saveInquiry(item: Inquiry) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const all = await readAll();
  all.push(item);
  await fs.writeFile(FILE, JSON.stringify(all, null, 2), 'utf-8');
}

function clean(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const name = clean(body.name, 40);
  const phone = clean(body.phone, 30);
  const interest = clean(body.interest, 40) || '신입 설계사 지원';
  const message = clean(body.message, 1000);
  const agree = body.agree === true;

  if (!name || !phone) {
    return NextResponse.json({ ok: false, error: '이름과 연락처를 입력해주세요.' }, { status: 400 });
  }
  if (!/[0-9]{7,}/.test(phone.replace(/[^0-9]/g, ''))) {
    return NextResponse.json({ ok: false, error: '연락처를 정확히 입력해주세요.' }, { status: 400 });
  }
  if (!agree) {
    return NextResponse.json({ ok: false, error: '개인정보 수집·이용에 동의해주세요.' }, { status: 400 });
  }

  // 간단한 고유 id (Date/Math.random 의존 최소화 — 타임스탬프 + 무작위 접미)
  const now = new Date();
  const id = now.toISOString().replace(/[^0-9]/g, '') + '-' + Math.random().toString(36).slice(2, 7);

  const item: Inquiry = {
    id,
    name,
    phone,
    interest,
    message,
    createdAt: now.toISOString(),
  };

  try {
    await saveInquiry(item);
  } catch {
    return NextResponse.json(
      { ok: false, error: '접수 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 },
    );
  }

  // 서버 로그에도 남겨 운영자가 바로 확인 가능
  console.log(`[입사문의] ${item.createdAt} · ${name} · ${phone} · ${interest}`);

  return NextResponse.json({ ok: true });
}
