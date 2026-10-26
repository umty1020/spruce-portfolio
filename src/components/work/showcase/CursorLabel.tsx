"use client";

import { useEffect, useRef } from "react";

// Figma 3:31 "Cursor · OPEN PROJECT": 10px 사각 커서 + 검은 칩. 포인터를 rAF로 따라다님.
export default function CursorLabel({ visible, label = "OPEN PROJECT" }: { visible: boolean; label?: string }) {
  const ref = useRef<HTMLDivElement>(null);

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
          // 사각 커서(10px)의 중심이 포인터에 오도록
          el.style.transform = `translate3d(${x - 5}px, ${y - 14}px, 0)`;
        });
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div ref={ref} className="showcase-cursor flex items-center gap-[8px]" data-visible={visible ? "" : undefined} aria-hidden>
      <span className="size-[10px] border-[1.5px] border-border-strong bg-bg-page" />
      <span className="bg-bg-dark px-[10px] py-[6px] font-mono text-[12px] leading-normal font-medium text-text-inverse">
        {label}
      </span>
    </div>
  );
}
