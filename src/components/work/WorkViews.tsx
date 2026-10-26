"use client";

import { useState } from "react";
import ViewToggle, { VIEWS, type WorkView } from "./ViewToggle";
import ShowcaseRing from "./showcase/ShowcaseRing";

// Work 화면: 보기 상태를 갖고, 각 보기(SHOWCASE·LIST·SLIDER)는 이후 단계에서 채운다
export default function WorkViews() {
  const [view, setView] = useState<WorkView>("SHOWCASE");

  return (
    <main className="relative h-dvh touch-none overflow-hidden">
      {view === "SHOWCASE" && <ShowcaseRing />}
      <ViewToggle
        view={view}
        onNext={() => setView(VIEWS[(VIEWS.indexOf(view) + 1) % VIEWS.length])}
        className="fixed top-[76px] left-[32px] z-40"
      />
    </main>
  );
}
