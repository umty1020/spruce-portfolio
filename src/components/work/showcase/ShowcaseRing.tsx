"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useEffectEvent, useRef, type CSSProperties, type MouseEvent } from "react";
import type { Project } from "@/content/projects";
import { useSnapScroller } from "../useSnapScroller";
import "./showcase-ring.css";

const COPIES = 2; // 프로젝트 5개 × 2 = 타일 10장 (36° 간격)
// 크기(카드·반지름·원근)는 showcase-ring.css에서 화면 폭 비례로
const TOUCH_DEG_PER_PX = 0.3;

// 마우스 드래그: 위아래 → 링을 기울여 원통의 아랫면·윗면을 보여줌, 좌우 → 링 회전
const TILT_MAX = 28; // 최대 기울기(도) — 원통이 커져서 이보다 크면 화면 밖으로 나감
const TILT_PER_PX = 0.18; // 드래그 1px당 기울기(도)
const DRAG_DEG_PER_PX = 0.25; // 좌우 드래그 1px당 회전(도)
const DRAG_SLOP = 4; // 이만큼(px) 움직여야 드래그로 봄 (그 전은 클릭)
const SPRING = 180; // 놓았을 때 제자리로 당기는 힘
const DAMPING = 17; // 감쇠 (작을수록 더 출렁임)

type Props = {
  projects: Project[];
  onFrontChange?: (projectIndex: number) => void;
  onFrontHover?: (hovering: boolean) => void;
};

export default function ShowcaseRing({ projects, onFrontChange, onFrontHover }: Props) {
  const count = projects.length * COPIES;
  const step = 360 / count;

  const stageRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const hoveredRef = useRef(-1);
  const degRef = useRef(0);
  const tiltRef = useRef(0);
  const draggingRef = useRef(false);
  const draggedRef = useRef(false); // 방금 마우스로 끌었음 → 다음 클릭 무시

  // 회전(rotateY)과 기울기(rotateX)를 transform 하나로
  const apply = () => {
    const ring = ringRef.current;
    if (!ring) return;
    ring.style.transform = `rotateX(${tiltRef.current}deg) rotateY(${degRef.current}deg)`;
    ring.style.setProperty("--ring", String(degRef.current));
  };

  // 타일 i는 -i·step 에 놓여 있으므로, 위치 pos(칸)일 때 링 각도 = pos·step 이면 타일 pos가 정면
  const scroller = useSnapScroller({
    count,
    touchPerPx: TOUCH_DEG_PER_PX / step,
    onFrame: (pos) => {
      degRef.current = pos * step;
      apply();
    },
    onIndexChange: (tile) => {
      const tiles = ringRef.current?.children;
      if (tiles) for (let i = 0; i < tiles.length; i++) tiles[i].toggleAttribute("data-front", i === tile);
      onFrontChange?.(tile % projects.length);
      onFrontHover?.(!draggingRef.current && hoveredRef.current === tile);
    },
  });

  const dragBy = useEffectEvent((deg: number) => scroller.dragBy(deg / step));
  const release = useEffectEvent(() => scroller.release());
  const applyTilt = useEffectEvent(() => apply());
  const hideHover = useEffectEvent(() => onFrontHover?.(false));
  const restoreHover = useEffectEvent(() => onFrontHover?.(hoveredRef.current === scroller.index()));

  // 마우스 드래그 → 기울기(스프링) + 회전
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let target = 0;
    let velocity = 0;
    let raf = 0;
    let last = 0;
    let start: { x: number; y: number; lastX: number; id: number } | null = null;

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      // 감쇠 스프링 (드래그 중엔 손을 따라가고, 놓으면 살짝 출렁이며 0으로)
      const accel = -SPRING * (tiltRef.current - target) - DAMPING * velocity;
      velocity += accel * dt;
      tiltRef.current += velocity * dt;
      applyTilt();
      if (start || Math.abs(tiltRef.current - target) > 0.01 || Math.abs(velocity) > 0.01) {
        raf = requestAnimationFrame(tick);
      } else {
        tiltRef.current = target;
        applyTilt();
        raf = 0;
      }
    };
    const kick = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return; // 터치는 기존 세로 회전
      start = { x: e.clientX, y: e.clientY, lastX: e.clientX, id: e.pointerId };
      draggedRef.current = false;
    };
    const onMove = (e: PointerEvent) => {
      if (!start || e.pointerId !== start.id) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (!draggingRef.current) {
        if (Math.hypot(dx, dy) < DRAG_SLOP) return;
        draggingRef.current = true;
        draggedRef.current = true;
        stage.setPointerCapture(e.pointerId);
        stage.dataset.dragging = "";
        hideHover();
      }
      // 아래로 끌면 +(아래에서 올려다봄), 위로 끌면 −(위에서 내려다봄). 끝으로 갈수록 덜 따라오게
      target = TILT_MAX * Math.tanh((dy * TILT_PER_PX) / TILT_MAX);
      dragBy((e.clientX - start.lastX) * DRAG_DEG_PER_PX);
      start.lastX = e.clientX;
      kick();
    };
    const onUp = (e: PointerEvent) => {
      if (!start || e.pointerId !== start.id) return;
      start = null;
      if (draggingRef.current) {
        draggingRef.current = false;
        delete stage.dataset.dragging;
        release();
        restoreHover();
      }
      target = 0;
      kick();
    };

    stage.addEventListener("pointerdown", onDown);
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerup", onUp);
    stage.addEventListener("pointercancel", onUp);
    return () => {
      cancelAnimationFrame(raf);
      stage.removeEventListener("pointerdown", onDown);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerup", onUp);
      stage.removeEventListener("pointercancel", onUp);
    };
  }, []);

  // 정면 카드는 상세로 이동, 옆 카드는 그 카드를 정면으로 돌림 (끌고 난 직후 클릭은 무시)
  const onTileClick = (e: MouseEvent, tile: number) => {
    if (draggedRef.current || scroller.consumeDrag()) {
      e.preventDefault();
      draggedRef.current = false;
      return;
    }
    if (tile !== scroller.index()) {
      e.preventDefault();
      scroller.goTo(tile);
    }
  };

  const setHovered = (tile: number) => {
    hoveredRef.current = tile;
    if (!draggingRef.current) onFrontHover?.(tile !== -1 && tile === scroller.index());
  };

  return (
    <div ref={stageRef} className="showcase-stage">
      <div ref={ringRef} className="showcase-ring">
        {Array.from({ length: count }, (_, tile) => {
          const project = projects[tile % projects.length];
          const label = (
            <>
              <span className="wf-mono">APP ICON {project.no}</span>
              <span className="wf-title">{project.icon.label}</span>
            </>
          );
          const icon = project.icon.src && (
            <Image src={project.icon.src} alt="" fill sizes="240px" className="object-cover" />
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
              <div className="showcase-front">
                <div className="showcase-face" />
                <div className="showcase-active" />
                {icon}
                <div className="showcase-shine" />
                {!icon && (
                  <>
                    <div className="showcase-label">{label}</div>
                    <div className="showcase-label showcase-label-active" aria-hidden>
                      {label}
                    </div>
                  </>
                )}
              </div>
              {/* 원통 안쪽에서 보이는 면 (뒤편 카드) */}
              <div className="showcase-back" aria-hidden>
                <div className="showcase-face" />
                {icon || <div className="showcase-label">{label}</div>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
