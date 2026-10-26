"use client";

import { useEffect, useRef } from "react";

// 키 비주얼: 무음 루프 영상. 화면 가까이 올 때만 src를 붙이고 재생, 벗어나면 멈춤 (preload 최소)
export default function KeyVisual({ video, webm, poster }: { video: string; webm?: string; poster?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!el.dataset.loaded) {
            el.querySelectorAll("source").forEach((s) => (s.src = s.dataset.src ?? ""));
            el.load();
            el.dataset.loaded = "1";
          }
          if (!reduce) el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { rootMargin: "0px 400px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <video ref={ref} className="absolute inset-0 size-full object-cover" poster={poster} muted loop playsInline preload="none">
      {webm && <source data-src={webm} type="video/webm" />}
      <source data-src={video} type="video/mp4" />
    </video>
  );
}
