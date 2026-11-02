import Link from "next/link";

const SIGNUP_URL = process.env.NEXT_PUBLIC_SIGNUP_URL || "https://goo.gle/kangwonchuncheon";

export function LibraryHeader({ back, onHomeClick }: { back?: string; onHomeClick?: () => void }) {
  return (
    <header className="library-header">
      <Link
        href="/"
        onClick={onHomeClick}
        className="library-wordmark"
        aria-label="강원대 GSA 팀 프롬프트 저장소 홈"
      >
        <svg className="library-mark" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M7 15v7c4.8 3.5 13.2 3.5 18 0v-7" fill="#1a73e8" fillOpacity=".18" stroke="#8ab4f8" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="m3 12 13-6 13 6-13 6-13-6Z" fill="#a8c7fa" stroke="#c2e7ff" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M29 12v10" stroke="#8ab4f8" strokeWidth="1.5" strokeLinecap="round" />
          <path d="m27.5 25 1.5-3 1.5 3" stroke="#8ab4f8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>AI <span className="wordmark-light">프롬프트 저장소</span></span>
      </Link>
      {back ? (
        <Link href={back} className="library-header-note">← 목록으로</Link>
      ) : (
        <a
          href={SIGNUP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="library-header-note"
        >
          Gemini 학생 혜택 가입 ↗
        </a>
      )}
    </header>
  );
}
export function BenefitStrip() {
  return <aside className="benefit-strip"><span><span aria-hidden="true">↗</span> Gemini, 학생 혜택도 확인해 보세요</span><Link href="/learn/benefit">알아보기 <span aria-hidden="true">→</span></Link></aside>;
}
export function LibraryFooter() {
  return (
    <footer className="library-footer">
      <Link href="/learn">GSA team · 강원대 AI 마스터 챌린지</Link>
      <Link href="/privacy">개인정보 처리방침</Link>
    </footer>
  );
}
