"use client";

import { useEffect, useRef, useState } from "react";
import { about } from "@/content/site";
import CursorLabel from "@/components/work/CursorLabel";
import { BadgeFront, BadgeBack } from "./IdBadge";
import { createDotRing } from "./dotRing";
import "./about.css";

// 줄에 매달린 사원증: Verlet 2D 물리 (라이브러리 없음)
// 입자: 0 = 고정점(화면 위), 1..ROPE = 줄, A = 카드 클립 고리, B = 카드 아래 가운데
// 좌표는 Figma 디자인 단위(x: 화면 가운데 기준, y: 위에서부터)

const ROPE = 10;
const ANCHOR_Y = -6;
const ROPE_LEN = 290; // 고정점 → 클립 고리 (Figma: 줄 250 + 클립 36, 카드 위 280)
const CARD_LEN = 396; // 클립 고리(카드 y 12) → 카드 아래(카드 y 408)
const GRAVITY = 6000; // 한 번 흔들리는 데 약 1.8초 (실제 목걸이 줄 정도의 무게감)
const SUBSTEP = 1 / 240;
const ITERATIONS = 14;
const AIR = 0.9925; // 스텝당 속도 유지율 (1초에 약 16%) → 2~3번 흔들리고 멈춤
const DRAG_GAIN = 0.18; // 끌 때 스텝마다 포인터 쪽으로 따라가는 비율 (작을수록 묵직하게 늦게 따라옴)
const MAX_SPEED = 1200; // 끌기·던지기 속도 상한(px/s) — 세게 휘둘러도 과하게 날아가지 않게
const RING_CENTER_Y = 440;
const TILT = 10; // 커서 기울기 최대(도)

