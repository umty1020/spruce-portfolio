"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

// 커서 라벨 — Figma 3:31 "OPEN PROJECT"(10px 사각) · 5:209 "DRAG"(18px 원) + 검은 칩.
// 포인터를 rAF로 따라다님.
type Props = { visible: boolean; label?: string; mark?: "square" | "ring" };

export default function CursorLabel({ visible, label = "OPEN PROJECT", mark = "square" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const half = mark === "ring" ? 9 : 5;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let x = 0;
    let y = 0;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          // 커서 표시(사각·원)의 중심이 포인터에 오도록
          el.style.transform = `translate3d(${x - half}px, ${y - 14}px, 0)`;
        });
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, [half]);

  return (
    <div ref={ref} className="work-cursor flex items-center gap-[8px]" data-visible={visible ? "" : undefined} aria-hidden>
      {mark === "ring" ? (
        <Image src="/icons/drag-ring.svg" alt="" width={18} height={18} unoptimized />
      ) : (
        <span className="size-[10px] border-[1.5px] border-border-strong bg-bg-page" />
      )}
      <span className="bg-bg-dark px-[10px] py-[6px] font-mono text-[12px] leading-normal font-medium text-text-inverse">
        {label}
      </span>
    </div>
  );
}
