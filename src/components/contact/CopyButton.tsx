"use client";

import { useEffect, useState } from "react";

// Figma 5:269 COPY — 누르면 클립보드에 복사하고 잠깐 COPIED 표시
export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // 클립보드 권한이 없으면 아무 것도 하지 않음 (메일 보내기 버튼이 대안)
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-live="polite"
      className="wf-mono flex h-[44px] shrink-0 cursor-pointer items-center rounded-full border border-border-strong px-[16px] text-text-primary"
    >
      {copied ? "COPIED" : "COPY"}
    </button>
  );
}
