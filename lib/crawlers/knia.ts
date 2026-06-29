// 손해보험협회(KNIA) 시험 일정 크롤러 — 실제 페이지에 맞춰 튜닝됨.
//
// 페이지: https://misi.knia.or.kr/m/task03/work02.knia  (자격시험 일정 게시판)
// 구조(검증 완료):
//   - 목록: .bbs_list ul li > a[onclick="openContent('IDX')"] + .dating(게시일)
//     예) '2026년 2분기(4월~6월) 설계사 자격시험 일정' / IDX=13866
//   - 상세: work02.knia?IDX=<IDX>  →  .bbs_viewer img[src^="data:image"] (단일 base64 PNG)
//
// ⚠️ 손보 일정표는 HTML 표가 아니라 base64 이미지입니다.
//    따라서 차수/시험일/지역/보험사 '행' 데이터는 여기서 추출할 수 없고,
//    이미지를 OCR(비전 모델)에 넘겨야 구조화됩니다. (lib/crawlers/ocr 참고)
import * as cheerio from 'cheerio';
import { fetchHtml } from './fetchHtml';
import type { ScheduleImagePost } from './types';

const KNIA_LIST_URL = 'https://misi.knia.or.kr/m/task03/work02.knia';

type KniaPost = { idx: string; title: string; postedAt: string | null };

/** 게시판 목록에서 최신 '자격시험 일정' 글을 찾아 상세의 일정 이미지를 가져온다. */
export async function crawlKniaLatest(): Promise<ScheduleImagePost | null> {
  try {
    const listHtml = await fetchHtml(KNIA_LIST_URL);
    const posts = parseKniaList(listHtml);
    const latest = posts.find((p) => /자격시험\s*일정/.test(p.title)) ?? posts[0];
    if (!latest) return null;

    const detailUrl = `${KNIA_LIST_URL}?IDX=${latest.idx}`;
    const detailHtml = await fetchHtml(detailUrl);
    const imageDataUri = parseKniaDetailImage(detailHtml);

    return {
      type: 'loss',
      title: latest.title,
      posted_at: latest.postedAt,
      detail_url: detailUrl,
      image_data_uri: imageDataUri,
    };
  } catch {
    return null;
  }
}

export function parseKniaList(html: string): KniaPost[] {
  const $ = cheerio.load(html);
  const posts: KniaPost[] = [];
  $('.bbs_list ul li').each((_, li) => {
    const a = $(li).find('a').first();
    const title = a.text().replace(/\s+/g, ' ').trim();
    const onclick = a.attr('onclick') ?? '';
    const m = onclick.match(/openContent\(\s*['"]?(\d+)/);
    if (!m) return;
    const postedAt = $(li).find('.dating').text().replace(/\s+/g, ' ').trim() || null;
    posts.push({ idx: m[1], title, postedAt });
  });
  return posts;
}

/** 상세 글 본문(bbs_viewer)의 base64 일정 이미지 data URI를 반환. 없으면 null. */
export function parseKniaDetailImage(html: string): string | null {
  const $ = cheerio.load(html);
  const src = $('.bbs_viewer img[src^="data:image"]').first().attr('src');
  return src ?? null;
}
