import type { Metadata } from "next";
import localFont from "next/font/local";
import SiteHeader from "@/components/layout/SiteHeader";
import "./globals.css";

// woff2는 `npm run fonts`로 생성한 서브셋 (scripts/subset-fonts.mjs)
const pretendard = localFont({
  src: [
    { path: "./fonts/Pretendard-Regular.woff2", weight: "400" },
    { path: "./fonts/Pretendard-Medium.woff2", weight: "500" },
    { path: "./fonts/Pretendard-Bold.woff2", weight: "700" },
  ],
  variable: "--font-pretendard",
});

const lineSeed = localFont({
  src: [
    { path: "./fonts/LINESeedSans-Bold.woff2", weight: "700" },
    { path: "./fonts/LINESeedSans-ExtraBold.woff2", weight: "800" },
  ],
  variable: "--font-line-seed",
});

export const metadata: Metadata = {
  title: "SPRUCE",
  description: "Taeyeong Um — Product Designer Portfolio",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${pretendard.variable} ${lineSeed.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
