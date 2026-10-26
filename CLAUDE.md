# SPRUCE — 포트폴리오 웹사이트

프로덕트 디자이너 엄태영(Taeyeong Um)의 포트폴리오 아카이빙·쇼잉 사이트.
작업물 5개를 인상적인 모션으로 보여주고, 클릭하면 상세 페이지로 들어간다.
화려하되 렉 없이 매끄럽고, 고화질이어야 한다.

## 디자인 원본: Figma

파일: https://www.figma.com/design/BccdvUHmOYNzJzyR20qgBa

화면을 만들 때는 반드시 해당 프레임을 Figma MCP(get_design_context)로 읽고 구현한다.
수치·컬러·폰트는 추측하지 말고 Figma 값을 따른다.

| 화면 | node-id |
| --- | --- |
| Work · SHOWCASE (메인) | 3:2 |
| Work · LIST | 3:43 |
| Work · SLIDER | 3:74 |
| 상세 A · UI/UX 가로 트랙 (IN:FORM 예시) | 4:42 |
| 상세 A · 라이브 시연 확대 | 4:128 |
| 상세 B · 영화 (The Verdict) | 5:52 |
| 상세 C · 포토북 (ICGE) | 5:105 |
| About · 사원증 앞면 | 5:185 |
| About · 사원증 뒷면 | 5:218 |
| Contact | 5:261 |
| 컴포넌트: Nav 2:34 · Button 2:41 · Placeholder 2:42 · ViewToggle 2:64 · ID Badge 5:184 | |

각 프레임 옆 노란 Note에 인터랙션 설명이 있다. 아래 "인터랙션 명세"와 같다.

## 기술 스택

- Next.js (App Router) + TypeScript
- Tailwind CSS — 컬러·폰트는 Figma 변수/텍스트 스타일을 CSS 변수로 옮겨 Tailwind 테마에 연결
- GSAP + ScrollTrigger (스크롤 연출), Motion (컴포넌트 전환·hover), Lenis (관성 스크롤)
- 사원증 물리: react-three-fiber + rapier 또는 2D 물리 — About 페이지에서만 dynamic import
- 포토북 넘김: 가벼운 page-flip 구현 — 포토북 페이지에서만 dynamic import
- 배포: GitHub → Vercel (push하면 자동 배포)
- 데이터베이스 없음. 콘텐츠는 `src/content/projects.ts` 한 파일에서 관리

## 디자인 토큰 (Figma "Wireframe Colors" / "WF" 텍스트 스타일)

Figma 변수 이름을 그대로 CSS 변수 이름으로 쓴다 (`bg/page` → `--bg-page`).
값은 항상 Figma에서 다시 읽어 확인한다 (사용자가 계속 수정함).

- 컬러: bg/page, bg/panel, bg/panel-strong, bg/dark, bg/dark-panel, text/primary, text/muted, text/inverse, text/muted-inverse, border/default, border/strong
- 텍스트 스타일: WF/Logo, WF/Nav, WF/Heading XL, WF/Heading L, WF/Title, WF/Body, WF/Caption, WF/Mono
- 폰트: Pretendard(본문 전반), LINE Seed Sans(로고·타이틀). 둘 다 직접 호스팅하고, 한글은 실제 쓰는 글자만 서브셋해서 불러온다.

## 페이지 구조

```
/                    Work (SHOWCASE 기본, 버튼 하나로 SHOWCASE → LIST → SLIDER 순환)
/work/dang-square    상세 A (UI/UX)
/work/inform         상세 A (UI/UX)
/work/antry          상세 A (UI/UX)
/work/the-verdict    상세 B (영화)
/work/icge           상세 C (포토북)
/about               사원증
/contact             연락처
```
프로젝트 순서: Dang Square → IN:FORM → Antry → The Verdict → ICGE → (다시 Dang Square)

## 인터랙션 명세

**공통**
- 전체 관성 스크롤(Lenis). 헤더: 왼쪽 SPRUCE 로고, 오른쪽 Work · About · Contact.

**Work · SHOWCASE**
- 앱 아이콘 타일 10장(5개 × 2)이 3D 원형 링으로 배치. CSS 3D(perspective + rotateY + translateZ)로 구현, 3D 라이브러리 쓰지 않음.
- 세로 스크롤 → 링 회전. 휠을 멈추면 관성으로 감속하다 정면 카드에 스냅.
- 회전 각도에 따라 아이콘 표면 하이라이트가 움직여 물체감.
- 정면 카드 hover → 커서 옆 "OPEN PROJECT" 라벨, 클릭 → 상세.
- 로고 아래 원형 버튼 1개: 누를 때마다 SHOWCASE → LIST → SLIDER 순환.

