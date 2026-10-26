"use client";

import { useEffect, useEffectEvent, useRef } from "react";

// Work 보기 공통 스크롤 엔진 (SHOWCASE 링 · LIST 열 · SLIDER 띠)
// 위치 단위는 "카드 칸" (1 = 한 칸). 휠·터치·방향키 → 관성으로 따라붙다가 한 칸에 스냅.
// prefers-reduced-motion이면 관성 없이 한 번의 입력 = 한 칸.

type Options = {
  count: number; // 칸 수 (순환)
  wheelPerPx: number; // 휠 1px당 이동 칸
  touchPerPx: number; // 터치 1px당 이동 칸
  onFrame: (pos: number) => void; // 매 프레임 위치 (transform 적용용)
  onIndexChange?: (index: number) => void; // 정면 칸이 바뀔 때
};

const EASE = 7; // 클수록 빨리 따라붙음
const SNAP_DELAY = 140; // 입력이 멈춘 뒤 스냅까지(ms)
const SNAP_BIAS = 0.2; // 한 칸의 20%만 움직여도 그 방향 다음 칸으로
const TAP_SLOP = 8; // 이만큼(px) 넘게 끌면 클릭으로 보지 않음

export function useSnapScroller({ count, wheelPerPx, touchPerPx, onFrame, onIndexChange }: Options) {
  const goToRef = useRef<(index: number) => void>(() => {});
  const dragByRef = useRef<(delta: number) => void>(() => {});
  const releaseRef = useRef<() => void>(() => {});
  const indexRef = useRef(-1); // 첫 프레임에서 onIndexChange(0)이 한 번 불리도록
  const draggedRef = useRef(false);

  const frame = useEffectEvent((pos: number) => {
    onFrame(pos);
    const index = ((Math.round(pos) % count) + count) % count;
    if (index !== indexRef.current) {
      indexRef.current = index;
      onIndexChange?.(index);
    }
  });

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let current = 0;
    let target = 0;
    let raf = 0;
    let last = 0;
    let snapTimer = 0;
    let lastDir = 0;
    let reduceAcc = 0;
    let reduceLocked = false;

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      current += (target - current) * (1 - Math.exp(-dt * EASE));
      if (Math.abs(target - current) < 0.0003) {
        current = target;
        frame(current);
        raf = 0;
        return;
      }
      frame(current);
      raf = requestAnimationFrame(tick);
    };

    const kick = () => {
      if (reduce) {
        current = target;
        frame(current);
        return;
      }
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    const snap = () => {
      target =
        lastDir > 0
          ? Math.ceil(target - SNAP_BIAS)
          : lastDir < 0
            ? Math.floor(target + SNAP_BIAS)
            : Math.round(target);
      kick();
    };

    const stepBy = (dir: number) => {
      target = Math.round(target) + dir;
      kick();
    };

    // 순환하는 칸 중 가장 가까운 쪽으로 이동
    goToRef.current = (index: number) => {
      const diff = ((((index - target) % count) + count * 1.5) % count) - count / 2;
      target = Math.round(target + diff);
      kick();
    };

    // 마우스로 끄는 동안: 스냅하지 않고 따라오다가, 놓으면 스냅
    dragByRef.current = (delta: number) => {
      if (reduce || delta === 0) return;
      clearTimeout(snapTimer);
      target += delta;
      lastDir = Math.sign(delta);
      kick();
    };
    releaseRef.current = () => {
      if (!reduce) snap();
    };

    const moveBy = (delta: number) => {
      target += delta;
      lastDir = Math.sign(delta);
      kick();
      clearTimeout(snapTimer);
      snapTimer = window.setTimeout(snap, SNAP_DELAY);
    };

    const reduceInput = (delta: number) => {
      reduceAcc += delta;
      clearTimeout(snapTimer);
      snapTimer = window.setTimeout(() => {
        reduceAcc = 0;
        reduceLocked = false;
      }, 200);
      if (!reduceLocked && Math.abs(reduceAcc) > 40) {
        reduceLocked = true;
        stepBy(Math.sign(reduceAcc));
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
      const delta = Math.max(-120, Math.min(120, e.deltaY * unit));
      if (reduce) reduceInput(delta);
      else moveBy(delta * wheelPerPx);
    };

    let touchY = 0;
    let touchTotal = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY;
      touchTotal = 0;
      draggedRef.current = false;
      clearTimeout(snapTimer);
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY;
      const dy = touchY - y;
      touchY = y;
      touchTotal += dy;
      if (Math.abs(touchTotal) > TAP_SLOP) draggedRef.current = true;
      if (!reduce && dy !== 0) {
        target += dy * touchPerPx;
        lastDir = Math.sign(dy);
        kick();
      }
    };
    const onTouchEnd = () => {
      if (!draggedRef.current) return;
      if (reduce) stepBy(Math.sign(touchTotal));
      else snap();
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") stepBy(1);
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") stepBy(-1);
    };

    frame(0);
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
  }, [count, wheelPerPx, touchPerPx]);

  return {
    /** 칸 하나를 정면으로 (가까운 방향) */
    goTo: (index: number) => goToRef.current(index),
    /** 마우스 드래그로 칸 단위 이동 (놓을 때 release) */
    dragBy: (delta: number) => dragByRef.current(delta),
    release: () => releaseRef.current(),
    /** 지금 정면 칸 */
    index: () => Math.max(0, indexRef.current),
    /** 방금 터치를 끌었는지 (끌었으면 true를 한 번 돌려주고 초기화 → 클릭 무시용) */
    consumeDrag: () => {
      const dragged = draggedRef.current;
      draggedRef.current = false;
      return dragged;
    },
  };
}
