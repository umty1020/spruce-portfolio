"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useScrollLock } from "../DetailTrack";

// ③ 라이브 시연 (Figma 4:42 트랙 미리보기 · 4:128 확대 상태)
// 트랙에서는 미리보기만. 클릭하면 확대되고 그때 iframe을 처음 로드. 확대 중에는 페이지 스크롤 잠금.

type Device = "desktop" | "mobile";
type Props = { url?: string; device: Device; preview?: string };

const FRAME: Record<Device, { w: string; h: string }> = {
  desktop: { w: "min(1120px, calc(100vw - 64px))", h: "min(680px, calc(100dvh - 220px))" },
  mobile: { w: "390px", h: "min(680px, calc(100dvh - 220px))" },
};

const host = (url?: string) => (url ? new URL(url).host : "[시연 URL]");

export default function LiveDemo({ url, device: initial, preview }: Props) {
  const [device, setDevice] = useState<Device>(initial);
  const [open, setOpen] = useState(false);

  return (
    <>
      <DeviceToggle device={device} onChange={setDevice} className="absolute -top-[52px] right-0" />
      {/* 트랙 미리보기: 900 × 540 브라우저 프레임 */}
      <div className="absolute inset-0 overflow-hidden border-2 border-border-strong bg-bg-page">
        <Toolbar url={url} height={36} />
        <div className="absolute top-[34px] left-0 flex h-[502px] w-[896px] flex-col items-center justify-center gap-[16px] bg-bg-panel">
          {preview && <Image src={preview} alt="" fill sizes="900px" className="object-cover" />}
          <p className="wf-mono relative text-text-muted">{url ? "실제 사이트 미리보기" : "[시연 URL 준비 중]"}</p>
          <button
            type="button"
            disabled={!url}
            onClick={() => setOpen(true)}
            className="relative flex h-[48px] w-[220px] cursor-pointer items-center justify-between rounded-full bg-bg-dark pr-[16px] pl-[24px] font-display text-[17px] leading-normal font-bold text-text-inverse disabled:cursor-not-allowed disabled:opacity-40"
          >
            클릭해서 직접 써보기
            <Image src="/icons/arrow-up-right.svg" alt="" width={17} height={17} unoptimized />
          </button>
        </div>
      </div>
      {open && url && <DemoModal url={url} device={device} onDevice={setDevice} onClose={() => setOpen(false)} />}
    </>
  );
}

function DemoModal({ url, device, onDevice, onClose }: { url: string; device: Device; onDevice: (d: Device) => void; onClose: () => void }) {
  const { lock, unlock } = useScrollLock();
  const frameRef = useRef<HTMLDivElement>(null);
  const lastRect = useRef<DOMRect | null>(null);

  useEffect(() => {
    lock();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      unlock();
      window.removeEventListener("keydown", onKey);
    };
  }, [lock, unlock, onClose]);

  // Desktop ↔ Mobile: 크기는 바로 바꾸고, 이전 크기에서 transform으로 늘어나듯 보이게 (FLIP)
  useLayoutEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const next = el.getBoundingClientRect();
    const prev = lastRect.current;
    lastRect.current = next;
    if (!prev || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.animate(
      [
        { transform: `scale(${prev.width / next.width}, ${prev.height / next.height})` },
        { transform: "scale(1, 1)" },
      ],
      { duration: 450, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
    );
  }, [device]);

  return createPortal(
    <div className="demo-overlay" role="dialog" aria-modal aria-label="라이브 시연">
      <button type="button" className="demo-dim cursor-pointer" aria-label="닫기" onClick={onClose} />
      <DeviceToggle device={device} onChange={onDevice} inverse className="absolute top-[52px] left-1/2 -translate-x-1/2" />
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="absolute top-[50px] right-[40px] flex size-[44px] cursor-pointer items-center justify-center rounded-full border border-bg-page"
      >
        <Image src="/icons/close.svg" alt="" width={16} height={16} unoptimized />
      </button>

      <div
        ref={frameRef}
        className={`demo-frame ${device === "mobile" ? "rounded-[28px]" : ""}`}
        style={{ "--frame-w": FRAME[device].w, "--frame-h": FRAME[device].h } as CSSProperties}
      >
        <div className="relative h-[40px]">
          <Toolbar url={url} height={40} />
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="wf-caption absolute top-[10px] right-[16px] text-text-muted max-md:hidden"
          >
            새 탭에서 열기 ↗
          </a>
        </div>
        <iframe src={url} title="라이브 시연" className="h-[calc(100%-40px)] w-full bg-bg-panel" />
      </div>

      <p className="wf-caption pointer-events-none absolute bottom-[40px] left-1/2 -translate-x-1/2 text-text-muted-inverse">
        ESC 또는 바깥을 클릭하면 닫혀요
      </p>
    </div>,
    document.body,
  );
}

function Toolbar({ url, height }: { url?: string; height: number }) {
  const dotTop = (height - 10) / 2;
  return (
    <div className="absolute inset-x-0 top-0 border-b border-border-default bg-bg-page" style={{ height }}>
      {[14, 32, 50].map((left) => (
        <Image key={left} src="/icons/browser-dot.svg" alt="" width={10} height={10} unoptimized className="absolute" style={{ left, top: dotTop }} />
      ))}
      <span className="wf-mono absolute left-[84px] rounded-[12px] bg-bg-panel px-[14px] py-[4px] text-text-muted" style={{ top: dotTop - 7 }}>
        {host(url)}
      </span>
    </div>
  );
}

// Figma 4:76 · 4:133 Desktop / Mobile 토글 (inverse = 어두운 배경 위)
function DeviceToggle({ device, onChange, inverse = false, className = "" }: { device: Device; onChange: (d: Device) => void; inverse?: boolean; className?: string }) {
  const on = inverse ? "bg-bg-page text-text-primary" : "bg-bg-dark text-text-inverse";
  const off = inverse ? "text-text-inverse" : "text-text-primary";
  return (
    <div className={`flex overflow-hidden rounded-full border ${inverse ? "border-bg-page" : "border-border-strong"} ${className}`} role="group" aria-label="화면 크기">
      {(["desktop", "mobile"] as const).map((d) => (
        <button
          key={d}
          type="button"
          aria-pressed={device === d}
          onClick={() => onChange(d)}
          className={`wf-caption flex cursor-pointer items-center px-[18px] ${inverse ? "h-[40px]" : "h-[36px]"} ${device === d ? on : off}`}
        >
          {d === "desktop" ? "Desktop" : "Mobile"}
        </button>
      ))}
    </div>
  );
}
