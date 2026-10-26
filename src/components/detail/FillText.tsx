// 차오르는 글자 ("SCROLL DOWN TO NEXT PROJECT" 등):
// 회색 글자 위에 진한 글자를 겹쳐 두고, 진한 쪽을 transform으로 왼쪽부터 드러냄 (스타일은 detail.css)

export function FillText({ text, fillRef }: { text: string; fillRef: React.Ref<HTMLSpanElement> }) {
  return (
    <span className="detail-fill">
      <span className="detail-fill-base">{text}</span>
      <span className="detail-fill-mask" ref={fillRef} aria-hidden>
        <span>{text}</span>
      </span>
    </span>
  );
}

/** f: 0 ~ 1 (transform만 바꿈) */
export function setFill(mask: HTMLElement | null, f: number) {
  if (!mask) return;
  mask.style.transform = `translateX(${(f - 1) * 100}%)`;
  (mask.firstElementChild as HTMLElement).style.transform = `translateX(${(1 - f) * 100}%)`;
}
