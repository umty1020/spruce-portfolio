"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useEffectEvent, useRef, type CSSProperties, type MouseEvent } from "react";
import type { Project } from "@/content/projects";
import "./showcase-ring.css";

const COPIES = 2; // 프로젝트 5개 × 2 = 타일 10장
const RADIUS = 380;
const WHEEL_DEG_PER_PX = 0.12;
const TOUCH_DEG_PER_PX = 0.3;
const EASE = 7; // 클수록 빨리 따라붙음
const SNAP_DELAY = 140; // 입력이 멈춘 뒤 스냅까지(ms)
const SNAP_BIAS = 0.2; // 한 칸의 20%만 움직여도 그 방향 다음 카드로
const TAP_SLOP = 8; // 이만큼(px) 넘게 끌면 클릭으로 보지 않음

type Props = {
  projects: Project[];
  onFrontChange?: (projectIndex: number) => void;
  onFrontHover?: (hovering: boolean) => void;
};

export default function ShowcaseRing({ projects, onFrontChange, onFrontHover }: Props) {
  const count = projects.length * COPIES;
  const step = 360 / count;

  const ringRef = useRef<HTMLDivElement>(null);
  const rotateToRef = useRef<(tile: number) => void>(() => {});
  const frontRef = useRef(0);
  const hoveredRef = useRef(-1);
  const draggedRef = useRef(false);

  const emitFront = useEffectEvent((tile: number) => {
    onFrontChange?.(tile % projects.length);
    onFrontHover?.(hoveredRef.current === tile);
  });

  useEffect(() => {
    const ring = ringRef.current;
    if (!ring) return;
    const tiles = Array.from(ring.children) as HTMLElement[];

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let current = 0;
    let target = 0;
    let raf = 0;
    let last = 0;
    let snapTimer = 0;
    let reduceAcc = 0;
    let reduceLocked = false;
    let lastDir = 0;

    // 타일 i는 -i·step 에 놓여 있으므로, 링 각도 deg에서 정면 타일 = round(deg / step)
    const apply = (deg: number) => {
      ring.style.transform = `translateZ(-${RADIUS}px) rotateY(${deg}deg)`;
      ring.style.setProperty("--ring", String(deg));
      const front = (((Math.round(deg / step)) % count) + count) % count;
      if (front !== frontRef.current) {
        tiles[frontRef.current]?.removeAttribute("data-front");
        tiles[front]?.setAttribute("data-front", "");
        frontRef.current = front;
        emitFront(front);
      }
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
      if (reduce) {
        current = target;
        apply(current);
        return;
      }
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    // 마지막 입력 방향으로 SNAP_BIAS 이상 움직였으면 다음 카드로 넘어감
    const snap = () => {
      const pos = target / step;
      const index =
        lastDir > 0 ? Math.ceil(pos - SNAP_BIAS) : lastDir < 0 ? Math.floor(pos + SNAP_BIAS) : Math.round(pos);
      target = index * step;
      kick();
    };

    // 정면 카드 한 칸 이동 (키보드·reduced-motion)
    const stepBy = (dir: number) => {
      target = Math.round(target / step) * step + dir * step;
      kick();
    };

    // 타일 하나를 가장 가까운 방향으로 돌려 정면에
    rotateToRef.current = (tile: number) => {
      const diff = (((tile * step - target) % 360) + 540) % 360 - 180;
      target = Math.round((target + diff) / step) * step;
      kick();
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
        stepBy(Math.sign(reduceAcc));
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
        target += dy * TOUCH_DEG_PER_PX;
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

    tiles[0]?.setAttribute("data-front", "");
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
  }, [count, step]);

  // 정면 카드는 상세로 이동, 옆 카드는 그 카드를 정면으로 돌림
  const onTileClick = (e: MouseEvent, tile: number) => {
    if (draggedRef.current) {
      e.preventDefault();
      draggedRef.current = false;
      return;
    }
    if (tile !== frontRef.current) {
      e.preventDefault();
      rotateToRef.current(tile);
    }
  };

  const setHovered = (tile: number) => {
    hoveredRef.current = tile;
    onFrontHover?.(tile !== -1 && tile === frontRef.current);
  };

  return (
    <div className="showcase-stage">
      <div ref={ringRef} className="showcase-ring">
        {Array.from({ length: count }, (_, tile) => {
          const project = projects[tile % projects.length];
          const label = (
            <>
              <span className="wf-mono">APP ICON {project.no}</span>
              <span className="wf-title">{project.icon.label}</span>
            </>
          );
          return (
            // 다음 프로젝트가 왼쪽에 오도록 음의 방향으로 배치
            <Link
              key={tile}
              href={`/work/${project.slug}`}
              aria-label={`${project.no} ${project.title}`}
              draggable={false}
              className="showcase-tile"
              style={{ "--a": -tile * step } as CSSProperties}
              onClick={(e) => onTileClick(e, tile)}
              onPointerEnter={() => setHovered(tile)}
              onPointerLeave={() => setHovered(-1)}
            >
              <div className="showcase-face" />
              <div className="showcase-active" />
              {project.icon.src && (
                <Image src={project.icon.src} alt="" fill sizes="240px" className="object-cover" />
              )}
              <div className="showcase-shine" />
              {!project.icon.src && (
                <>
                  <div className="showcase-label">{label}</div>
                  <div className="showcase-label showcase-label-active" aria-hidden>
                    {label}
                  </div>
                </>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
