import Image from "next/image";
import type { FilmDetail as Detail, Project } from "@/content/projects";
import { getNeighbors } from "@/content/projects";
import DetailTrack from "../DetailTrack";
import { Box, InfoList, Label, Placeholder } from "../parts";
import KeyVisual from "./KeyVisual";
import FilmPlayer from "./FilmPlayer";

// 상세 B · 영화 (Figma 5:52) — 어두운 배경, 위치는 Figma 디자인 단위
const TRACK_WIDTH = 4980;
const STILLS = [
  { x: 2800, y: 240 },
  { x: 3240, y: 330 },
  { x: 2900, y: 500 },
];

export default function FilmDetail({ project }: { project: Project & { film: Detail } }) {
  const d = project.film;
  const { prev, next } = getNeighbors(project.slug);

  return (
    <DetailTrack width={TRACK_WIDTH} nextAt={[4300, 4880]} prev={prev} next={next} dark>
      {/* ① 작품 */}
      <Label x={32} dark>
        ① 작품
      </Label>
      <div className="absolute top-[330px] left-[32px] flex w-[340px] flex-col items-start gap-[14px]">
        <p className="text-[28px] leading-normal font-bold tracking-[1.12px] text-text-inverse">{project.title}</p>
        <p className="text-[15px] leading-[1.6] text-text-muted-inverse">{d.subtitle}</p>
        <p className="wf-body text-text-muted-inverse">{d.synopsis}</p>
        {d.badge && <p className="wf-caption border border-bg-page px-[12px] py-[6px] text-text-inverse">{d.badge}</p>}
      </div>
      <Box x={520} y={200} w={920} h={518} className="bg-bg-dark-panel">
        {d.keyVisual.video ? (
          <KeyVisual video={d.keyVisual.video} webm={d.keyVisual.webm} poster={d.keyVisual.poster} />
        ) : d.keyVisual.poster ? (
          <Image src={d.keyVisual.poster} alt="" fill sizes="920px" className="object-cover" priority />
        ) : (
          <Placeholder dark>키 비주얼 · 대표 스틸 (무음 미리보기 루프 mp4)</Placeholder>
        )}
      </Box>

      {/* ② 본편 */}
      <Label x={1600} y={100} dark>
        ② 본편
      </Label>
      <Box x={1600} y={135} w={1120} h={630} className="border border-text-muted bg-bg-dark-panel">
        <FilmPlayer youtubeId={d.youtubeId} title={project.title} />
      </Box>

      {/* ③ 장면 */}
      <Label x={2800} dark>
        ③ 장면
      </Label>
      {d.stills.slice(0, STILLS.length).map((still, i) => (
        <Box key={still.label} x={STILLS[i].x} y={STILLS[i].y} w={420} h={236} className="bg-bg-dark-panel">
          {still.src ? (
            <Image src={still.src} alt={still.label} fill sizes="420px" className="object-cover" />
          ) : (
            <Placeholder dark>{still.label}</Placeholder>
          )}
        </Box>
      ))}

      {/* ④ 크레딧 */}
      <Label x={3780} dark>
        ④ 크레딧
      </Label>
      <InfoList x={3780} y={341} items={d.credits} labelWidth={88} valueWidth={348} dark />
    </DetailTrack>
  );
}
