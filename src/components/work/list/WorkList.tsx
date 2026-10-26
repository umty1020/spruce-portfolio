"use client";

import { useRef, useState } from "react";
import { projects } from "@/content/projects";
import WorkTrack, { type WorkTrackHandle } from "../WorkTrack";
import CursorLabel from "../CursorLabel";

// Figma 3:43 Work · LIST — 가운데 이미지 열이 위로 흐르고, 정면 프로젝트가 왼쪽 목록에서 강조
export default function WorkList() {
  const trackRef = useRef<WorkTrackHandle>(null);
  const [active, setActive] = useState(0);
  const [hovering, setHovering] = useState(false);
  const project = projects[active];

  return (
    <>
      {/* Figma: 정면 카드 중심 y = 398 / 900 → 화면 중앙에서 -52px */}
      <WorkTrack
        ref={trackRef}
        projects={projects}
        axis="y"
        copies={1}
        crossShift={-52}
        onIndexChange={setActive}
        onActiveHover={setHovering}
      />

      <ul className="absolute top-[calc(50%-64px)] left-[32px] flex flex-col gap-[6px] font-display text-[15px] leading-normal font-bold max-md:hidden">
        {projects.map((p, i) => (
          <li key={p.slug} className="flex">
            <button
              type="button"
              onClick={() => trackRef.current?.goTo(i)}
              aria-current={i === active ? "true" : undefined}
              className={`block cursor-pointer leading-[20px] ${i === active ? "text-text-primary" : "text-text-muted"}`}
            >
              {p.title}
            </button>
          </li>
        ))}
      </ul>

      {/* inset-0: 애니메이션 transform이 위치 기준이 되므로 화면 크기를 줘야 50%가 맞음 */}
      <div key={project.slug} className="work-fade-in pointer-events-none absolute inset-0 max-md:hidden">
        <p className="wf-body absolute top-[calc(50%-12px)] left-[calc(50%-390px)] text-text-primary">
          {project.summary}
        </p>
        <p className="wf-body absolute top-[calc(50%-12px)] left-[calc(50%+260px)] text-text-primary">
          {project.roles}
        </p>
        <p className="absolute top-[calc(50%-12px)] right-[32px] font-mono text-[14px] leading-normal text-text-primary">
          {project.no}
        </p>
      </div>

      <CursorLabel visible={hovering} />
    </>
  );
}