**Work · LIST / SLIDER**
- LIST: 스크롤하면 가운데 이미지 열이 위로 흐르고, 정면 프로젝트가 왼쪽 목록에서 강조.
- SLIDER: 세로 스크롤 → 가로로 무한 순환. 가운데 칸 위에 번호와 이름.
- 두 화면 모두 이미지는 실제 화면 스크린샷.

**상세 A · UI/UX (Dang Square · IN:FORM · Antry 공통 구조)**
- 세로 스크롤 → 트랙이 가로로 이동 (관성).
- 구성: ① 개요 → ② 문제 → ③ 라이브 시연 → ④ 발표자료 → ⑤ 핵심 기능 화면 → ⑥ 정보 → ⑦ 결과.
- 하단 가운데 진행률 0% → 100%. 헤더 가운데 "SCROLL UP TO PREVIOUS PROJECT" 고정.
- 끝에서 계속 스크롤하면 "SCROLL DOWN TO NEXT PROJECT" 글자가 왼쪽부터 차오르고, 다 차면 다음 프로젝트로 이동.
- ③ 라이브 시연: 트랙에서는 미리보기만. 클릭하면 확대되어 iframe 직접 조작, 확대 중에는 페이지 스크롤 잠금. ESC·바깥 클릭으로 닫힘. Desktop/Mobile 토글 시 프레임 크기가 모션으로 바뀜. iframe은 클릭 후에만 로드. Dang Square는 처음부터 폰 프레임.
- ④ 발표자료: PDF를 이미지(WebP/AVIF)로 변환한 슬라이드 뷰어.

**상세 B · 영화 (The Verdict)**
- 같은 가로 트랙·진행률·다음 프로젝트 장치. 어두운 배경.
- 작품 → 본편 → 장면 → 크레딧. 키 비주얼은 무음 루프 mp4, 본편은 재생 버튼 누를 때만 YouTube 로드.

**상세 C · 포토북 (ICGE)**
- 한 화면에 책이 양면(3:4 페이지)으로 펼쳐짐. 세로 스크롤·드래그·화살표로 한 장씩 넘김(종이가 휘는 모션).
- 챕터 버튼(Introduction · Rendition · Soulace)으로 바로 이동. 마지막 장 뒤에서 계속 스크롤하면 다음 프로젝트로.

**About · 사원증**
- 줄에 매달린 사원증 하나. 끌어서 놓으면 진자처럼 흔들리다 관성으로 멈춤(줄도 물리로 휨).
- 커서 위치에 따라 살짝 기울고 표면 빛이 움직임. 클릭하면 3D로 뒤집혀 뒷면.
- 배경 점 원은 카드 움직임에 물결처럼 반응.

**Contact**
- 이메일을 크게, 옆에 COPY 버튼. 아래 PHONE · GITHUB · BEHANCE · OPEN TO.

## 성능 규칙 (항상 지킴)

- 애니메이션은 transform·opacity만. layout을 바꾸는 속성(top, width 등)을 애니메이션하지 않는다.
- 60fps 유지. 스크롤 핸들러에서 매 프레임 DOM을 읽고 쓰지 않는다 (GSAP/rAF 사용).
- 무거운 라이브러리(물리, page-flip)는 해당 페이지에서만 dynamic import.
- 이미지는 next/image. 영상은 압축된 mp4/WebM, preload 최소. iframe·YouTube는 상호작용 후 로드.
- `prefers-reduced-motion` 사용자는 단순한 전환으로. 모바일은 모션 강도 낮춤.

## 미디어 규칙

- 원본은 `media-src/`(git 제외)에 두고, 변환본만 `public/`에 넣는다.
- PDF → 페이지별 WebP(2x). 영상 → H.264 mp4 + WebM, 미리보기 루프는 5~10초·수 MB.
- 100MB 넘는 파일은 git에 넣지 않는다.

## 작업 방식

- 사용자는 한 번에 하나씩 진행한다. 한 번에 기능 하나만 만들고, 끝나면 무엇을 했는지와 다음 할 일 하나만 알려준다.
- 기능 하나가 끝날 때마다 로컬에서 확인 → 커밋 → push(자동 배포).
- 설명은 한국어로.
