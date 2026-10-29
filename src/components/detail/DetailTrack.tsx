"use client";

import Lenis from "lenis";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { FillText, setFill } from "./FillText";
import { PANEL_W } from "./parts";
import "./detail.css";

// 상세 페이지 공통 가로 트랙 (상세 A · B)
// 세로 스크롤 → 트랙 가로 이동. 하단 진행률, 끝에서 계속 내리면 다음 프로젝트,
// 맨 앞에서 계속 올리면 이전 프로젝트. 트랙 내용은 디자인 단위(높이 900)로 배치하고 화면에 맞게 축소.
//
// 두 가지 모드
// - panels 있음(상세 A): 섹션 한 장(1440)씩 넘김. 한 번 슥 밀면 다음 섹션이 화면 가운데에 딱 맞춰짐.
//   마지막 뒤에 "다음 프로젝트" 장이 자동으로 붙음.
// - panels 없음(상세 B): Lenis 관성으로 연속 이동, nextAt 위치에 "다음 프로젝트".

const DESIGN_H = 900;
const NEXT_ZONE = 700; // 끝에서 "다음 프로젝트" 글자를 채우는 스크롤 거리(px)
const PREV_ZONE = 500; // 맨 앞에서 위로 이만큼 굴리면 이전 프로젝트
const PAGED_EDGE_ZONE = 1100; // 섹션 모드: 끝에서 새로 이만큼 굴려야 다음·이전 프로젝트 (한 번 밀어선 다 안 참)

// 섹션 넘김
const WHEEL_THRESHOLD = 25; // 이만큼(px) 굴리면 한 장
const WHEEL_IDLE = 160; // 휠이 이만큼(ms) 조용하면 제스처 끝 → 다음 장 허용
const NEW_GESTURE_AFTER = 400; // 한 장 넘긴 뒤 이 시간이 지나 휠이 다시 세지면 새 제스처
const PAGE_DURATION = 0.9; // 한 장 넘기는 시간(s)
// 살짝 지나쳤다 돌아오는 감속 곡선 (easeOutBack, 약 5% 지나침)
const easeOutBack = (t: number) => {
  const c = 0.9;
  return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
};

type Neighbor = { slug: string; title: string };
type Props = {
  prev: Neighbor;
  next: Neighbor;
  dark?: boolean;
  children: ReactNode;
} & (
  | { panels: number; width?: never; nextAt?: never } // 섹션 장 수 (상세 A)
  | { panels?: never; width: number; nextAt: [number, number] } // 연속 트랙 길이·끝 문구 x (상세 B)
);

const ScrollLock = createContext<{ lock: () => void; unlock: () => void }>({ lock() {}, unlock() {} });
/** 모달 등에서 페이지 스크롤을 잠글 때 */
export const useScrollLock = () => useContext(ScrollLock);

