"use client";

import { useEffect, useEffectEvent, useRef } from "react";

// Work 보기 공통 스크롤 엔진 (SHOWCASE 링 · LIST 열 · SLIDER 띠)
// 위치 단위는 "카드 칸" (1 = 한 칸). 스크롤 한 번(한 제스처) = 정확히 한 칸.
// 이동은 감쇠 스프링으로: 관성으로 살짝 지나쳤다가 제자리에 탄력 있게 멈춤.
// 터치·마우스로 끄는 동안은 손을 따라오고, 놓으면 그 방향으로 최대 한 칸.
// prefers-reduced-motion이면 애니메이션 없이 바로 한 칸.

type Options = {
  count: number; // 칸 수 (순환)
  touchPerPx: number; // 터치로 끌 때 1px당 이동 칸
  onFrame: (pos: number) => void; // 매 프레임 위치 (transform 적용용)
  onIndexChange?: (index: number) => void; // 정면 칸이 바뀔 때
};

const STIFFNESS = 170; // 스프링 세기 (클수록 빨리 도착)
const DAMPING = 14; // 감쇠 (작을수록 더 통통 튐 · 지금 약 13% 지나쳤다 돌아옴)
const WHEEL_THRESHOLD = 25; // 이만큼(px) 굴리면 한 칸
const WHEEL_IDLE = 160; // 휠이 이만큼(ms) 조용하면 제스처 끝 → 다음 칸 허용
const NEW_GESTURE_AFTER = 350; // 한 칸 넘긴 뒤 이 시간이 지나 휠이 다시 세지면 새 제스처로 봄
const RELEASE_MIN = 0.15; // 끌다 놓을 때 한 칸의 15% 넘게 움직였으면 그 방향으로 넘어감
const TAP_SLOP = 8; // 이만큼(px) 넘게 끌면 클릭으로 보지 않음

export function useSnapScroller({ count, touchPerPx, onFrame, onIndexChange }: Options) {
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
    let velocity = 0;
    let raf = 0;
    let last = 0;

    // 감쇠 스프링 (반암시적 오일러)
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      velocity += (STIFFNESS * (target - current) - DAMPING * velocity) * dt;
      current += velocity * dt;
      if (Math.abs(target - current) < 0.0005 && Math.abs(velocity) < 0.002) {
        current = target;
        velocity = 0;
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
        velocity = 0;
        frame(current);
        return;
      }
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
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

    // ── 끌기 (터치·마우스 공통): 손을 따라오다가 놓으면 최대 한 칸
    let dragging = false;
    let dragStart = 0;
    let dragVel = 0;
    let dragTime = 0;
    const follow = (delta: number) => {
      const now = performance.now();
      if (!dragging) {
        dragging = true;
        dragStart = Math.round(target);
        dragVel = 0;
        cancelAnimationFrame(raf);
        raf = 0;
      } else {
        const dt = Math.max((now - dragTime) / 1000, 1 / 240);
        dragVel = dragVel * 0.6 + (delta / dt) * 0.4;
      }
      dragTime = now;
      current += delta;
      target = current;
      velocity = 0;
      frame(current);
    };
    const letGo = () => {
      if (!dragging) return;
      dragging = false;
      const moved = current - dragStart;
      const dir = Math.abs(moved) > RELEASE_MIN ? Math.sign(moved) : 0;
      target = dragStart + dir;
      velocity = reduce ? 0 : Math.max(-8, Math.min(8, dragVel)); // 손의 속도를 이어받아 자연스럽게
      kick();
    };
    dragByRef.current = (delta: number) => {
      if (delta !== 0) follow(delta);
    };
    releaseRef.current = letGo;

    // ── 휠: 한 제스처 = 한 칸 (트랙패드 관성으로 이어지는 이벤트는 같은 제스처)
    let acc = 0;
    let locked = false;
    let lockedAt = 0;
    let lastAbs = 0;
    let idleTimer = 0;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
      const delta = e.deltaY * unit;
      const abs = Math.abs(delta);
      const now = performance.now();

      // 관성이 잦아들다가 다시 세게 굴리면 새 제스처
      if (locked && now - lockedAt > NEW_GESTURE_AFTER && abs > lastAbs * 2 && abs > 10) locked = false;
      lastAbs = abs;

      clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        locked = false;
        acc = 0;
      }, WHEEL_IDLE);

      if (locked) return;
      acc += delta;
      if (Math.abs(acc) >= WHEEL_THRESHOLD) {
        stepBy(Math.sign(acc));
        acc = 0;
        locked = true;
        lockedAt = now;
      }
    };

    // ── 터치
    let touchY = 0;
    let touchTotal = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY;
      touchTotal = 0;
      draggedRef.current = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY;
      const dy = touchY - y;
      touchY = y;
      touchTotal += dy;
      if (Math.abs(touchTotal) > TAP_SLOP) draggedRef.current = true;
      if (dy !== 0 && !reduce) follow(dy * touchPerPx);
    };
    const onTouchEnd = () => {
      if (!draggedRef.current) return;
      if (reduce) stepBy(Math.sign(touchTotal));
      else letGo();
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
      clearTimeout(idleTimer);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
    };
  }, [count, touchPerPx]);

  return {
    /** 칸 하나를 정면으로 (가까운 방향) */
    goTo: (index: number) => goToRef.current(index),
    /** 마우스로 끄는 동안 칸 단위 이동 (놓을 때 release → 최대 한 칸) */
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
