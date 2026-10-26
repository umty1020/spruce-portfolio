import Image from "next/image";
import { about } from "@/content/site";

// Figma ID Badge 5:184 — 300 × 420 케이스 안에 272 × 392 카드. 앞·뒷면 두 장을 겹쳐 3D로 뒤집는다.

const MONO = "font-mono text-[10.5px] leading-normal";

function Case({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`about-face absolute inset-0 rounded-[18px] bg-bg-dark-panel ${className}`}>
      <div className="absolute top-[8px] left-[126px] h-[8px] w-[48px] rounded-[4px] bg-bg-page" />
      <div className="absolute top-[14px] left-[14px] flex h-[392px] w-[272px] flex-col overflow-hidden rounded-[6px] bg-bg-panel px-[18px] pt-[20px] pb-[14px]">
        {children}
        <div className="about-light" aria-hidden />
      </div>
    </div>
  );
}

export function BadgeFront() {
  const f = about.front;
  return (
    <Case>
      <div className={`flex justify-between text-text-muted ${MONO}`}>
        <span>{f.label}</span>
        <span>{f.year}</span>
      </div>
      <div className="flex h-[174px] shrink-0 justify-center pt-[37px]">
        <div className="relative size-[135px] -rotate-4">
          <div className="absolute inset-[0.89%_3.22%_1.14%_3.37%] flex items-center justify-center">
            <Image src="/about/spruce-logo.svg" alt="SPRUCE" width={86} height={103} unoptimized className="rotate-30" />
          </div>
        </div>
      </div>
      <div className="h-[80px] shrink-0" />
      <p className="text-[22px] leading-normal font-bold text-text-primary">{f.name}</p>
      <p className="text-[12.5px] leading-[1.5] text-text-muted">{f.role}</p>
      <div className={`mt-auto flex justify-between border-t border-border-default pt-[10px] ${MONO}`}>
        <span className="text-text-primary">{f.brand}</span>
        <span className="text-text-muted">{f.location}</span>
      </div>
    </Case>
  );
}

export function BadgeBack() {
  const b = about.back;
  return (
    <Case className="about-back">
      <p className="text-[24px] leading-[1.25] font-bold text-text-primary">
        {b.headline.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </p>
      <div className="h-[18px] shrink-0" />
      <p className="text-[12.5px] leading-[1.7] text-text-muted">{b.body}</p>
      <div className="flex-1" />
      <p className={`text-text-muted ${MONO}`}>
        {b.school.map((line, i) => (
          <span key={i} className="block min-h-[1lh]">
            {line}
          </span>
        ))}
      </p>
      <div className="flex items-end justify-between pt-[14px]">
        <Image src="/about/barcode.svg" alt="" width={150} height={34} unoptimized />
        <span className={`text-text-muted ${MONO}`}>{b.handle}</span>
      </div>
    </Case>
  );
}
