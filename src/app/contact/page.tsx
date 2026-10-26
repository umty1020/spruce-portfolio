import type { Metadata } from "next";
import Image from "next/image";
import { contact, site } from "@/content/site";
import CopyButton from "@/components/contact/CopyButton";

export const metadata: Metadata = { title: "Contact — SPRUCE" };

// Figma 5:261 Contact
export default function ContactPage() {
  return (
    <main className="relative flex min-h-dvh flex-col px-[32px] pt-[clamp(140px,33vh,300px)] pb-[120px] md:pr-[32px] md:pl-[57px]">
      <div className="flex flex-wrap items-center gap-[20px]">
        {/* Figma WF/Heading XL 64px — 좁은 화면에서는 줄임 */}
        <a
          href={`mailto:${contact.email}`}
          className="wf-heading-xl break-words text-text-primary"
          style={{ fontSize: "clamp(22px, 4.45vw, 64px)" }}
        >
          {contact.email}
        </a>
        <CopyButton text={contact.email} />
      </div>

      <dl className="mt-[104px] grid grid-cols-2 gap-[32px] border-t border-border-default pt-[24px] md:grid-cols-4">
        {contact.items.map(({ label, value, href }) => (
          <div key={label} className="flex flex-col gap-[10px]">
            <dt className="text-[13px] leading-normal font-bold tracking-[0.78px] text-text-primary">{label}</dt>
            <dd className="text-[15px] leading-[1.6] text-text-muted">
              {href ? (
                <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                  {value}
                </a>
              ) : (
                value
              )}
            </dd>
          </div>
        ))}
      </dl>

      <a
        href={`mailto:${contact.email}`}
        className="absolute bottom-[28px] left-[32px] flex h-[52px] w-[220px] items-center justify-between rounded-full bg-bg-dark pr-[16px] pl-[24px] font-display text-[15px] leading-normal font-bold text-text-inverse"
      >
        메일 보내기
        <Image src="/icons/arrow-up-right.svg" alt="" width={17} height={17} unoptimized />
      </a>
      <p className="wf-caption absolute right-[30px] bottom-[28px] text-text-muted">{site.copyright}</p>
    </main>
  );
}
