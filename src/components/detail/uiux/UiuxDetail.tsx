import Image from "next/image";
import type { Project, UiuxDetail as Detail } from "@/content/projects";
import { getNeighbors } from "@/content/projects";
import DetailTrack from "../DetailTrack";
import { Box, InfoList, Label, Panel, Placeholder, TextBlock } from "../parts";
import LiveDemo from "./LiveDemo";
import SlideViewer from "./SlideViewer";

// 상세 A · UI/UX (Figma 4:42) — 섹션 하나씩 넘김. 한 번 밀면 다음 섹션이 화면 가운데에 맞춰짐.
// 섹션 폭 = 콘텐츠 폭 + 양옆 PAD → 섹션 사이 간격은 PAD × 2, 화면 양옆에 이전·다음 섹션이 조금씩 보임.
// 크기는 Figma 값 그대로: 대표 이미지 760 × 420, 시연 프레임 900 × 540, 슬라이드 640 × 360, 화면 200 × 420 · 440 × 280.

const PAD = 40;
const SCREEN_GAP = 16;

const screenSize = (device: "mobile" | "desktop") => (device === "mobile" ? [200, 420, 240] : [440, 280, 310]);

export default function UiuxDetail({ project }: { project: Project & { uiux: Detail } }) {
  const d = project.uiux;
  const { prev, next } = getNeighbors(project.slug);

  const screensW =
    d.screens.reduce((sum, s) => sum + screenSize(s.device)[0], 0) + SCREEN_GAP * Math.max(0, d.screens.length - 1);

  // 섹션별 콘텐츠 폭
  const contents = [
    300 + 48 + 760, // ① 설명 + 대표 이미지
    300 + 60 + 560, // ② 글 + 이미지
    900, // ③ 시연 프레임
    640, // ④ 슬라이드
    screensW, // ⑤ 화면들
    400, // ⑥ 정보 표
    300, // ⑦ 결과 글
  ];
  const widths = contents.map((w) => w + PAD * 2);
  const lefts = widths.map((_, i) => widths.slice(0, i).reduce((a, b) => a + b, 0));
  const section = (i: number) => ({ left: lefts[i], width: widths[i] });

  return (
    <DetailTrack panels={widths} prev={prev} next={next}>
      {/* ① 개요 */}
      <Panel {...section(0)}>
        <Label x={PAD}>① 개요</Label>
        <TextBlock x={PAD} y={300} title={project.title} body={d.overview} />
        <TextBlock x={PAD} y={480} title="SOLUTIONS" body={d.solutions} />
        <Box x={PAD + 348} y={240} w={760} h={420} className="bg-bg-panel-strong">
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
      </Panel>

      {/* ② 문제 */}
      <Panel {...section(1)}>
        <Label x={PAD}>② 문제</Label>
        <TextBlock x={PAD} y={380} title="문제" body={d.problem} />
        <Box x={PAD + 360} y={240} w={560} h={420} className="border border-border-default bg-bg-panel">
          {d.problemImage ? (
            <Image src={d.problemImage} alt="" fill sizes="560px" className="object-cover" />
          ) : (
            <Placeholder>문제 상황 이미지</Placeholder>
          )}
        </Box>
      </Panel>

      {/* ③ 라이브 시연 */}
      <Panel {...section(2)}>
        <Label x={PAD} y={150}>
          ③ 라이브 시연
        </Label>
        <Box x={PAD} y={180} w={900} h={540} className="overflow-visible">
          <LiveDemo url={d.demo.url} device={d.demo.device} preview={d.demo.preview} />
        </Box>
      </Panel>

      {/* ④ 발표자료 */}
      <Panel {...section(3)}>
        <Label x={PAD}>④ 발표자료</Label>
        <Box x={PAD} y={240} w={640} h={440} className="overflow-visible">
          <SlideViewer slides={d.slides} note={d.slidesNote} />
        </Box>
      </Panel>

      {/* ⑤ 핵심 기능 화면: 모바일은 위 240, 데스크톱은 세로 가운데(위 310) */}
      <Panel {...section(4)}>
        <Label x={PAD}>⑤ 핵심 기능 화면</Label>
        {d.screens.map((screen, i) => {
          const [w, h, y] = screenSize(screen.device);
          const x = PAD + d.screens.slice(0, i).reduce((sum, s) => sum + screenSize(s.device)[0] + SCREEN_GAP, 0);
          return (
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
          );
        })}
      </Panel>

      {/* ⑥ 정보 */}
      <Panel {...section(5)}>
        <Label x={PAD}>⑥ 정보</Label>
        <InfoList x={PAD} y={280} items={d.info} />
      </Panel>

      {/* ⑦ 결과 */}
      <Panel {...section(6)}>
        <Label x={PAD}>⑦ 결과</Label>
        <TextBlock x={PAD} y={380} title="결과" body={d.result} />
      </Panel>
    </DetailTrack>
  );
}
