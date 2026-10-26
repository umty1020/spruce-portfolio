"use client";

import { useState } from "react";
import { site } from "@/content/site";
import ViewToggle, { VIEWS, type WorkView } from "./ViewToggle";
import Showcase from "./showcase/Showcase";
import WorkList from "./list/WorkList";
import WorkSlider from "./slider/WorkSlider";
import "./work-views.css";

// Work 화면: 보기 상태를 갖고, 각 보기(SHOWCASE·LIST·SLIDER)를 바꿔 끼운다
export default function WorkViews() {
  const [view, setView] = useState<WorkView>("SHOWCASE");

  return (
    <main className="relative h-dvh touch-none overflow-hidden">
      {view === "SHOWCASE" && <Showcase />}
      {view === "LIST" && <WorkList />}
      {view === "SLIDER" && <WorkSlider />}
      <ViewToggle
        view={view}
        onNext={() => setView(VIEWS[(VIEWS.indexOf(view) + 1) % VIEWS.length])}
        className="fixed top-[76px] left-[32px] z-40"
      />
      <p className="wf-caption pointer-events-none absolute right-[30px] bottom-[28px] text-text-muted">
        {site.copyright}
      </p>
    </main>
  );
}
