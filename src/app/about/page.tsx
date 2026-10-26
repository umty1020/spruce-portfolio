import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { site } from "@/content/site";
import BadgeScene from "@/components/about/BadgeScene";

export const metadata: Metadata = { title: "About — SPRUCE" };

// Figma 5:185 About · 사원증 앞면 / 5:218 뒷면
export default function AboutPage() {
  return (
    <main className="relative h-dvh overflow-hidden">
      <BadgeScene />
      <Link
        href="/contact"
        className="absolute bottom-[28px] left-[32px] flex h-[52px] w-[180px] items-center justify-between rounded-full bg-bg-dark pr-[16px] pl-[24px] font-display text-[17px] leading-normal font-bold text-text-inverse"
      >
        Contact
        <Image src="/icons/arrow-up-right.svg" alt="" width={17} height={17} unoptimized />
      </Link>
      <p className="wf-caption pointer-events-none absolute right-[30px] bottom-[28px] text-text-muted">{site.copyright}</p>
    </main>
  );
}
