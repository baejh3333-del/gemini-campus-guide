/**
 * 배포 전 점검.  npm run preflight
 *
 * README 체크리스트는 놓치기 쉬우므로, 놓치면 안 되는 것만 여기서 실제로 막는다.
 * 가장 큰 위험은 개인정보(전화번호)를 수집하면서 처리방침 담당자가 비어 있는 상태로
 * 배포되는 것 — 체크박스가 아니라 종료 코드로 잡는다.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => {
  try {
    return fs.readFileSync(path.join(root, p), "utf8");
  } catch {
    return null;
  }
};

const fails = [];
const warns = [];
const oks = [];

// ── 1. 개인정보 처리방침 담당자 ──────────────────────────
const privacy = read("app/privacy/page.tsx");
if (!privacy) {
  fails.push("app/privacy/page.tsx 를 찾을 수 없습니다.");
} else {
  const holes = ["○○○", "여기에-담당자-이메일"].filter((h) => privacy.includes(h));
  if (holes.length) {
    fails.push(
      `개인정보 처리방침의 담당자 정보가 비어 있습니다 (${holes.join(", ")}).\n` +
        "     이름과 휴대폰 번호를 수집하는 사이트입니다. 담당자 없이 배포하면 안 됩니다.\n" +
        "     → app/privacy/page.tsx 의 OPERATOR 를 실제 값으로 채우세요."
    );
  } else {
    oks.push("개인정보 처리방침 담당자 정보");
  }

  // 파기 시점이 지났는지 (캠페인이 밀리면 문서와 실제가 어긋난다)
  const m = privacy.match(/destroyBy:\s*"(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일"/);
  if (m) {
    const due = new Date(+m[1], +m[2] - 1, +m[3]);
    if (due < new Date()) {
      warns.push(
        `처리방침의 파기 예정일(${m[0].split('"')[1]})이 이미 지났습니다. 날짜를 갱신하세요.`
      );
    } else {
      oks.push("개인정보 파기 예정일");
    }
  }
}

// ── 2. STEP 3 샘플 PDF ──────────────────────────────────
const pdfPath = path.join(root, "public/samples/sample-lecture.pdf");
if (!fs.existsSync(pdfPath)) {
  fails.push(
    "public/samples/sample-lecture.pdf 가 없습니다. STEP 3 다운로드가 404 가 됩니다.\n" +
      "     → npm run sample-pdf 로 임시 샘플을 만들거나 실제 강의자료를 넣으세요."
  );
} else {
  const head = fs.readFileSync(pdfPath).subarray(0, 5).toString("latin1");
  if (head !== "%PDF-") {
    fails.push("sample-lecture.pdf 가 유효한 PDF 가 아닙니다.");
  } else {
    oks.push(`샘플 강의 PDF (${Math.round(fs.statSync(pdfPath).size / 1024)}KB)`);
  }
}

// ── 3. Apps Script 공유 비밀키 ──────────────────────────
const gs = read("apps-script/Code.gs");
if (gs && gs.includes("여기에-ENTRY_SHARED_SECRET")) {
  warns.push(
    "apps-script/Code.gs 의 SECRET 이 기본값입니다.\n" +
      "     이 파일은 배포되지 않지만, 구글에 붙여넣기 전에 긴 무작위 문자열로 바꾸고\n" +
      "     Vercel 의 ENTRY_SHARED_SECRET 과 같은 값으로 맞추세요."
  );
} else if (gs) {
  oks.push("Apps Script 공유 비밀키");
}

// ── 4. 실수로 커밋될 수 있는 것 ─────────────────────────
if (fs.existsSync(path.join(root, ".env.local"))) {
  const env = read(".env.local") || "";
  if (/change-me|XXXX|your-domain/.test(env)) {
    warns.push(".env.local 에 예시 값이 남아 있습니다. 실제 값으로 채우세요.");
  }
  const ignore = read(".gitignore") || "";
  if (!ignore.includes(".env*.local")) {
    fails.push(".env.local 이 .gitignore 에 없습니다. 비밀키가 커밋될 수 있습니다.");
  }
}

// ── 5. 환경변수 (배포 환경에서 실행할 때만 의미가 있다) ──
const ENV = [
  ["ENTRY_WEBHOOK_URL", "없으면 경품 응모가 503", true],
  ["ENTRY_SHARED_SECRET", "없으면 경품 응모가 503", true],
  ["NEXT_PUBLIC_SIGNUP_URL", "없으면 UTM 없는 기본 링크 → 사인업 KPI 귀속 불가", false],
  ["NEXT_PUBLIC_SITE_URL", "없으면 공유 썸네일이 프리뷰 주소를 가리킴", false],
  ["NEXT_PUBLIC_GA_ID", "없으면 계측 전부 없음", false],
];
const envRows = ENV.map(([k, why]) => ({
  k,
  why,
  set: Boolean(process.env[k]),
}));

// ── 출력 ────────────────────────────────────────────────
const line = "─".repeat(60);
console.log(`\n${line}\n배포 전 점검\n${line}`);

for (const o of oks) console.log(`  ✓ ${o}`);
for (const w of warns) console.log(`  ⚠ ${w}`);
for (const f of fails) console.log(`  ✗ ${f}`);

console.log(`\n환경변수 (이 환경 기준 — Vercel 대시보드에서 다시 확인하세요)`);
for (const r of envRows) {
  console.log(`  ${r.set ? "✓" : "·"} ${r.k}${r.set ? "" : `  — ${r.why}`}`);
}

console.log(`\n${line}`);
if (fails.length) {
  console.log(`배포 불가 — 위 ✗ ${fails.length}건을 먼저 해결하세요.\n`);
  process.exit(1);
}
console.log(
  warns.length
    ? `통과 (경고 ${warns.length}건 — 내용을 확인하세요)\n`
    : "통과\n"
);
