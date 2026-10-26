"use client";

import { useState } from "react";
import { projects } from "@/content/projects";
import { site } from "@/content/site";
import ShowcaseRing from "./ShowcaseRing";
import CursorLabel from "../CursorLabel";

// Figma 3:2 Work · SHOWCASE
export default function Showcase() {
  const [front, setFront] = useState(0);
  const [hovering, setHovering] = useState(false);
  const project = projects[front];

  return (
    <>
      <p className="wf-body absolute top-[88px] right-[32px] w-[360px] text-text-muted">{site.intro}</p>

      <ShowcaseRing projects={projects} onFrontChange={setFront} onFrontHover={setHovering} />

      {/* 캡션: 정면 카드의 번호 — 이름 / 수상(없으면 한 줄 소개) */}
      <div
        key={project.slug}
        aria-live="polite"
        className="work-fade-in pointer-events-none absolute bottom-[109px] left-1/2 flex -translate-x-1/2 flex-col items-center gap-[6px] whitespace-nowrap"
      >
        <p className="wf-title text-text-primary">
          {project.no} — {project.title}
        </p>
        <p className="wf-caption text-text-muted">{project.award ?? project.summary}</p>
      </div>

      <p className="wf-mono pointer-events-none absolute bottom-[34px] left-1/2 -translate-x-1/2 text-text-muted">
        SCROLL ↓
      </p>

      <CursorLabel visible={hovering} />
    </>
  );
}
