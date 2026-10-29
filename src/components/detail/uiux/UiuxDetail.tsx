import Image from "next/image";
import type { Project, UiuxDetail as Detail } from "@/content/projects";
import { getNeighbors } from "@/content/projects";
import DetailTrack from "../DetailTrack";
import { Box, InfoList, Label, Panel, Placeholder, TextBlock } from "../parts";
import LiveDemo from "./LiveDemo";
import SlideViewer from "./SlideViewer";

// 상세 A · UI/UX (Figma 4:42) — 섹션 하나 = 한 장(1440 × 900). 한 번 밀면 한 장씩 화면 가운데에 맞춰짐.
// 각 장의 콘텐츠는 가로 가운데(720)에 맞춰 배치하고, 섹션 라벨은 콘텐츠 왼쪽 위(y 200).
// 크기는 Figma 값 그대로: 대표 이미지 760 × 420, 시연 프레임 900 × 540, 슬라이드 640 × 360, 화면 200 × 420 · 440 × 280.

const SECTIONS = 7;

export default function UiuxDetail({ project }: { project: Project & { uiux: Detail } }) {
  const d = project.uiux;
  const { prev, next } = getNeighbors(project.slug);

  return (
    <DetailTrack panels={SECTIONS} prev={prev} next={next}>
      {/* ① 개요 — 설명 340 + 간격 60 + 대표 이미지 760 = 1160 → x 140 ~ 1300 */}
      <Panel index={0}>
        <Label x={140}>① 개요</Label>
        <TextBlock x={140} y={300} title={project.title} body={d.overview} />
        <TextBlock x={140} y={480} title="SOLUTIONS" body={d.solutions} />
        <Box x={540} y={240} w={760} h={420} className="bg-bg-panel-strong">
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

      {/* ② 문제 — 글 300 + 간격 100 + 이미지 560 = 960 → x 240 ~ 1200 */}
      <Panel index={1}>
        <Label x={240}>② 문제</Label>
        <TextBlock x={240} y={380} title="문제" body={d.problem} />
        <Box x={640} y={240} w={560} h={420} className="border border-border-default bg-bg-panel">
          {d.problemImage ? (
            <Image src={d.problemImage} alt="" fill sizes="560px" className="object-cover" />
          ) : (
            <Placeholder>문제 상황 이미지</Placeholder>
          )}
        </Box>
      </Panel>

      {/* ③ 라이브 시연 — 프레임 900 → x 270 ~ 1170 */}
      <Panel index={2}>
        <Label x={270} y={150}>
          ③ 라이브 시연
        </Label>
        <Box x={270} y={180} w={900} h={540} className="overflow-visible">
          <LiveDemo url={d.demo.url} device={d.demo.device} preview={d.demo.preview} />
        </Box>
      </Panel>

      {/* ④ 발표자료 — 슬라이드 640 → x 400 ~ 1040 */}
      <Panel index={3}>
        <Label x={400}>④ 발표자료</Label>
        <Box x={400} y={240} w={640} h={440} className="overflow-visible">
          <SlideViewer slides={d.slides} note={d.slidesNote} />
        </Box>
      </Panel>

      {/* ⑤ 핵심 기능 화면 — 화면들 16 간격, 전체 폭 가운데 정렬 */}
      <Panel index={4}>
        {(() => {
          const items = screenLayout(d.screens);
          return (
            <>
              <Label x={items[0]?.x ?? 0}>⑤ 핵심 기능 화면</Label>
              {items.map(({ screen, x, y, w, h }) => (
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
            </>
          );
        })()}
      </Panel>

      {/* ⑥ 정보 — 표 폭 400 → x 520 ~ 920 */}
      <Panel index={5}>
        <Label x={520}>⑥ 정보</Label>
        <InfoList x={520} y={280} items={d.info} />
      </Panel>

      {/* ⑦ 결과 — 글 300 → x 570 ~ 870 */}
      <Panel index={6}>
        <Label x={570}>⑦ 결과</Label>
        <TextBlock x={570} y={380} title="결과" body={d.result} />
      </Panel>
    </DetailTrack>
  );
}

// ⑤ 화면들을 16 간격으로 이어 붙이고 장 가운데(720)에 맞춤: 모바일은 위 240, 데스크톱은 세로 가운데(위 310)
function screenLayout(screens: Detail["screens"]) {
  const sizes = screens.map((s) => (s.device === "mobile" ? [200, 420, 240] : [440, 280, 310]));
  const total = sizes.reduce((sum, [w]) => sum + w, 0) + 16 * Math.max(0, screens.length - 1);
  let x = 720 - total / 2;
  return screens.map((screen, i) => {
    const [w, h, y] = sizes[i];
    const item = { screen, x, y, w, h };
    x += w + 16;
    return item;
  });
}
