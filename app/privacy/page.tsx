import Link from "next/link";

export const metadata = { title: "개인정보 처리방침 | 15분 제미나이" };

/* ───────────────────────────────────────────────────────────
   개인정보 보호 책임자. 이름과 전화번호를 수집하므로 비워 둘 수 없다.
   여기가 비면 npm run preflight 가 배포를 막는다.
   destroyBy 는 캠페인이 밀리면 실제와 어긋나니 함께 갱신할 것.
   ─────────────────────────────────────────────────────────── */
const OPERATOR = {
  team: "gemini student Ambassador 강원대",
  manager: "배정현",
  email: "baejh3333@kangwon.ac.kr",
  destroyBy: "2026년 10월 31일",
};

export default function PrivacyPage() {
  return (
    <main className="px-5 pt-8 pb-12">
      <Link href="/" className="text-sm text-[var(--color-muted)]">
        ← 처음으로
      </Link>
      <h1 className="mt-3 text-[26px] leading-tight font-extrabold">
        개인정보 수집·이용 동의 및 처리방침
      </h1>
      <p className="mt-3 text-sm text-[var(--color-muted)]">
        {/* 조사는 팀명의 받침에 따라 달라진다. "에서는" 은 받침과 무관해 안전하다. */}
        {OPERATOR.team}(이하 &ldquo;운영팀&rdquo;)에서는 경품 추첨 및 지급을 위해
        아래와 같이 최소한의 개인정보를 수집합니다.
      </p>

      <div className="mt-8 space-y-7 text-[14px] leading-relaxed">
        <section>
          <h2 className="mb-2 text-base font-extrabold">1. 수집하는 항목</h2>
          <ul className="space-y-1.5">
            <li>· 이름</li>
            <li>· 휴대폰 번호</li>
            <li>
              · 학습 진행 기록(완료한 단계, 단계별 소요시간, 퀴즈 응시 횟수) —
              부정 응모 확인 목적
            </li>
          </ul>
          <p className="mt-2 text-[var(--color-muted)]">
            학번, 주소, 이메일, 결제정보 등 그 밖의 개인정보는 수집하지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-extrabold">2. 수집·이용 목적</h2>
          <p>
            경품 추첨 진행, 당첨자 확인 및 경품 지급 안내. 이 외의 목적으로는
            이용하지 않으며, 마케팅 정보 발송이나 제3자 제공에도 사용하지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-extrabold">3. 보유 및 이용 기간</h2>
          <p>
            경품 지급이 완료된 즉시 파기하며, 늦어도{" "}
            <b>{OPERATOR.destroyBy}</b> 이전에 모든 응모 정보를 삭제합니다. 별도의
            백업 사본은 보관하지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-extrabold">4. 동의를 거부할 권리</h2>
          <p>
            개인정보 수집·이용 동의를 거부할 수 있습니다. 다만 동의하지 않으면 경품
            응모만 제한되며,{" "}
            <b>학습 과정과 모든 자료는 그대로 이용하실 수 있습니다.</b>
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-extrabold">5. 제3자 제공 및 처리 위탁</h2>
          <p>
            수집한 정보를 제3자에게 제공하지 않습니다. 다만 응모 내역의 보관을 위해
            Google Workspace(Google Sheets)를 이용하며, 접근 권한은 운영팀 담당자로
            제한됩니다.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-extrabold">6. 정보주체의 권리</h2>
          <p>
            언제든지 본인의 개인정보에 대한 열람·정정·삭제·처리정지를 요구할 수
            있습니다. 아래 연락처로 요청하시면 지체 없이 조치합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-extrabold">7. 이 사이트가 저장하는 것</h2>
          <p>
            학습 진행 상황(완료한 단계, 프롬프트 빌더에 입력한 내용)은{" "}
            <b>여러분의 브라우저 안에만</b> 저장되며 서버로 전송되지 않습니다. 브라우저
            데이터를 지우면 함께 사라집니다. 방문 통계 확인을 위해 Google Analytics를
            사용합니다.
          </p>
          <p className="mt-2 text-[var(--color-muted)]">
            이 사이트는 제미나이를 대신 실행하지 않습니다. 여러분이 제미나이에
            입력하는 내용은 이 사이트를 거치지 않고 Google로 직접 전달됩니다.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-extrabold">8. 개인정보 보호 책임자</h2>
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
