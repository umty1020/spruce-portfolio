"use client";

import Image from "next/image";
import Link from "next/link";
import { useImperativeHandle, useRef, type MouseEvent, type Ref } from "react";
import type { Project } from "@/content/projects";
import { useSnapScroller } from "./useSnapScroller";

// LIST(세로)·SLIDER(가로) 공통: 360 카드가 한 줄로 순환하며 흐르는 트랙
const SIZE = 360;
const GAP = 8;
const PITCH = SIZE + GAP;

export type WorkTrackHandle = { goTo: (projectIndex: number) => void };

type Props = {
  projects: Project[];
  axis: "x" | "y";
  copies: number; // 화면을 덮을 만큼 반복 (순환 경계가 화면 밖에 오도록)
  crossShift: number; // 정면 카드의 반대 축 보정(px) — Figma 위치 맞춤
  onIndexChange?: (projectIndex: number) => void;
  onActiveHover?: (hovering: boolean) => void;
  ref?: Ref<WorkTrackHandle>;
};

// d를 [-n/2, n/2) 범위로 감음
const wrap = (d: number, n: number) => ((((d + n / 2) % n) + n) % n) - n / 2;

export default function WorkTrack({ projects, axis, copies, crossShift, onIndexChange, onActiveHover, ref }: Props) {
  const count = projects.length * copies;
  const trackRef = useRef<HTMLDivElement>(null);
  const hoveredRef = useRef(-1);

  const scroller = useSnapScroller({
    count,
    wheelPerPx: 1 / PITCH,
    touchPerPx: 1 / PITCH,
    onFrame: (pos) => {
      const cards = trackRef.current?.children;
      if (!cards) return;
      for (let i = 0; i < cards.length; i++) {
        const along = wrap(i - pos, count) * PITCH;
        const [x, y] = axis === "y" ? [0, along + crossShift] : [along, crossShift];
        (cards[i] as HTMLElement).style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
    },
    onIndexChange: (card) => {
      const cards = trackRef.current?.children;
      if (cards) for (let i = 0; i < cards.length; i++) cards[i].toggleAttribute("data-active", i === card);
      onIndexChange?.(card % projects.length);
      onActiveHover?.(hoveredRef.current === card);
    },
  });

  // 같은 프로젝트의 여러 복사본 중 지금 정면과 가장 가까운 칸
  const nearestCopy = (projectIndex: number) => {
    const now = scroller.index();
    let best = projectIndex;
    for (let c = 0; c < copies; c++) {
      const card = projectIndex + c * projects.length;
      if (Math.abs(wrap(card - now, count)) < Math.abs(wrap(best - now, count))) best = card;
    }
    return best;
  };

  useImperativeHandle(ref, () => ({ goTo: (projectIndex) => scroller.goTo(nearestCopy(projectIndex)) }));

  const onCardClick = (e: MouseEvent, card: number) => {
    if (scroller.consumeDrag()) {
      e.preventDefault();
      return;
    }
    if (card !== scroller.index()) {
      e.preventDefault();
      scroller.goTo(card);
    }
  };

  const setHovered = (card: number) => {
    hoveredRef.current = card;
    onActiveHover?.(card !== -1 && card === scroller.index());
  };

  return (
    <div ref={trackRef} className="absolute inset-0">
      {Array.from({ length: count }, (_, card) => {
        const project = projects[card % projects.length];
        const label = <span className="wf-mono">{project.title} 스크린샷</span>;
        return (
          <Link
            key={card}
            href={`/work/${project.slug}`}
            aria-label={`${project.no} ${project.title}`}
            draggable={false}
            className="work-card"
            onClick={(e) => onCardClick(e, card)}
            onPointerEnter={() => setHovered(card)}
            onPointerLeave={() => setHovered(-1)}
          >
            {project.cover ? (
              <Image src={project.cover} alt="" fill sizes="360px" className="object-cover" />
            ) : (
              <>
                <div className="work-card-face">{label}</div>
                <div className="work-card-active" aria-hidden>
                  {label}
                </div>
              </>
            )}
          </Link>
        );
      })}
    </div>
  );
}
