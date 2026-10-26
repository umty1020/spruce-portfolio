"use client";

import { useState } from "react";
import { projects } from "@/content/projects";
import WorkTrack from "../WorkTrack";
import CursorLabel from "../CursorLabel";

// Figma 3:74 Work · SLIDER — 세로 스크롤 → 가로 무한 순환, 가운데 칸 위에 번호와 이름
export default function WorkSlider() {
  const [active, setActive] = useState(0);
  const [hovering, setHovering] = useState(false);
  const project = projects[active];

  return (
    <>
      {/* Figma: 카드 중심 y = 456 / 900 → 화면 중앙에서 +6px. 넓은 화면에서도 순환 경계가 안 보이게 2벌 */}
      <WorkTrack
        projects={projects}
        axis="x"
        copies={2}
        crossShift={6}
        onIndexChange={setActive}
        onActiveHover={setHovering}
      />

      {/* 가운데 칸 바로 위 (카드 위 끝 = 중앙 -174px) */}
      <div
        key={project.slug}
        className="work-fade-in pointer-events-none absolute top-[calc(50%-200px)] left-1/2 flex w-[360px] -translate-x-1/2 items-end justify-between"
      >
        <p className="font-mono text-[14px] leading-normal text-text-primary">{project.no}</p>
        <p className="font-display text-[15px] leading-normal font-bold text-text-primary">{project.title}</p>
      </div>

      <CursorLabel visible={hovering} />
    </>
  );
}
