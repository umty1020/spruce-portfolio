import Image from "next/image";

// Figma: ViewToggle 2:64 — 누를 때마다 SHOWCASE → LIST → SLIDER 순환
export const VIEWS = ["SHOWCASE", "LIST", "SLIDER"] as const;
export type WorkView = (typeof VIEWS)[number];

type Props = {
  view: WorkView;
  onNext: () => void;
  className?: string;
};

export default function ViewToggle({ view, onNext, className = "" }: Props) {
  const index = VIEWS.indexOf(view);
  const next = VIEWS[(index + 1) % VIEWS.length];

  return (
    <div className={`flex items-center gap-[12px] ${className}`}>
      <button
        type="button"
        onClick={onNext}
        aria-label={`보기 전환: ${view} → ${next}`}
        className="flex size-[44px] shrink-0 cursor-pointer items-center justify-center rounded-full bg-bg-dark"
      >
        <Image
          src={view === "SHOWCASE" ? "/icons/globe.svg" : "/icons/arrow-updown.svg"}
          alt=""
          width={24}
          height={24}
          unoptimized
          className={view === "SLIDER" ? "rotate-90" : undefined}
        />
      </button>
      <span className="wf-mono text-text-primary">{view}</span>
      {/* Figma: SHOWCASE일 때만 muted-inverse, LIST·SLIDER는 muted */}
      <span className={`wf-mono ${view === "SHOWCASE" ? "text-text-muted-inverse" : "text-text-muted"}`}>
        {index + 1} / {VIEWS.length}
      </span>
    </div>
  );
}
