// 프로젝트 콘텐츠 — 사이트의 모든 Work 화면(SHOWCASE·LIST·SLIDER)과 상세 페이지가 여기서 읽는다.
// [대괄호] 값은 아직 정해지지 않은 자리표시. 내용을 붙여넣을 때 필드 이름은 그대로 두고 값만 바꾸면 된다.
// 이미지·영상 경로는 public/ 기준 (예: "/work/inform/hero.webp").

export type ProjectKind = "uiux" | "film" | "photobook";

// 상세 A · UI/UX (Figma 4:42) — ① 개요 ② 문제 ③ 라이브 시연 ④ 발표자료 ⑤ 핵심 기능 ⑥ 정보 ⑦ 결과
export type UiuxDetail = {
  overview: string; // ① 제목 아래 설명
  solutions: string; // ① SOLUTIONS
  hero?: string; // ① 대표 이미지
  problem: string; // ②
  problemImage?: string;
  demo: {
    url?: string; // ③ 실제 사이트 (없으면 미리보기만)
    device: "desktop" | "mobile"; // 처음 열릴 때 프레임 (Dang Square는 mobile)
    preview?: string; // 트랙에 보이는 미리보기 이미지
  };
  slides: string[]; // ④ PDF → 페이지별 WebP
  slidesNote?: string; // 슬라이드가 없을 때 안내
  screens: { label: string; device: "mobile" | "desktop"; src?: string }[]; // ⑤
  info: { label: string; lines: string[] }[]; // ⑥
  result: string; // ⑦
};

export type Project = {
  slug: string; // URL: /work/{slug}
  no: string; // "01"
  title: string; // 대문자 표기 그대로
  kind: ProjectKind; // 상세 페이지 구성 (A: uiux · B: film · C: photobook)
  summary: string; // 한 줄 소개 (LIST 왼쪽)
  roles: string; // 역할 (LIST 오른쪽)
  award?: string; // 수상 정보 (SHOWCASE 캡션 둘째 줄, 없으면 summary)
  icon: {
    label: string; // 앱 아이콘 이미지가 들어오기 전 타일에 보이는 글자
    src?: string; // 앱 아이콘 이미지
  };
  cover?: string; // 대표 스크린샷 (LIST·SLIDER)
  uiux?: UiuxDetail; // kind === "uiux"일 때
};

const uiuxPlaceholder = (title: string, device: "desktop" | "mobile"): UiuxDetail => ({
  overview: "[개요]",
  solutions: "[SOLUTIONS]",
  problem: "[문제]",
  demo: { device },
  slides: [],
  slidesNote: `[${title} 발표 PDF 변환 예정]`,
  screens: [
    { label: "[핵심 기능 1]", device: "mobile" },
    { label: "[핵심 기능 2]", device: "mobile" },
    { label: "[핵심 기능 3]", device: "desktop" },
  ],
  info: [
    { label: "기간", lines: ["[기간]"] },
    { label: "팀", lines: ["[팀 구성]"] },
    { label: "역할", lines: ["[역할]"] },
    { label: "내 툴", lines: ["[툴]"] },
  ],
  result: "[결과]",
});

// 순서 = 사이트 순서: Dang Square → IN:FORM → Antry → The Verdict → ICGE
export const projects: Project[] = [
  {
    slug: "dang-square",
    no: "01",
    title: "DANG SQUARE",
    kind: "uiux",
    summary: "[한 줄 소개]",
    roles: "[역할]",
    award: "인하대 넷제로 해커톤 · 장려상",
    icon: { label: "환경 로고" },
    uiux: uiuxPlaceholder("DANG SQUARE", "mobile"),
  },
  {
    slug: "inform",
    no: "02",
    title: "IN:FORM",
    kind: "uiux",
    summary: "교내 공지 아카이빙 웹/앱",
    roles: "UX/UI · 그래픽 · 프로토타입",
    icon: { label: "학교 로고" },
    uiux: {
      overview: "인하대 안에 흩어진 교내 공지를 한곳에 모아 보여주는 웹/앱",
      solutions: "UX/UI Design, 그래픽, 인터랙션 프로토타입, 반응형 웹",
      problem:
        "교내 공지사항과 학사일정이 여러 게시판에 파편화되어 있어, 학생들이 수강신청·장학금·공모전 등 필수 일정을 제때 확인하지 못하고 정보 탐색에 비효율을 겪는다.",
      demo: { url: "https://inha-inform.today", device: "desktop" },
      slides: [],
      slidesNote: "[IN:FORM 발표 PDF 제작 예정]",
      screens: [
        { label: "월간 ↔ 주간 캘린더", device: "mobile" },
        { label: "맞춤형 공지 태그 필터", device: "mobile" },
        { label: "어드민 공지 무결성 · 중복 관리", device: "desktop" },
      ],
      info: [
        { label: "기간", lines: ["v1 2026.01.29 – 04.12", "v2 2026.07.26 – 10.25"] },
        { label: "팀", lines: ["디자이너 1 · 프론트 2 · 백엔드 2"] },
        { label: "역할", lines: ["디자이너"] },
        { label: "내 툴", lines: ["Figma, Photoshop, Illustrator, ProtoPie, Framer"] },
        {
          label: "팀 기술",
          lines: [
            "React · Vite · Tailwind CSS",
            "Java · Spring Boot · JPA · MariaDB · Redis",
            "Python · Scrapy · Playwright · Solar Pro",
            "GCP · Ubuntu · Docker · GitHub Actions",
          ],
        },
      ],
      result:
        "인하대 학생 대상 1개월 라이브 베타 운영. 인앱 피드백으로 모은 실사용자 데이터를 바탕으로 캘린더 전환과 공지 필터링 구조를 재설계했다.",
    },
  },
  {
    slug: "antry",
    no: "03",
    title: "ANTRY",
    kind: "uiux",
    summary: "[한 줄 소개]",
    roles: "[역할]",
    icon: { label: "가방 로고" },
    uiux: uiuxPlaceholder("ANTRY", "desktop"),
  },
  {
    slug: "the-verdict",
    no: "04",
    title: "THE VERDICT",
    kind: "film",
    summary: "[한 줄 소개]",
    roles: "[역할]",
    icon: { label: "영화 로고" },
  },
  {
    slug: "icge",
    no: "05",
    title: "ICGE",
    kind: "photobook",
    summary: "[한 줄 소개]",
    roles: "[역할]",
    icon: { label: "책 로고" },
  },
];

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}

/** 사이트 순서상 이전·다음 프로젝트 (끝에서 처음으로 순환) */
export function getNeighbors(slug: string) {
  const i = projects.findIndex((p) => p.slug === slug);
  const n = projects.length;
  return { prev: projects[(i - 1 + n) % n], next: projects[(i + 1) % n] };
}
