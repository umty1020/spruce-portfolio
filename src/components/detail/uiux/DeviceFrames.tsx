import Image from "next/image";

// ⑤ 핵심 기능 화면 목업 (모양은 detail.css)

/** 아이폰 17: 테두리 + 다이내믹 아일랜드만. 화면 이미지는 상태바 글자를 지우고 그 자리를 맨 윗줄 색으로 채운 것 */
export function PhoneFrame({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="phone-frame">
      <span className="phone-btn is-left" style={{ top: 78, height: 18 }} aria-hidden />
      <span className="phone-btn is-left" style={{ top: 112, height: 34 }} aria-hidden />
      <span className="phone-btn is-left" style={{ top: 154, height: 34 }} aria-hidden />
      <span className="phone-btn is-right" style={{ top: 120, height: 54 }} aria-hidden />
      <div className="phone-screen">
        <Image src={src} alt={alt} fill sizes="182px" className="object-cover object-top" />
      </div>
      <span className="phone-island" aria-hidden />
    </div>
  );
}

/** 맥북: 화면 460 × 298 (위쪽부터 보임) */
export function LaptopFrame({ src, alt }: { src: string; alt: string }) {
  return (
    <>
      <div className="laptop-lid">
        <div className="laptop-screen">
          <Image src={src} alt={alt} fill sizes="460px" className="object-cover object-top" />
        </div>
        <span className="laptop-notch" aria-hidden />
      </div>
      <div className="laptop-base" aria-hidden />
    </>
  );
}
