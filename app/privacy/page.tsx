import Link from "next/link";

export const metadata = { title: "개인정보 처리방침 | GSA 프롬프트 저장소" };

const OPERATOR = {
  team: "gemini student Ambassador 강원대",
  manager: "배정현",
  email: "202312604@kangwon.ac.kr",
};

export default function PrivacyPage() {
  return (
    <main className="px-5 pt-8 pb-12">
      <Link href="/" className="text-sm text-[var(--color-muted)]">
        ← 처음으로
      </Link>
      <h1 className="mt-3 text-[26px] leading-tight font-extrabold">
        개인정보 처리방침
      </h1>
      <p className="mt-3 text-sm text-[var(--color-muted)]">
        {OPERATOR.team}(이하 &ldquo;운영팀&rdquo;)은 이름·연락처 등의 개인정보를 별도 서버에 수집·저장하지 않으며, 학습 편의를 위한 브라우저 저장소와 방문·이용 통계를 사용합니다.
      </p>

      <div className="mt-8 space-y-7 text-[14px] leading-relaxed">
        <section>
          <h2 className="mb-2 text-base font-extrabold">1. 수집하는 개인정보 항목</h2>
          <p>
            본 사이트는 회원가입이나 별도의 개인정보(이름, 연락처, 학번, 이메일 등)를 서버로 수집하지 않습니다. (이전 캠페인 경품 응모 접수는 종료되었습니다.)
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-extrabold">2. 브라우저에 저장되는 정보 및 방문 통계</h2>
          <p>
            학습 진행 상황(완료한 단계, 프롬프트 빌더에 입력한 내용, 수료증 표시용 이름)은{" "}
            <b>여러분의 브라우저(localStorage) 안에만</b> 저장되며 서버로 전송되지 않습니다. 브라우저
            데이터를 지우거나 초기화 버튼을 누르면 즉시 삭제됩니다.
          </p>
          <p className="mt-2">
            방문 통계 확인을 위해 Google Analytics와 Vercel Web Analytics를 사용합니다. Vercel Web Analytics는 쿠키를 쓰지 않고 개인을 식별하지 않는 방식으로 방문 수와 페이지 조회를 집계합니다. Google Analytics가 설정된 경우 쿠키 등 온라인 식별자를 사용해 방문 및 학생 혜택 가입 링크 클릭 통계를 집계합니다. 클릭 이벤트에는 버튼 위치와 페이지 경로를 포함하며, 이름·연락처·프롬프트 입력 내용은 포함하지 않습니다. 실제 Google 가입 완료 여부는 확인하지 않습니다.
          </p>
          <p className="mt-2 text-[var(--color-muted)]">
            이 사이트는 제미나이를 대신 실행하지 않습니다. 여러분이 제미나이에
            입력하는 내용은 이 사이트를 거치지 않고 Google로 직접 전달됩니다.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-extrabold">3. 문의처 및 개인정보 보호 책임자</h2>
          <ul className="space-y-1">
            <li>· 담당: {OPERATOR.team}</li>
            <li>· 성명: {OPERATOR.manager}</li>
            <li>· 연락처: {OPERATOR.email}</li>
          </ul>
        </section>
      </div>

      <Link href="/" className="btn-ghost mt-10 w-full">
        처음으로 돌아가기
      </Link>
    </main>
  );
}
