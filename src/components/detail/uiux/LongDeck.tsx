"use client";

import Image from "next/image";
import { useRef, useState } from "react";

// ④ 발표자료 · 긴 한 장짜리 (Behance식): 칸 안에서 세로로 쭉 스크롤.
// data-inner-scroll: DetailTrack이 이 안의 휠은 트랙 넘김 대신 내부 스크롤로 넘김 (끝에 닿으면 다시 트랙)
// data-lenis-prevent: Lenis도 이 안의 스크롤은 건드리지 않음
export default function LongDeck({ pages, width, height }: { pages: { src: string; w: number; h: number }[]; width: number; height: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setProgress(max > 0 ? Math.round((el.scrollTop / max) * 100) : 0);
  };

  return (
    <>
      <div
        ref={ref}
        data-inner-scroll
        data-lenis-prevent
        onScroll={onScroll}
        className="long-deck absolute top-0 left-0 overflow-y-auto overscroll-contain border border-border-default bg-bg-panel"
        style={{ width, height }}
      >
        {pages.map((p, i) => (
          <Image
            key={p.src}
            src={p.src}
            alt={i === 0 ? "IN:FORM 발표자료" : ""}
            width={p.w}
            height={p.h}
            sizes={`${width}px`}
            quality={90}
            priority={i === 0}
            className="block h-auto w-full"
          />
        ))}
      </div>
      <div className="absolute left-0 flex items-center justify-between" style={{ top: height + 16, width }}>
        <p className="wf-caption text-text-muted">↓ 칸 안에서 스크롤해서 보기</p>
        <p className="font-mono text-[13px] leading-normal text-text-primary tabular-nums">{progress}%</p>
      </div>
    </>
  );
}
