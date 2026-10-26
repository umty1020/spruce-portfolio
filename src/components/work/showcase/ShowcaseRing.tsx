"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, type CSSProperties, type MouseEvent } from "react";
import type { Project } from "@/content/projects";
import { useSnapScroller } from "../useSnapScroller";
import "./showcase-ring.css";

const COPIES = 2; // 프로젝트 5개 × 2 = 타일 10장
const RADIUS = 380;
const WHEEL_DEG_PER_PX = 0.12;
const TOUCH_DEG_PER_PX = 0.3;

type Props = {
  projects: Project[];
  onFrontChange?: (projectIndex: number) => void;
  onFrontHover?: (hovering: boolean) => void;
};

export default function ShowcaseRing({ projects, onFrontChange, onFrontHover }: Props) {
  const count = projects.length * COPIES;
  const step = 360 / count;

  const ringRef = useRef<HTMLDivElement>(null);
  const hoveredRef = useRef(-1);

  // 타일 i는 -i·step 에 놓여 있으므로, 위치 pos(칸)일 때 링 각도 = pos·step 이면 타일 pos가 정면
  const scroller = useSnapScroller({
    count,
    wheelPerPx: WHEEL_DEG_PER_PX / step,
    touchPerPx: TOUCH_DEG_PER_PX / step,
    onFrame: (pos) => {
      const ring = ringRef.current;
      if (!ring) return;
      const deg = pos * step;
      ring.style.transform = `translateZ(-${RADIUS}px) rotateY(${deg}deg)`;
      ring.style.setProperty("--ring", String(deg));
    },
    onIndexChange: (tile) => {
      const tiles = ringRef.current?.children;
      if (tiles) for (let i = 0; i < tiles.length; i++) tiles[i].toggleAttribute("data-front", i === tile);
      onFrontChange?.(tile % projects.length);
      onFrontHover?.(hoveredRef.current === tile);
    },
  });

  // 정면 카드는 상세로 이동, 옆 카드는 그 카드를 정면으로 돌림
  const onTileClick = (e: MouseEvent, tile: number) => {
    if (scroller.consumeDrag()) {
      e.preventDefault();
      return;
    }
    if (tile !== scroller.index()) {
      e.preventDefault();
      scroller.goTo(tile);
    }
  };

  const setHovered = (tile: number) => {
    hoveredRef.current = tile;
    onFrontHover?.(tile !== -1 && tile === scroller.index());
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
