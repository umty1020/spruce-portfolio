"use client";

import Image from "next/image";
import { useState } from "react";

// ④ 발표자료 (Figma 4:85~4:93): PDF → 페이지별 WebP 슬라이드, 16:9 640 × 360
export default function SlideViewer({ slides, note }: { slides: string[]; note?: string }) {
  const [index, setIndex] = useState(0);
  const total = slides.length;
  const go = (d: number) => total && setIndex((i) => (i + d + total) % total);

  return (
    <>
      <div className="absolute top-0 left-0 h-[360px] w-[640px] overflow-hidden border border-border-default bg-bg-panel">
        {total === 0 ? (
          <p className="wf-mono absolute inset-0 flex items-center justify-center text-text-muted">발표 PDF · 슬라이드 1 (16:9)</p>
        ) : (
          // 지금·앞뒤 슬라이드만 그려 두고 opacity로 전환
          slides.map((src, i) =>
            Math.abs(i - index) <= 1 || (index === 0 && i === total - 1) ? (
              <Image
                key={src}
                src={src}
                alt={`슬라이드 ${i + 1}`}
                fill
                sizes="640px"
                className="object-contain transition-opacity duration-300"
                style={{ opacity: i === index ? 1 : 0 }}
              />
            ) : null,
          )
        )}
      </div>
      <div className="absolute top-[380px] left-0 flex w-[640px] items-center gap-[12px]">
        <SlideButton label="이전 슬라이드" onClick={() => go(-1)}>
          ←
        </SlideButton>
        <SlideButton label="다음 슬라이드" onClick={() => go(1)}>
          →
        </SlideButton>
        <p className="font-mono text-[13px] leading-normal text-text-primary tabular-nums">
          {total ? `${index + 1} / ${total}` : "– / –"}
        </p>
        {total === 0 && note && <p className="wf-caption ml-auto text-text-muted">{note}</p>}
      </div>
    </>
  );
}

function SlideButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-[44px] cursor-pointer items-center justify-center rounded-full border border-border-strong text-[16px] leading-[1.6] text-text-primary"
    >
      {children}
    </button>
  );
}
