"use client";

import Image from "next/image";
import { useState } from "react";

// ② 본편 (Figma 5:70): 재생 버튼을 눌러야 YouTube를 로드
export default function FilmPlayer({ youtubeId, title }: { youtubeId?: string; title: string }) {
  const [playing, setPlaying] = useState(false);

  if (playing && youtubeId) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`}
        title={`${title} 본편`}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        className="absolute inset-0 size-full"
      />
    );
  }

  return (
    <button
      type="button"
      disabled={!youtubeId}
      onClick={() => setPlaying(true)}
      aria-label={`${title} 본편 재생`}
      className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-[18px] disabled:cursor-not-allowed"
    >
      <Image src="/icons/play.svg" alt="" width={88} height={88} unoptimized className={youtubeId ? "" : "opacity-40"} />
      <span className="wf-mono text-text-muted-inverse">{youtubeId ? "본편 영상 · YouTube" : "[YouTube 링크 준비 중]"}</span>
    </button>
  );
}