export default function DetailTrack({ panels, width: trackWidth, nextAt, prev, next, dark = false, children }: Props) {
  const router = useRouter();
  const spacerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLParagraphElement>(null);
  const nextFillRef = useRef<HTMLSpanElement>(null);
  const prevFillRef = useRef<HTMLSpanElement>(null);
  const lenisRef = useRef<Lenis | null>(null);

  const paged = panels !== undefined;
  const width = paged ? (panels + 1) * PANEL_W : trackWidth;

  useEffect(() => {
    const spacer = spacerRef.current!;
    const track = trackRef.current!;
    const progress = progressRef.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let scale = 1;
    let offsetY = 0;
    let maxY = 0; // 트랙이 움직이는 스크롤 거리
    let offsetX = 0; // 스크롤 0일 때 트랙 x (섹션 모드: 첫 장이 화면 가운데)
    let pageW = 0; // 섹션 한 장의 화면 px
    let lastPct = -1;
    let leaving = false;

    const layout = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      scale = Math.min(1, vh / DESIGN_H);
      offsetY = Math.max(0, (vh - DESIGN_H * scale) / 2);
      if (paged) {
        pageW = PANEL_W * scale;
        offsetX = (pageW - vw) / 2; // 음수면 왼쪽 여백, 양수면 양옆이 조금 잘림
        maxY = panels * pageW;
        spacer.style.height = `${maxY + vh}px`;
      } else {
        offsetX = 0;
        maxY = Math.max(0, width * scale - vw);
        spacer.style.height = `${maxY + NEXT_ZONE + vh}px`;
      }
    };

    const goNext = () => {
      if (leaving) return;
      leaving = true;
      router.push(`/work/${next.slug}`);
    };
    const goPrev = () => {
      if (leaving) return;
      leaving = true;
      router.push(`/work/${prev.slug}`);
    };

    const update = (y: number) => {
      const clamped = Math.min(Math.max(y, 0), maxY);
      track.style.transform = `translate3d(${-(clamped + offsetX)}px, ${offsetY}px, 0) scale(${scale})`;
      const pct = maxY ? Math.round((clamped / maxY) * 100) : 100;
      if (pct !== lastPct) {
        progress.textContent = `${pct}%`;
        lastPct = pct;
      }
      if (!paged) {
        const f = Math.min(Math.max((y - maxY) / NEXT_ZONE, 0), 1);
        setFill(nextFillRef.current, f);
        if (f >= 0.999) goNext();
      }
    };

    layout();
    const lenis = new Lenis({
      autoRaf: true,
      smoothWheel: !reduce,
      // 섹션 모드에선 휠을 직접 처리 (한 제스처 = 한 장)
      virtualScroll: (data) => !(paged && data.event.type === "wheel"),
    });
    lenisRef.current = lenis;
    lenis.on("scroll", () => update(lenis.scroll));
    update(window.scrollY);

    // ── 섹션 넘김
    const pageIndex = () => Math.round(lenis.targetScroll / pageW);
    const goPage = (i: number) => {
      const page = Math.max(0, Math.min(panels ?? 0, i));
      lenis.scrollTo(page * pageW, { duration: PAGE_DURATION, easing: easeOutBack, immediate: reduce, force: true });
    };

    const onResize = () => {
      const page = paged ? pageIndex() : 0;
      layout();
      if (paged) lenis.scrollTo(page * pageW, { immediate: true, force: true });
      update(lenis.scroll);
    };

    // 끝에서 내리기(다음) · 맨 앞에서 올리기(이전): 굴린 만큼 글자가 차오르고, 다 차면 이동
    let edgeAcc = 0;
    let edgeTimer = 0;
    const edge = (dir: number, amount: number, zone: number) => {
      edgeAcc += amount;
      const f = Math.min(edgeAcc / zone, 1);
      setFill(dir > 0 ? nextFillRef.current : prevFillRef.current, f);
      clearTimeout(edgeTimer);
      edgeTimer = window.setTimeout(() => {
        edgeAcc = 0;
        setFill(nextFillRef.current, 0);
        setFill(prevFillRef.current, 0);
      }, 700);
      if (f >= 1) (dir > 0 ? goNext : goPrev)();
    };

    // 처음엔 잠가 둠: 앞 페이지에서 넘어올 때 이어지는 트랙패드 관성이 이 페이지를 넘기지 않게
    // (관성이 없으면 WHEEL_IDLE 뒤 바로 풀림)
    let acc = 0;
    let locked = paged;
    let lockedAt = performance.now();
    let lastAbs = Infinity;
    const unlockLater = () => {
      clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        locked = false;
        acc = 0;
      }, WHEEL_IDLE);
    };
    let idleTimer = 0;
    unlockLater();
    const onWheel = (e: WheelEvent) => {
      if (leaving || lenis.isStopped) return;
      const delta = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1);

      if (!paged) {
        // 연속 모드: 맨 앞에서 위로만 직접 처리
        if (lenis.scroll <= 1 && delta < 0) edge(-1, -delta, PREV_ZONE);
        return;
      }

      e.preventDefault();
      // 한 제스처(관성 포함)가 끝날 때까지는 잠김 — 끝에 도착한 뒤 남은 관성으로 다음 프로젝트에 넘어가지 않게
      const abs = Math.abs(delta);
      const now = performance.now();
      if (locked && now - lockedAt > NEW_GESTURE_AFTER && abs > lastAbs * 2 && abs > 10) locked = false;
      lastAbs = abs;
      unlockLater();
      if (locked) return;

      const page = pageIndex();
      const settled = Math.abs(lenis.scroll - lenis.targetScroll) < 2;
      // 마지막 장에서 새로 내림 · 첫 장에서 새로 올림 → 글자 채우기 (이 제스처 동안 연속)
      if (settled && page >= (panels ?? 0) && delta > 0) return edge(1, delta, PAGED_EDGE_ZONE);
      if (settled && page <= 0 && delta < 0) return edge(-1, -delta, PAGED_EDGE_ZONE);

      acc += delta;
      if (Math.abs(acc) >= WHEEL_THRESHOLD) {
        goPage(page + Math.sign(acc));
        acc = 0;
        locked = true;
        lockedAt = now;
      }
    };

    // 키보드: → ↓ PageDown Space 다음 장, ← ↑ PageUp 이전 장
    const onKey = (e: KeyboardEvent) => {
      if (!paged || leaving || lenis.isStopped) return;
      const dir = ["ArrowRight", "ArrowDown", "PageDown", " "].includes(e.key)
        ? 1
        : ["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)
          ? -1
          : 0;
      if (!dir) return;
      e.preventDefault();
      goPage(pageIndex() + dir);
    };

    // 터치: 손으로 민 뒤 스크롤이 멈추면, 민 방향의 가장 가까운 장에 맞춤
    let touchStart = 0;
    let touching = false;
    let touchSnap = 0;
    const onTouchStart = () => {
      touching = true;
      touchStart = lenis.scroll;
      clearTimeout(touchSnap);
    };
    const onTouchEnd = () => {
      touching = false;
    };
    lenis.on("scroll", () => {
      if (!paged || touchStart < 0) return;
      clearTimeout(touchSnap);
      touchSnap = window.setTimeout(() => {
        if (touching || Math.abs(lenis.scroll - lenis.targetScroll) > 2) return;
        const moved = lenis.scroll - touchStart;
        const pos = lenis.scroll / pageW;
        const page = moved > 0 ? Math.ceil(pos - 0.15) : moved < 0 ? Math.floor(pos + 0.15) : Math.round(pos);
        touchStart = -1;
        if (Math.abs(page * pageW - lenis.scroll) > 1) goPage(page);
      }, 120);
    });
    touchStart = -1; // 터치로 움직였을 때만 맞춤

    window.addEventListener("resize", onResize);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      clearTimeout(edgeTimer);
      clearTimeout(idleTimer);
      clearTimeout(touchSnap);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [paged, panels, width, prev.slug, next.slug, router]);

  const lock = () => lenisRef.current?.stop();
  const unlock = () => lenisRef.current?.start();

  return (
    <ScrollLock value={{ lock, unlock }}>
      <div ref={spacerRef} className={`detail-spacer ${dark ? "detail-dark" : ""}`} style={{ height: "300vh" }}>
        <div className="detail-viewport">
          <div ref={trackRef} className="detail-track" style={{ width }}>
            {children}

            {paged ? (
              // 마지막 장: 가운데에 "다음 프로젝트" (계속 내리면 왼쪽부터 차오름)
              <section
                className="absolute top-0 flex h-[900px] flex-col items-center justify-center gap-[10px]"
                style={{ left: (panels ?? 0) * PANEL_W, width: PANEL_W }}
              >
                <p className="detail-next-static">
                  <FillText text="SCROLL DOWN TO NEXT PROJECT" fillRef={nextFillRef} />
                </p>
                <p className="detail-next-title-static">{next.title}</p>
              </section>
            ) : (
              // 트랙 끝: 계속 내리면 왼쪽부터 차오름 → 다음 프로젝트 (Figma 4:125 · 4:126)
              <>
                <p className="detail-next" style={{ left: nextAt![0] }}>
                  <FillText text="SCROLL DOWN TO NEXT PROJECT" fillRef={nextFillRef} />
                </p>
                <p className="detail-next-title" style={{ left: nextAt![1] }}>
                  {next.title}
                </p>
              </>
            )}
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
