// 상세 트랙 공통 조각 — 위치는 Figma 디자인 단위 (트랙 x, 높이 900 기준 y)
// dark: 상세 B(영화)처럼 어두운 배경일 때 글자색 반전

type Tone = { dark?: boolean };

/** 섹션 단위로 넘기는 트랙의 섹션 하나 (높이 900). 안의 x·y는 이 섹션 기준 */
export function Panel({ left, width, children }: { left: number; width: number; children: React.ReactNode }) {
  return (
    <section className="absolute top-0 h-[900px]" style={{ left, width }}>
      {children}
    </section>
  );
}

const muted = (dark?: boolean) => (dark ? "text-text-muted-inverse" : "text-text-muted");
const strong = (dark?: boolean) => (dark ? "text-text-inverse" : "text-text-primary");

export function Label({ x, y = 200, dark, children }: { x: number; y?: number; children: React.ReactNode } & Tone) {
  return (
    <p className={`wf-mono absolute ${muted(dark)}`} style={{ left: x, top: y }}>
      {children}
    </p>
  );
}

export function TextBlock({ x, y, title, body }: { x: number; y: number; title: string; body: string }) {
  return (
    <div className="absolute flex w-[300px] flex-col gap-[10px]" style={{ left: x, top: y }}>
      <p className="wf-title text-text-primary">{title}</p>
      <p className="wf-body text-text-muted">{body}</p>
    </div>
  );
}

export function Box({
  x,
  y,
  w,
  h,
  className = "",
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`absolute overflow-hidden ${className}`} style={{ left: x, top: y, width: w, height: h }}>
      {children}
    </div>
  );
}

export function Placeholder({ dark, children }: { children: React.ReactNode } & Tone) {
  return <p className={`wf-mono absolute inset-0 flex items-center justify-center text-center ${muted(dark)}`}>{children}</p>;
}

// ⑥ 정보 · ④ 크레딧 표 (Figma 4:105 · 5:83)
export function InfoList({
  x,
  y,
  items,
  labelWidth = 80,
  valueWidth = 304,
  dark,
}: {
  x: number;
  y: number;
  items: { label: string; lines: string[] }[];
  labelWidth?: number;
  valueWidth?: number;
} & Tone) {
  return (
    <dl className="absolute flex flex-col gap-[18px] text-[14px]" style={{ left: x, top: y }}>
      {items.map(({ label, lines }) => (
        <div key={label} className="flex gap-[16px]">
          <dt className={`leading-normal font-bold ${strong(dark)}`} style={{ width: labelWidth }}>
            {label}
          </dt>
          <dd className={`leading-[1.6] ${muted(dark)}`} style={{ width: valueWidth }}>
            {lines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  );
}
