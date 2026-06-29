// 제목용 아이콘 이미지 (public/<name>.png). 이모지 대체용 — 본문·오버레이 공통 사용.
export default function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <img
      src={`/${name}.png`}
      alt=""
      aria-hidden="true"
      className={['app-ic', className].filter(Boolean).join(' ')}
    />
  );
}
