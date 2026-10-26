// 프로젝트 콘텐츠 — 사이트의 모든 Work 화면(SHOWCASE·LIST·SLIDER)과 상세 페이지가 여기서 읽는다.
// [대괄호] 값은 아직 정해지지 않은 자리표시. 내용을 붙여넣을 때 필드 이름은 그대로 두고 값만 바꾸면 된다.

export type ProjectKind = "uiux" | "film" | "photobook";

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
    src?: string; // 앱 아이콘 이미지 (public/ 기준 경로)
  };
  cover?: string; // 대표 스크린샷 (LIST·SLIDER, public/ 기준 경로)
};

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
  },
  {
    slug: "inform",
    no: "02",
    title: "IN:FORM",
    kind: "uiux",
    summary: "교내 공지 아카이빙 웹/앱",
    roles: "UX/UI · 그래픽 · 프로토타입",
    icon: { label: "학교 로고" },
  },
  {
    slug: "antry",
    no: "03",
    title: "ANTRY",
    kind: "uiux",
    summary: "[한 줄 소개]",
    roles: "[역할]",
    icon: { label: "가방 로고" },
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
