// 사이트 공통 문구
export const site = {
  intro: "[한 줄 소개]", // Work 화면 오른쪽 위
  copyright: "© 2026 SPRUCE",
};

// About 사원증 (Figma 5:185 앞면 · 5:218 뒷면)
export const about = {
  front: {
    label: "ID Badge",
    year: "2026",
    name: "Taeyeong Um",
    role: "Product Designer",
    brand: "SPRUCE",
    location: "Incheon, South Korea",
  },
  back: {
    headline: ["Leading to a", "single path"],
    body: "A product designer with a broad background and diverse skill set, bridging the gap between design and development while elevating aesthetic quality.",
    school: ["Inha University", "", "Industrial Engineering", "& Design Convergence"],
    handle: "[umty1020]",
  },
  hint: { front: "끌어서 흔들기 · 클릭해서 뒤집기", back: "다시 클릭하면 앞면으로" },
};

// Contact (Figma 5:261)
export const contact = {
  email: "djaxodud1020@naver.com",
  items: [
    { label: "PHONE", value: "+82 10 6569 6202", href: "tel:+821065696202" },
    { label: "GITHUB", value: "@umty1020 ↗", href: "https://github.com/umty1020" },
    { label: "BEHANCE", value: "behance.net/umtaeyeong ↗", href: "https://www.behance.net/umtaeyeong" },
    { label: "OPEN TO", value: "협업 · 인턴" },
  ],
};
