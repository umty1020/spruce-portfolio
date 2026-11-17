"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useScrollLock } from "../DetailTrack";

// ④ 발표자료 · 긴 한 장짜리 (Behance식): 칸 안에서 세로로 쭉 스크롤. 클릭하면 배경이 어두워지고 크게 보기.
// data-inner-scroll: DetailTrack이 이 안의 휠은 트랙 넘김 대신 내부 스크롤로 넘김 (끝에 닿으면 다시 트랙)
// data-lenis-prevent: Lenis도 이 안의 스크롤은 건드리지 않음

type Page = { src: string; w: number; h: number };

export default function LongDeck({ pages, width, height }: { pages: Page[]; width: number; height: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState<number | null>(null); // 열 때의 스크롤 비율

  const ratio = () => {
    const el = ref.current;
    if (!el) return 0;
    const max = el.scrollHeight - el.clientHeight;
    return max > 0 ? el.scrollTop / max : 0;
  };

  return (
    <>
      <div
        ref={ref}
        data-inner-scroll
        data-lenis-prevent
        role="button"
        tabIndex={0}
        aria-label="발표자료 크게 보기"
        onScroll={() => setProgress(Math.round(ratio() * 100))}
        onClick={() => setOpen(ratio())}
        onKeyDown={(e) => e.key === "Enter" && setOpen(ratio())}
        className="long-deck absolute top-0 left-0 cursor-zoom-in overflow-y-auto overscroll-contain border border-border-default bg-bg-panel"
        style={{ width, height }}
      >
        <DeckImages pages={pages} sizes={`${width}px`} />
      </div>
      <div className="absolute left-0 flex items-center justify-between" style={{ top: height + 16, width }}>
        <p className="wf-caption text-text-muted">칸 안에서 스크롤 · 클릭하면 크게 보기</p>
        <p className="font-mono text-[13px] leading-normal text-text-primary tabular-nums">{progress}%</p>
      </div>
      {open !== null && <DeckModal pages={pages} start={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function DeckImages({ pages, sizes, eager = false }: { pages: Page[]; sizes: string; eager?: boolean }) {
  return pages.map((p, i) => (
    <Image
      key={p.src}
      src={p.src}
      alt={i === 0 ? "발표자료" : ""}
      width={p.w}
      height={p.h}
      sizes={sizes}
      quality={90}
      priority={eager || i === 0}
      className="block h-auto w-full"
    />
  ));
}

function DeckModal({ pages, start, onClose }: { pages: Page[]; start: number; onClose: () => void }) {
  const { lock, unlock } = useScrollLock();
  const sheet = useRef<HTMLDivElement>(null);

  useEffect(() => {
    lock();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      unlock();
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 칸에서 보던 위치 그대로 이어서 (이미지 크기는 width·height로 미리 잡혀 있어 바로 계산됨)
  useLayoutEffect(() => {
    const el = sheet.current;
    if (el) el.scrollTop = start * (el.scrollHeight - el.clientHeight);
  }, [start]);

  return createPortal(
    <div className="deck-overlay" role="dialog" aria-modal aria-label="발표자료 크게 보기">
      <button type="button" className="demo-dim cursor-pointer" aria-label="닫기" onClick={onClose} />
      <div ref={sheet} className="deck-sheet" data-lenis-prevent>
        <DeckImages pages={pages} sizes="1100px" />
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="absolute top-[32px] right-[24px] flex size-[44px] cursor-pointer items-center justify-center rounded-full border border-bg-page"
      >
        <Image src="/icons/close.svg" alt="" width={16} height={16} unoptimized />
      </button>
    </div>,
    document.body,
  );
}
