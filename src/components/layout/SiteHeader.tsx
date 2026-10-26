"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getProject } from "@/content/projects";

// Figma: Nav 2:34 (active = Work | About | Contact)
const NAV = [
  { label: "Work", href: "/" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

function isActive(pathname: string, href: string) {
  // 상세(/work/…)도 Work로 본다
  if (href === "/") return pathname === "/" || pathname.startsWith("/work");
  return pathname.startsWith(href);
}

// 어두운 배경 페이지(상세 B · 영화)에서는 글자색 반전 (Figma 5:53 · 5:54)
function isDark(pathname: string) {
  const slug = pathname.startsWith("/work/") ? pathname.slice(6) : "";
  return getProject(slug)?.kind === "film";
}

export default function SiteHeader() {
  const pathname = usePathname();
  const dark = isDark(pathname);
  const [on, off] = dark ? ["text-text-inverse", "text-text-muted-inverse"] : ["text-text-primary", "text-text-muted"];

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
      <Link href="/" className={`wf-logo pointer-events-auto absolute top-[28px] left-[32px] ${on}`}>
        SPRUCE
      </Link>
      <nav className="pointer-events-auto absolute top-[30px] right-[37px]">
        <ul className="wf-nav flex gap-[40px]">
          {NAV.map(({ label, href }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={active ? on : off}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
