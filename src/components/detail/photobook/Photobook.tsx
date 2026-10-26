"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { PageFlip } from "page-flip";
import type { PhotobookDetail, Project } from "@/content/projects";
import { FillText, setFill } from "../FillText";
import "../detail.css";
import "./photobook.css";

// 상세 C · 포토북 (Figma 5:105) — 한 화면에 책이 양면(3:4)으로 펼쳐짐
// 세로 스크롤·드래그·화살표로 한 장씩 넘김(page-flip, 이 페이지에서만 동적 로드).
// 마지막 장 뒤에서 계속 내리면 다음 프로젝트, 첫 장에서 계속 올리면 이전 프로젝트.

const PAGE_W = 380;
const PAGE_H = 506;
const WHEEL_STEP = 60; // 이만큼 굴리면 한 장
const WHEEL_QUIET = 220; // 한 장 넘긴 뒤 이만큼 조용해야 다음 장 (트랙패드 관성 무시)
const EDGE_ZONE = 600; // 끝에서 다음/이전 프로젝트까지 굴릴 거리

type Neighbor = { slug: string; title: string };
type Props = { project: Project & { photobook: PhotobookDetail }; prev: Neighbor; next: Neighbor };

export default function Photobook({ project, prev, next }: Props) {
  const d = project.photobook;
  const router = useRouter();
  const bookRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<PageFlip | null>(null);
  const nextFillRef = useRef<HTMLSpanElement>(null);
  const prevFillRef = useRef<HTMLSpanElement>(null);
  const [page, setPage] = useState(0);
  const [scale, setScale] = useState(1);
  const [touched, setTouched] = useState(false);
  const [portrait, setPortrait] = useState(false);
  const count = d.pages.length;

  useEffect(() => {
    const host = bookRef.current;
    if (!host) return;
    let pf: PageFlip | null = null;
    let cancelled = false;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // 화면에 맞는 책 크기 (책을 transform으로 줄이면 드래그 좌표가 어긋나서 크기 자체를 정함)
    // 좁은 화면은 한 쪽씩 크게 (portrait)
    const narrow = window.innerWidth < 768;
    const s = Math.min(1, (window.innerHeight - 150 - 120) / PAGE_H, (window.innerWidth - 32) / (PAGE_W * (narrow ? 1 : 2)));
    setScale(s);
    setPortrait(narrow);

    // page-flip이 페이지 DOM을 옮기므로 React 밖에서 만든다
    const root = document.createElement("div");
    host.appendChild(root);
    const pageEls = d.pages.map((src, i) => {
      const el = document.createElement("div");
      el.className = "photobook-page";
      if (i === 0 || i === count - 1) el.dataset.density = "hard";
      const img = document.createElement("img");
      img.src = src;
      img.alt = `${i + 1}쪽`;
      img.width = PAGE_W * 2;
      img.height = Math.round(PAGE_H * 2);
      img.decoding = "async";
      img.loading = i < 6 ? "eager" : "lazy";
      img.draggable = false;
      el.appendChild(img);
      return el;
    });
    pageEls.forEach((el) => root.appendChild(el));

    import("page-flip").then(({ PageFlip }) => {
      if (cancelled) return;
      pf = new PageFlip(root, {
        width: Math.round(PAGE_W * s),
        height: Math.round(PAGE_H * s),
        size: "fixed",
        showCover: true,
        usePortrait: narrow,
        flippingTime: reduce ? 1 : 800,
        maxShadowOpacity: 0.4,
        mobileScrollSupport: false,
      });
      pf.loadFromHTML(pageEls);
      pf.on("flip", (e) => {
        setPage(e.data);
        setTouched(true);
      });
      flipRef.current = pf;
    });

    // 세로 스크롤 → 한 장씩
    let acc = 0;
    let lastWheel = 0;
    let cooldown = false;
    let edgeAcc = 0;
    let edgeTimer = 0;
    let leaving = false;

    const atStart = () => (pf?.getCurrentPageIndex() ?? 0) === 0;
    const atEnd = () => (pf?.getCurrentPageIndex() ?? 0) >= count - (narrow ? 1 : 2);

    const edge = (dir: number, delta: number) => {
      edgeAcc += delta;
      const f = Math.min(edgeAcc / EDGE_ZONE, 1);
      setFill(dir > 0 ? nextFillRef.current : prevFillRef.current, f);
      clearTimeout(edgeTimer);
      edgeTimer = window.setTimeout(() => {
        edgeAcc = 0;
        setFill(nextFillRef.current, 0);
        setFill(prevFillRef.current, 0);
      }, 700);
      if (f >= 1 && !leaving) {
        leaving = true;
        router.push(`/work/${dir > 0 ? next.slug : prev.slug}`);
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!pf) return;
      const now = performance.now();
      const quiet = now - lastWheel > WHEEL_QUIET;
      lastWheel = now;
      if (cooldown && quiet && pf.getState() === "read") cooldown = false;
      if (cooldown) return;

      const dir = Math.sign(e.deltaY);
      if ((dir > 0 && atEnd()) || (dir < 0 && atStart())) {
        edge(dir, Math.abs(e.deltaY));
        return;
      }
      acc += e.deltaY;
      if (Math.abs(acc) >= WHEEL_STEP) {
        if (acc > 0) pf.flipNext();
        else pf.flipPrev();
        acc = 0;
        cooldown = true;
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") pf?.flipNext();
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") pf?.flipPrev();
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      cancelled = true;
      clearTimeout(edgeTimer);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      pf?.destroy();
      flipRef.current = null;
      host.replaceChildren();
    };
  }, [d.pages, count, next.slug, prev.slug, router]);

  // 펼침면 표기: 표지 "1", 그다음부터 "2–3", "4–5" …
  // 한 쪽씩 보기(좁은 화면)는 "n"
  const spread = portrait || page === 0 ? String(page + 1) : page >= count - 1 ? String(count) : `${page + 1}–${page + 2}`;
  const right = portrait || page === 0 ? page + 1 : page + 2;
  const activeChapter = d.chapters.reduce((a, c, i) => (c.page <= right ? i : a), -1);

  return (
    <main className="photobook relative flex h-dvh justify-center overflow-hidden pt-[150px] max-md:pt-[120px]">
      <p className="detail-prev">
        <FillText text="SCROLL UP TO PREVIOUS PROJECT" fillRef={prevFillRef} />
      </p>

      {/* 왼쪽: 기획 설명 (Figma 5:112) */}
      <div className="mt-[40px] mr-[32px] flex w-[296px] shrink-0 flex-col gap-[12px] max-xl:hidden">
        <p className="wf-title text-text-primary">{d.heading}</p>
        <p className="wf-caption text-text-muted">{d.subtitle}</p>
        <p className="text-[13.5px] leading-[1.6] text-text-muted">{d.description}</p>
        <p className="wf-caption text-text-muted">
          {d.meta.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </p>
      </div>

      {/* 가운데: 책 + 조작 */}
      <div className="flex shrink-0 flex-col" style={{ width: PAGE_W * (portrait ? 1 : 2) * scale }}>
        <div className="relative" style={{ height: PAGE_H * scale }}>
          <div ref={bookRef} className="photobook-book" />
          {!touched && (
            <Image
              src="/icons/page-curl.svg"
              alt=""
              width={64}
              height={64}
              unoptimized
              className="pointer-events-none absolute right-0 bottom-0"
            />
          )}
        </div>
        <div className="mt-[28px] flex flex-wrap items-center gap-[12px]">
          <RoundButton label="이전 장" onClick={() => flipRef.current?.flipPrev()}>
            ←
          </RoundButton>
          <RoundButton label="다음 장" onClick={() => flipRef.current?.flipNext()}>
            →
          </RoundButton>
          <p className="font-mono text-[13px] leading-normal text-text-primary tabular-nums">
            {spread} / {count}
          </p>
          <ol className="ml-auto flex gap-[8px]">
            {d.chapters.map((c, i) => (
              <li key={c.label}>
                <button
                  type="button"
                  onClick={() => flipRef.current?.flip(c.page - 1)}
                  aria-current={i === activeChapter ? "true" : undefined}
                  className={`wf-caption flex h-[36px] cursor-pointer items-center rounded-full border px-[14px] ${
                    i === activeChapter
                      ? "border-border-strong bg-bg-dark text-text-inverse"
                      : "border-border-default text-text-primary"
                  }`}
                >
                  {i + 1}. {c.label}
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* 오른쪽: 다음 프로젝트 (Figma 5:138 · 5:139) */}
      <div className="mt-[290px] ml-[60px] flex w-[228px] shrink-0 flex-col gap-[6px] max-xl:hidden">
        <p className="text-[14px] leading-[1.6] whitespace-nowrap">
          <FillText text="SCROLL DOWN TO NEXT PROJECT" fillRef={nextFillRef} />
        </p>
        <p className="wf-title text-text-primary">{next.title}</p>
      </div>
    </main>
  );
}

function RoundButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
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
