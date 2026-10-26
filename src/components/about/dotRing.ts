// 사원증 뒤 점 원 (Figma Dot Ring 5:188): 방사형 선 160개, 반지름 260~300, 2px, bg/panel 색.
// 선마다 작은 스프링이 있고 이웃과 이어져 있어, 한 곳을 치면 물결이 원을 따라 퍼진다.

const N = 160;
const R_IN = 260;
const R_OUT = 300;
const SIZE = 600;
const WAVE = 900; // 이웃으로 전달되는 세기 (파동 속도²)
const SPRING = 60; // 제자리로 돌아오는 힘
const DAMP = 2.2; // 감쇠 (1/s)
const MAX = 16; // 최대 변위(px)

export function createDotRing(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = SIZE * dpr;
  canvas.height = SIZE * dpr;
  const styles = getComputedStyle(canvas);
  const base = parse(styles.getPropertyValue("--bg-panel")) ?? [228, 228, 224];
  const strong = parse(styles.getPropertyValue("--border-default")) ?? [184, 184, 178];

  const offset = new Float32Array(N);
  const velocity = new Float32Array(N);
  let energy = 0;

  const draw = () => {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.lineWidth = 2;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      const o = offset[i];
      const t = Math.min(Math.abs(o) / MAX, 1);
      ctx.strokeStyle = `rgb(${mix(base[0], strong[0], t)} ${mix(base[1], strong[1], t)} ${mix(base[2], strong[2], t)})`;
      ctx.beginPath();
      ctx.moveTo(SIZE / 2 + c * (R_IN + o), SIZE / 2 + s * (R_IN + o));
      ctx.lineTo(SIZE / 2 + c * (R_OUT + o), SIZE / 2 + s * (R_OUT + o));
      ctx.stroke();
    }
  };

  return {
    draw,
    /** angle 방향(라디안, 화면 좌표)의 선을 amount만큼 밀어냄 */
    excite(angle: number, amount: number) {
      const center = Math.round(((angle / (Math.PI * 2)) * N + N) % N);
      for (let d = -3; d <= 3; d++) {
        const i = (center + d + N) % N;
        velocity[i] += amount * Math.exp(-(d * d) / 4);
      }
      energy = 1;
    },
    /** 한 스텝 진행. 조용해지면 false */
    step(dt: number) {
      if (energy < 1e-3) return false;
      energy = 0;
      for (let i = 0; i < N; i++) {
        const l = offset[(i - 1 + N) % N];
        const r = offset[(i + 1) % N];
        const acc = WAVE * (l + r - 2 * offset[i]) * 0.01 - SPRING * offset[i];
        velocity[i] = (velocity[i] + acc * dt) * Math.exp(-DAMP * dt);
      }
      for (let i = 0; i < N; i++) {
        offset[i] = Math.max(-MAX, Math.min(MAX, offset[i] + velocity[i] * dt));
        energy += Math.abs(offset[i]) + Math.abs(velocity[i]) * 0.05;
      }
      draw();
      return energy >= 1e-3;
    },
  };
}

function mix(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

function parse(hex: string): [number, number, number] | null {
  const m = hex.trim().match(/^#([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
