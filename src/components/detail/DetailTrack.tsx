"use client";

import Lenis from "lenis";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { FillText, setFill } from "./FillText";
import "./detail.css";

// 상세 페이지 공통 가로 트랙 (상세 A · B)
// 세로 스크롤 → 트랙 가로 이동(Lenis 관성). 하단 진행률, 끝에서 계속 내리면 다음 프로젝트,
// 맨 앞에서 계속 올리면 이전 프로젝트. 트랙 내용은 Figma 디자인 단위(높이 900)로 배치하고 화면에 맞게 축소.

const DESIGN_H = 900;
const NEXT_ZONE = 700; // 트랙 끝 뒤로 "다음 프로젝트" 글자를 채우는 스크롤 거리(px)
const PREV_ZONE = 500; // 맨 앞에서 위로 이만큼 굴리면 이전 프로젝트

type Neighbor = { slug: string; title: string };
type Props = {
  width: number; // 트랙 길이 (디자인 단위)
  nextAt: [number, number]; // 트랙 끝 "SCROLL DOWN TO NEXT PROJECT"와 다음 프로젝트 이름의 x (Figma)
  prev: Neighbor;
  next: Neighbor;
  dark?: boolean;
  children: ReactNode;
};

const ScrollLock = createContext<{ lock: () => void; unlock: () => void }>({ lock() {}, unlock() {} });
/** 모달 등에서 페이지 스크롤을 잠글 때 */
export const useScrollLock = () => useContext(ScrollLock);

export default function DetailTrack({ width, nextAt, prev, next, dark = false, children }: Props) {
  const router = useRouter();
  const spacerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLParagraphElement>(null);
  const nextFillRef = useRef<HTMLSpanElement>(null);
  const prevFillRef = useRef<HTMLSpanElement>(null);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const spacer = spacerRef.current!;
    const track = trackRef.current!;
    const progress = progressRef.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let scale = 1;
    let offsetY = 0;
    let maxX = 0;
    let lastPct = -1;
    let leaving = false;

    const layout = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      scale = Math.min(1, vh / DESIGN_H);
      offsetY = Math.max(0, (vh - DESIGN_H * scale) / 2);
      maxX = Math.max(0, width * scale - vw);
      spacer.style.height = `${maxX + NEXT_ZONE + vh}px`;
    };

    const update = (y: number) => {
      const x = Math.min(Math.max(y, 0), maxX);
      track.style.transform = `translate3d(${-x}px, ${offsetY}px, 0) scale(${scale})`;
      const pct = maxX ? Math.round((x / maxX) * 100) : 100;
      if (pct !== lastPct) {
        progress.textContent = `${pct}%`;
        lastPct = pct;
      }
      const f = Math.min(Math.max((y - maxX) / NEXT_ZONE, 0), 1);
      setFill(nextFillRef.current, f);
      if (f >= 0.999 && !leaving) {
        leaving = true;
        router.push(`/work/${next.slug}`);
      }
    };

    layout();
    const lenis = new Lenis({ autoRaf: true, smoothWheel: !reduce });
    lenisRef.current = lenis;
    lenis.on("scroll", () => update(lenis.scroll));
    update(window.scrollY);

    const onResize = () => {
      layout();
      update(lenis.scroll);
    };

    // 맨 앞에서 위로 계속 굴리면 머리글이 차오르고, 다 차면 이전 프로젝트
    let prevAcc = 0;
    let prevTimer = 0;
    const onWheel = (e: WheelEvent) => {
      if (lenis.scroll > 1 || e.deltaY >= 0 || leaving || lenis.isStopped) return;
      prevAcc += -e.deltaY;
      setFill(prevFillRef.current, Math.min(prevAcc / PREV_ZONE, 1));
      clearTimeout(prevTimer);
      prevTimer = window.setTimeout(() => {
        prevAcc = 0;
        setFill(prevFillRef.current, 0);
      }, 700);
      if (prevAcc >= PREV_ZONE) {
        leaving = true;
        router.push(`/work/${prev.slug}`);
      }
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      clearTimeout(prevTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("wheel", onWheel);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [width, prev.slug, next.slug, router]);

  const lock = () => lenisRef.current?.stop();
  const unlock = () => lenisRef.current?.start();

  return (
    <ScrollLock value={{ lock, unlock }}>
      <div ref={spacerRef} className={`detail-spacer ${dark ? "detail-dark" : ""}`} style={{ height: "300vh" }}>
        <div className="detail-viewport">
          <div ref={trackRef} className="detail-track" style={{ width }}>
            {children}

            {/* 트랙 끝: 계속 내리면 왼쪽부터 차오름 → 다음 프로젝트 (Figma 4:125 · 4:126) */}
            <p className="detail-next" style={{ left: nextAt[0] }}>
              <FillText text="SCROLL DOWN TO NEXT PROJECT" fillRef={nextFillRef} />
            </p>
            <p className="detail-next-title" style={{ left: nextAt[1] }}>
              {next.title}
            </p>
          </div>
        </div>

        <p className="detail-prev">
          <FillText text="SCROLL UP TO PREVIOUS PROJECT" fillRef={prevFillRef} />
        </p>
        <p ref={progressRef} className="detail-progress">
          0%
        </p>
      </div>
    </ScrollLock>
  );
}

