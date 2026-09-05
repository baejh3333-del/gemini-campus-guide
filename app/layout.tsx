import type { Metadata, Viewport } from "next";
import Script from "next/script";
import Link from "next/link";
import "./globals.css";

// og:image 는 절대 URL 이어야 카카오톡·에브리타임이 썸네일을 읽는다.
// 미설정 시 Vercel 이 배포별 URL(프리뷰 주소)을 쓰므로 실제 도메인을 넣을 것.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "15분 만에 제미나이 정복하기 | 강원대 AI 마스터 챌린지",
  description:
    "레포트·시험·발표에 바로 쓰는 제미나이 사용법. 15분 과정을 끝내면 경품 응모까지.",
  openGraph: {
    title: "15분 만에 제미나이 정복하기",
    description: "재학생 12개월 무료 혜택부터, 레포트·시험에 바로 쓰는 실습까지.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // 인앱 브라우저에서 확대가 막히면 접근성이 나빠진다. 확대는 열어 둔다.
  maximumScale: 5,
  themeColor: "#1a73e8",
};

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {GA_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());gtag('config','${GA_ID}');`}
            </Script>
          </>
        ) : null}

        {/* 화면 아래에서 피어오르는 배경. 콘텐츠보다 뒤에 깔린다. */}
        <div className="bloom" aria-hidden />

        <div className="relative z-[1] mx-auto min-h-dvh max-w-[560px]">
          {children}
          <footer className="mt-10 border-t border-[var(--color-line)] px-5 py-8 text-xs leading-relaxed text-[var(--color-muted)]">
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
      </body>
    </html>
  );
}