export default function BadgeScene() {
  const [flipped, setFlipped] = useState(false);
  const [hovering, setHovering] = useState(false);
  const flippedRef = useRef(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const card3dRef = useRef<HTMLDivElement>(null);
  const strapRef = useRef<SVGPolylineElement>(null);
  const clipRef = useRef<SVGRectElement>(null);
  const ringRef = useRef<HTMLCanvasElement>(null);
  const wakeRef = useRef<() => void>(() => {});

  const toggleFlip = () => {
    flippedRef.current = !flippedRef.current;
    setFlipped(flippedRef.current);
    wakeRef.current();
  };

  useEffect(() => {
    const stage = stageRef.current!;
    const card = cardRef.current!;
    const card3d = card3dRef.current!;
    const strap = strapRef.current!;
    const clip = clipRef.current!;
    const ring = createDotRing(ringRef.current!);
    ring.draw();

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const tiltMax = finePointer ? TILT : 0;

    // 입자 배열
    const count = ROPE + 3;
    const A = ROPE + 1;
    const B = ROPE + 2;
    const x = new Float64Array(count);
    const y = new Float64Array(count);
    const px = new Float64Array(count);
    const py = new Float64Array(count);
    const inv = new Float64Array(count);
    const seg = ROPE_LEN / (ROPE + 1);
    for (let i = 0; i <= A; i++) {
      x[i] = 0;
      y[i] = ANCHOR_Y + seg * i;
      inv[i] = i === 0 ? 0 : 1;
    }
    // 카드는 줄보다 훨씬 무거움 → 줄이 카드에 끌려다니지 않음
    inv[A] = 1 / 12;
    inv[B] = 1 / 12;
    x[B] = 0;
    y[B] = y[A] + CARD_LEN;
    // 처음엔 살짝 비스듬히 매달려 있다가 흔들리며 자리 잡음
    if (!reduce) x[B] = 24;
    px.set(x);
    py.set(y);

    let scale = 1;
    const resize = () => {
      scale = Math.min(1, window.innerHeight / 900);
      stage.style.transform = `scale(${scale})`;
    };
    resize();

    // 포인터 상태 (디자인 좌표)
    let pointerX = 0;
    let pointerY = -9999;
    let hover = false;
    let drag: { t: number; startX: number; startY: number; startTime: number; moved: boolean } | null = null;
    const toDesign = (e: PointerEvent) => {
      pointerX = (e.clientX - window.innerWidth / 2) / scale;
      pointerY = e.clientY / scale;
    };

    // 표시 상태
    let tiltX = 0;
    let tiltY = 0;
    let flip = 0;

    const constrain = (i: number, j: number, len: number, rope: boolean) => {
      const dx = x[j] - x[i];
      const dy = y[j] - y[i];
      const d = Math.hypot(dx, dy) || 1e-6;
      if (rope && d <= len) return; // 줄은 늘어나는 것만 막음 (느슨해질 수 있음)
      const w = inv[i] + inv[j];
      if (w === 0) return;
      const k = (d - len) / d / w;
      x[i] += dx * k * inv[i];
      y[i] += dy * k * inv[i];
      x[j] -= dx * k * inv[j];
      y[j] -= dy * k * inv[j];
    };

    const maxStep = MAX_SPEED * SUBSTEP; // 스텝당 최대 이동(px)
    const step = (dt: number) => {
      for (let i = 1; i < count; i++) {
        let vx = (x[i] - px[i]) * AIR;
        let vy = (y[i] - py[i]) * AIR;
        // 속도 상한 (놓을 때 휙 날아가지 않게)
        const v = Math.hypot(vx, vy);
        if (v > maxStep) {
          vx *= maxStep / v;
          vy *= maxStep / v;
        }
        px[i] = x[i];
        py[i] = y[i];
        x[i] += vx;
        y[i] += vy + GRAVITY * dt * dt;
      }
      if (drag) {
        // 잡은 점(A→B 사이 t)을 포인터 쪽으로 조금씩 끌어감 → 무게 때문에 살짝 늦게 따라옴
        // A·B에 나눠 걸어서 아래쪽을 잡으면 회전도 생김
        const t = drag.t;
        const gx = x[A] + (x[B] - x[A]) * t;
        const gy = y[A] + (y[B] - y[A]) * t;
        let dx = (pointerX - gx) * DRAG_GAIN;
        let dy = (pointerY - gy) * DRAG_GAIN;
        const d = Math.hypot(dx, dy);
        if (d > maxStep) {
          dx *= maxStep / d;
          dy *= maxStep / d;
        }
        const w = 1 / ((1 - t) ** 2 + t ** 2);
        x[A] += dx * w * (1 - t);
        y[A] += dy * w * (1 - t);
        x[B] += dx * w * t;
        y[B] += dy * w * t;
      }
      for (let it = 0; it < ITERATIONS; it++) {
        for (let i = 0; i < A; i++) constrain(i, i + 1, seg, true);
        constrain(A, B, CARD_LEN, false);
      }
    };

    let raf = 0;
    let last = 0;
    let acc = 0;
    let lastCx = 0;
    let lastCy = 0;

    const render = (dt: number) => {
      // 줄
      let points = "";
      for (let i = 0; i < A; i++) points += `${x[i]},${y[i]} `;
      strap.setAttribute("points", points);
      const ang = Math.atan2(y[A] - y[A - 1], x[A] - x[A - 1]) * (180 / Math.PI) - 90;
      clip.setAttribute("transform", `translate(${x[A - 1]} ${y[A - 1]}) rotate(${ang})`);

      // 카드: 클립 고리 기준 이동·회전
      const theta = Math.atan2(-(x[B] - x[A]), y[B] - y[A]);
      card.style.transform = `translate(${x[A]}px, ${y[A] - 12}px) rotate(${theta}rad)`;

      // 카드 중심 속도 → 3D 흔들림 + 점 원 물결
      const cx = (x[A] + x[B]) / 2;
      const cy = (y[A] + y[B]) / 2;
      const vx = (cx - lastCx) / dt;
      const vy = (cy - lastCy) / dt;
      lastCx = cx;
      lastCy = cy;
      const speed = Math.hypot(vx, vy);
      if (speed > 40) ring.excite(Math.atan2(vy, vx), Math.min(speed * 0.05, 80));

      // 커서 기울기 (카드 좌표계로 돌려서 계산)
      let tx = 0;
      let ty = 0;
      if (hover && !drag && tiltMax) {
        const dx = pointerX - cx;
        const dy = pointerY - cy;
        const lx = dx * Math.cos(-theta) - dy * Math.sin(-theta);
        const ly = dx * Math.sin(-theta) + dy * Math.cos(-theta);
        ty = clamp(lx / 150) * tiltMax;
        tx = -clamp(ly / 210) * tiltMax;
      }
      const ease = 1 - Math.exp(-dt * 10);
      tiltX += (tx - tiltX) * ease;
      tiltY += (ty + clamp(vx / 2500) * 5 - tiltY) * ease; // 흔들릴 때 3D 비틀림은 살짝만
      const flipTarget = flippedRef.current ? 180 : 0;
      flip = reduce ? flipTarget : flip + (flipTarget - flip) * (1 - Math.exp(-dt * 9));
      card3d.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY + flip}deg)`;
      card3d.style.setProperty("--lx", (tiltY * 3).toFixed(2));
      card3d.style.setProperty("--ly", (-tiltX * 3).toFixed(2));

      return speed > 2 || Math.abs(tx - tiltX) + Math.abs(ty - tiltY) > 0.05 || Math.abs(flipTarget - flip) > 0.1;
    };

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      if (!reduce) {
        acc += dt;
        while (acc >= SUBSTEP) {
          step(SUBSTEP);
          acc -= SUBSTEP;
        }
      }
      const moving = render(Math.max(dt, 1e-3));
      const rippling = ring.step(dt);
      if (moving || rippling || drag || hover) raf = requestAnimationFrame(frame);
      else raf = 0;
    };

    const wake = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    wakeRef.current = wake;

    // 포인터: 카드에서 누르면 잡기, 거의 안 움직이고 놓으면 뒤집기
    const onDown = (e: PointerEvent) => {
      toDesign(e);
      card.setPointerCapture(e.pointerId);
      const abx = x[B] - x[A];
      const aby = y[B] - y[A];
      const t = clamp01(((pointerX - x[A]) * abx + (pointerY - y[A]) * aby) / (abx * abx + aby * aby));
      drag = { t, startX: e.clientX, startY: e.clientY, startTime: performance.now(), moved: false };
      if (reduce) drag.t = -1; // 끌기 없음, 클릭만
      wake();
    };
    const onMove = (e: PointerEvent) => {
      toDesign(e);
      if (drag && Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > 6) drag.moved = true;
      if (hover || drag) wake();
    };
    const onUp = () => {
      if (!drag) return;
      const tap = !drag.moved && performance.now() - drag.startTime < 400;
      drag = null;
      if (tap) toggleFlip();
      wake();
    };
    const onEnter = () => {
      hover = true;
      setHovering(true);
      wake();
    };
    const onLeave = () => {
      hover = false;
      setHovering(false);
      wake();
    };

    card.addEventListener("pointerdown", onDown);
    card.addEventListener("pointerenter", onEnter);
    card.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("resize", resize);
    wake();
    return () => {
      cancelAnimationFrame(raf);
      card.removeEventListener("pointerdown", onDown);
      card.removeEventListener("pointerenter", onEnter);
      card.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="about-scene">
      <div ref={stageRef} className="about-stage">
        <canvas ref={ringRef} className="about-ring" style={{ top: RING_CENTER_Y - 300 }} aria-hidden />
        <svg className="about-rope" viewBox="-720 0 1440 900" aria-hidden>
          <polyline ref={strapRef} fill="none" stroke="var(--bg-dark-panel)" strokeWidth={36} strokeLinejoin="round" />
          {/* Figma Clip 5:187: 24 × 36, 테두리 3, 모서리 10 — 줄 끝에서 카드 고리까지 */}
          <rect
            ref={clipRef}
            x={-12}
            y={-4}
            width={24}
            height={36}
            rx={10}
            fill="none"
            stroke="var(--text-muted)"
            strokeWidth={3}
          />
        </svg>
        <div
          ref={cardRef}
          className="about-card"
          role="button"
          tabIndex={0}
          aria-pressed={flipped}
          aria-label="사원증 뒤집기"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleFlip();
            }
          }}
        >
          <div ref={card3dRef} className="about-card3d">
            <BadgeFront />
            <BadgeBack />
          </div>
        </div>
      </div>

      <p className="wf-caption pointer-events-none absolute bottom-[86px] left-1/2 -translate-x-1/2 text-text-muted">
        {flipped ? about.hint.back : about.hint.front}
      </p>

      <CursorLabel visible={hovering} label="DRAG" mark="ring" />
    </div>
  );
}

const clamp = (v: number) => Math.max(-1, Math.min(1, v));
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
