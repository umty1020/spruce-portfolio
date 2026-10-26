import Image from "next/image";
import type { Project, UiuxDetail as Detail } from "@/content/projects";
import { getNeighbors } from "@/content/projects";
import DetailTrack from "../DetailTrack";
import LiveDemo from "./LiveDemo";
import SlideViewer from "./SlideViewer";

// 상세 A · UI/UX (Figma 4:42) — 위치는 모두 Figma 디자인 단위(트랙 x, 화면 높이 900 기준 y)
const TRACK_WIDTH = 6560;

export default function UiuxDetail({ project }: { project: Project & { uiux: Detail } }) {
  const d = project.uiux;
  const { prev, next } = getNeighbors(project.slug);

  return (
    <DetailTrack width={TRACK_WIDTH} prev={prev} next={next}>
      {/* ① 개요 */}
      <Label x={32}>① 개요</Label>
      <TextBlock x={32} y={420} title={project.title} body={d.overview} />
      <TextBlock x={400} y={420} title="SOLUTIONS" body={d.solutions} />
      <Box x={760} y={240} w={760} h={420} className="bg-bg-panel-strong">
        {d.hero ? (
          <Image src={d.hero} alt="" fill sizes="760px" className="object-cover" priority />
        ) : (
          <>
            <div className="absolute top-[150px] left-[230px] flex h-[120px] w-[300px] items-center justify-center border-2 border-border-strong font-mono text-[13px] text-text-primary">
              {project.title} 로고
            </div>
            <p className="wf-mono absolute top-[392px] left-[16px] text-text-muted">대표 이미지 · 흐린 배경</p>
          </>
        )}
      </Box>

      {/* ② 문제 */}
      <Label x={1600}>② 문제</Label>
      <TextBlock x={1600} y={400} title="문제" body={d.problem} />
      <Box x={1940} y={240} w={440} h={420} className="border border-border-default bg-bg-panel">
        {d.problemImage ? (
          <Image src={d.problemImage} alt="" fill sizes="440px" className="object-cover" />
        ) : (
          <Placeholder>문제 상황 이미지</Placeholder>
        )}
      </Box>

      {/* ③ 라이브 시연 */}
      <Label x={2460} y={150}>
        ③ 라이브 시연
      </Label>
      <Box x={2460} y={180} w={900} h={540} className="overflow-visible">
        <LiveDemo url={d.demo.url} device={d.demo.device} preview={d.demo.preview} />
      </Box>

      {/* ④ 발표자료 */}
      <Label x={3440}>④ 발표자료</Label>
      <Box x={3440} y={260} w={640} h={440} className="overflow-visible">
        <SlideViewer slides={d.slides} note={d.slidesNote} />
      </Box>

      {/* ⑤ 핵심 기능 화면: 모바일 200 × 420, 데스크톱 440 × 280 */}
      <Label x={4160}>⑤ 핵심 기능 화면</Label>
      {screenLayout(d.screens).map(({ screen, x, y, w, h }) => (
        <div key={screen.label}>
          <Box
            x={x}
            y={y}
            w={w}
            h={h}
            className={`border-2 border-border-strong bg-bg-panel ${screen.device === "mobile" ? "rounded-[28px]" : ""}`}
          >
            {screen.src ? (
              <Image src={screen.src} alt={screen.label} fill sizes={`${w}px`} className="object-cover" />
            ) : (
              <Placeholder>{screen.device === "mobile" ? "모바일 화면" : "데스크톱 화면"}</Placeholder>
            )}
          </Box>
          <p className="wf-caption absolute text-text-primary" style={{ left: x, top: y + h + 16 }}>
            {screen.label}
          </p>
        </div>
      ))}

      {/* ⑥ 정보 */}
      <Label x={5112}>⑥ 정보</Label>
      <dl className="absolute top-[250px] left-[5112px] flex flex-col gap-[18px] text-[14px]">
        {d.info.map(({ label, lines }) => (
          <div key={label} className="flex gap-[16px]">
            <dt className="w-[80px] leading-normal font-bold text-text-primary">{label}</dt>
            <dd className="w-[304px] leading-[1.6] text-text-muted">
              {lines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </dd>
          </div>
        ))}
      </dl>

      {/* ⑦ 결과 */}
      <Label x={5592}>⑦ 결과</Label>
      <TextBlock x={5592} y={407} title="결과" body={d.result} />
    </DetailTrack>
  );
}

// ⑤ 화면들을 x=4160부터 16 간격으로: 모바일은 위 240, 데스크톱은 세로 가운데(위 310)
function screenLayout(screens: Detail["screens"]) {
  let x = 4160;
  return screens.map((screen) => {
    const [w, h, y] = screen.device === "mobile" ? [200, 420, 240] : [440, 280, 310];
    const item = { screen, x, y, w, h };
    x += w + 16;
    return item;
  });
}

function Label({ x, y = 200, children }: { x: number; y?: number; children: React.ReactNode }) {
  return (
    <p className="wf-mono absolute text-text-muted" style={{ left: x, top: y }}>
      {children}
    </p>
  );
}

function TextBlock({ x, y, title, body }: { x: number; y: number; title: string; body: string }) {
  return (
    <div className="absolute flex w-[300px] flex-col gap-[10px]" style={{ left: x, top: y }}>
      <p className="wf-title text-text-primary">{title}</p>
      <p className="wf-body text-text-muted">{body}</p>
    </div>
  );
}

function Box({ x, y, w, h, className = "", children }: { x: number; y: number; w: number; h: number; className?: string; children?: React.ReactNode }) {
  return (
    <div className={`absolute overflow-hidden ${className}`} style={{ left: x, top: y, width: w, height: h }}>
      {children}
    </div>
  );
}

function Placeholder({ children }: { children: React.ReactNode }) {
  return <p className="wf-mono absolute inset-0 flex items-center justify-center text-text-muted">{children}</p>;
}
