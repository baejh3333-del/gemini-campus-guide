import type { Metadata, Viewport } from "next";
import Script from "next/script";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import localFont from "next/font/local";
import PromptFinder from "../components/PromptFinder";
import CustomCursor from "../components/CustomCursor";
import "./globals.css";
import "./library.css";

const pretendard = localFont({
  src: [
    { path: "../assets/fonts/Pretendard-Regular.otf", weight: "400", style: "normal" },
    { path: "../assets/fonts/Pretendard-Bold.otf", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-pretendard",
});

// og:image 는 절대 URL 이어야 카카오톡·에브리타임이 썸네일을 읽는다.
// 미설정 시 Vercel 이 배포별 URL(프리뷰 주소)을 쓰므로 실제 도메인을 넣을 것.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "프롬프트 저장소 | GSA team 강원대 AI 마스터 챌린지",
  description:
    "레포트·시험공부·발표·일상에 필요한 프롬프트를 찾고, 내 Gemini에서 바로 사용하세요.",
  openGraph: {
    title: "프롬프트 저장소 | GSA team",
    description: "발견하고, 복사하고, 내 Gemini에서 시작하세요.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // 인앱 브라우저에서 확대가 막히면 접근성이 나빠진다. 확대는 열어 둔다.
  maximumScale: 5,
  themeColor: "#0b0b0c",
};

const GA_ID = /^G-[A-Z0-9]+$/.test(process.env.NEXT_PUBLIC_GA_ID || "") &&
  !/^G-X+$/.test(process.env.NEXT_PUBLIC_GA_ID || "")
  ? process.env.NEXT_PUBLIC_GA_ID
  : undefined;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={pretendard.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{document.documentElement.dataset.theme=localStorage.getItem("site-theme")==="light"?"light":"dark"}catch{}` }} />
        {GA_ID ? (
          <script id="ga-init" dangerouslySetInnerHTML={{ __html:
            `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());gtag('config','${GA_ID}');`,
          }} />
        ) : null}
      </head>
      <body>
        {GA_ID ? (
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
        ) : null}

        {/* 화면 아래에서 피어오르는 배경. 콘텐츠보다 뒤에 깔린다. */}
        <div className="bloom" aria-hidden />
        <CustomCursor />
        <PromptFinder />

        <div className="site-frame relative z-[1] mx-auto min-h-dvh max-w-[560px]">
          {children}
          <footer className="legacy-footer mt-10 border-t border-[var(--color-line)] px-5 py-8 text-xs leading-relaxed text-[var(--color-muted)]">
            <p className="mb-3 font-semibold text-[var(--color-ink)]">
              AI는 초안·검증·학습을 돕는 도구입니다. 제출물의 최종 책임은 본인에게
              있습니다.
            </p>
            <p className="mb-4">
              과목마다 AI 사용 허용 범위가 다릅니다. 과제에 활용하기 전 강의계획서와
              담당 교수님의 안내를 확인하세요. 생성된 내용은 반드시 출처를 확인하고
              본인의 언어로 다시 쓰는 것을 권장합니다.
            </p>
            <nav className="flex flex-wrap gap-x-4 gap-y-2">
              <Link href="/" className="underline underline-offset-2">
                프롬프트 저장소
              </Link>
              <Link href="/learn" className="underline underline-offset-2">
                15분 챌린지 홈
              </Link>
              <Link href="/tools" className="underline underline-offset-2">
                기능 사전
              </Link>
              <Link
                href="/tools/prompt-builder"
                className="underline underline-offset-2"
              >
                프롬프트 빌더
              </Link>
              <Link href="/privacy" className="underline underline-offset-2">
                개인정보 처리방침
              </Link>
            </nav>
          </footer>
        </div>

        {/* 방문자 수는 Vercel 대시보드 → Analytics 탭에서 본다(탭에서 Enable 필요). */}
        <Analytics />
      </body>
    </html>
  );
}
