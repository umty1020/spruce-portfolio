"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import "./showcase-ring.css";

// 임시 타일 문구 (Figma 3:2). projects.ts가 채워지면 거기서 가져온다.
const TILES = [
  { code: "APP ICON 01", logo: "환경 로고" },
  { code: "APP ICON 02", logo: "학교 로고" },
  { code: "APP ICON 03", logo: "가방 로고" },
  { code: "APP ICON 04", logo: "영화 로고" },
  { code: "APP ICON 05", logo: "책 로고" },
];

const COUNT = TILES.length * 2;
const STEP = 360 / COUNT;
const RADIUS = 380;
const WHEEL_DEG_PER_PX = 0.12;
const TOUCH_DEG_PER_PX = 0.3;
const EASE = 7; // 클수록 빨리 따라붙음
const SNAP_DELAY = 140; // 입력이 멈춘 뒤 스냅까지(ms)
const SNAP_BIAS = 0.2; // 한 칸의 20%만 움직여도 그 방향 다음 카드로

export default function ShowcaseRing() {
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ring = ringRef.current;
    if (!ring) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let current = 0;
    let target = 0;
    let raf = 0;
    let last = 0;
    let snapTimer = 0;
    let reduceAcc = 0;
    let reduceLocked = false;

    const apply = (deg: number) => {
      ring.style.transform = `translateZ(-${RADIUS}px) rotateY(${deg}deg)`;
      ring.style.setProperty("--ring", String(deg));
    };

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      current += (target - current) * (1 - Math.exp(-dt * EASE));
      if (Math.abs(target - current) < 0.01) {
        current = target;
        apply(current);
        raf = 0;
        return;
      }
      apply(current);
      raf = requestAnimationFrame(tick);
    };

    const kick = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    // 마지막 입력 방향으로 SNAP_BIAS 이상 움직였으면 다음 카드로 넘어감
    let lastDir = 0;
    const snap = () => {
      const pos = target / STEP;
      const index =
        lastDir > 0 ? Math.ceil(pos - SNAP_BIAS) : lastDir < 0 ? Math.floor(pos + SNAP_BIAS) : Math.round(pos);
      target = index * STEP;
      kick();
    };

    // 정면 카드 한 칸 이동 (키보드·reduced-motion)
    const step = (dir: number) => {
      target = Math.round(target / STEP) * STEP + dir * STEP;
      if (reduce) {
        current = target;
        apply(current);
      } else kick();
    };

    const rotateBy = (deg: number) => {
      target += deg;
      lastDir = Math.sign(deg);
      kick();
      clearTimeout(snapTimer);
      snapTimer = window.setTimeout(snap, SNAP_DELAY);
    };

    // reduced-motion: 한 번의 휠 동작 = 한 칸
    const reduceInput = (delta: number) => {
      reduceAcc += delta;
      clearTimeout(snapTimer);
      snapTimer = window.setTimeout(() => {
        reduceAcc = 0;
        reduceLocked = false;
      }, 200);
      if (!reduceLocked && Math.abs(reduceAcc) > 40) {
        reduceLocked = true;
        step(Math.sign(reduceAcc));
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
      const delta = Math.max(-120, Math.min(120, e.deltaY * unit));
      if (reduce) reduceInput(delta);
      else rotateBy(delta * WHEEL_DEG_PER_PX);
    };

    let touchY = 0;
    let touchTotal = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY;
      touchTotal = 0;
      clearTimeout(snapTimer);
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY;
      const dy = touchY - y;
      touchY = y;
      touchTotal += dy;
      if (!reduce && dy !== 0) {
        target += dy * TOUCH_DEG_PER_PX;
        lastDir = Math.sign(dy);
        kick();
      }
    };
    const onTouchEnd = () => {
      if (reduce) {
        if (Math.abs(touchTotal) > 30) step(Math.sign(touchTotal));
      } else snap();
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") step(-1);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(snapTimer);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="showcase-stage">
      <div ref={ringRef} className="showcase-ring">
        {Array.from({ length: COUNT }, (_, i) => {
          const tile = TILES[i % TILES.length];
          return (
            // 다음 프로젝트가 왼쪽에 오도록 음의 방향으로 배치
            <div key={i} className="showcase-tile" style={{ "--a": -i * STEP } as CSSProperties}>
              <div className="showcase-face" />
              <div className="showcase-active" />
              <div className="showcase-shine" />
              <div className="showcase-label">
                <span className="wf-mono">{tile.code}</span>
                <span className="wf-title">{tile.logo}</span>
              </div>
              <div className="showcase-label showcase-label-active" aria-hidden>
                <span className="wf-mono">{tile.code}</span>
                <span className="wf-title">{tile.logo}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
