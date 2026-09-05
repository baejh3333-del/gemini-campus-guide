/**
 * STEP 3(NotebookLM) 실습용 샘플 강의 PDF 생성기.
 *   node scripts/make-sample-pdf.mjs
 *
 * 강의자료가 없는 학생이 실습에서 이탈하지 않도록 두는 임시 파일이다.
 * 운영팀이 실제 강의자료(저작권 문제 없는 것)를 준비하면 이 파일을 덮어쓰면 된다.
 *
 * 한글 때문에 폰트를 임베드해야 한다. Pretendard(SIL Open Font License)를
 * assets/fonts 에 두고 쓴다 — 시스템 폰트(맑은 고딕 등)는 재배포 라이선스가 없다.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FONT_R = path.join(root, "assets/fonts/Pretendard-Regular.otf");
const FONT_B = path.join(root, "assets/fonts/Pretendard-Bold.otf");
const OUT = path.join(root, "public/samples/sample-lecture.pdf");

const INK = "#16181d";
const MUTED = "#5f6570";
const BRAND = "#1a73e8";

const doc = new PDFDocument({
  size: "A4",
  margins: { top: 64, bottom: 64, left: 56, right: 56 },
  info: {
    Title: "[샘플] 커뮤니케이션과 사회 3주차 — 미디어 효과 이론",
    Author: "강원대 AI 마스터 챌린지 운영팀",
    Subject: "NotebookLM 실습용 샘플 강의자료",
  },
});
doc.registerFont("r", FONT_R);
doc.registerFont("b", FONT_B);
doc.pipe(fs.createWriteStream(OUT));

const W = doc.page.width - 56 * 2;

function h1(t) {
  doc.font("b").fontSize(20).fillColor(INK).text(t, { width: W });
  doc.moveDown(0.6);
}
function h2(t) {
  if (doc.y > doc.page.height - 160) doc.addPage();
  doc.moveDown(0.8);
  doc.font("b").fontSize(14).fillColor(BRAND).text(t, { width: W });
  doc.moveDown(0.35);
}
function p(t) {
  doc.font("r").fontSize(10.5).fillColor(INK).text(t, { width: W, lineGap: 3.5 });
  doc.moveDown(0.45);
}
function bullets(items) {
  doc.font("r").fontSize(10.5).fillColor(INK);
  for (const it of items) {
    doc.text(`•  ${it}`, { width: W, lineGap: 3, indent: 6 });
    doc.moveDown(0.25);
  }
  doc.moveDown(0.2);
}
function term(name, desc) {
  doc.font("b").fontSize(10.5).fillColor(INK).text(name, { width: W, continued: true });
  doc.font("r").fillColor(INK).text(` — ${desc}`, { width: W, lineGap: 3 });
  doc.moveDown(0.35);
}
function note(t) {
  doc.font("r").fontSize(9.5).fillColor(MUTED).text(t, { width: W, lineGap: 3 });
  doc.moveDown(0.5);
}

// ── 표지 ────────────────────────────────────────────────
doc
  .font("b")
  .fontSize(9)
  .fillColor(BRAND)
  .text("샘플 강의자료 · 실습용", { width: W });
doc.moveDown(0.8);
h1("커뮤니케이션과 사회");
doc.font("b").fontSize(15).fillColor(INK).text("3주차 — 미디어 효과 이론의 흐름", { width: W });
doc.moveDown(1.2);
note(
  "이 파일은 NotebookLM 실습을 위해 만든 샘플입니다. 실제 수업 자료가 아니며, " +
    "강의자료가 없는 상태에서도 요약·예상문제·오디오 개요를 만들어 볼 수 있도록 " +
    "학부 개론 수준의 내용을 담았습니다. 손에 있는 강의 PDF가 있다면 그걸 쓰는 편이 훨씬 좋습니다."
);
doc.moveDown(0.6);
doc
  .moveTo(56, doc.y)
  .lineTo(56 + W, doc.y)
  .strokeColor("#e3e6ea")
  .stroke();
doc.moveDown(1);

h2("이번 주 학습 목표");
bullets([
  "미디어 효과 연구가 '강효과 → 소효과 → 중효과'로 이동한 흐름을 설명할 수 있다.",
  "의제설정, 침묵의 나선, 배양 이론의 핵심 주장과 차이를 구분할 수 있다.",
  "각 이론이 전제하는 수용자상(수동적/능동적)을 비교할 수 있다.",
  "디지털 플랫폼 환경에서 각 이론이 어떻게 재해석되는지 사례를 들 수 있다.",
]);

h2("1. 강효과 시기 — 수용자를 수동적 존재로 본 시각");
p(
  "20세기 초 대중매체가 급속히 확산되던 시기, 연구자들은 미디어 메시지가 수용자에게 " +
    "거의 그대로 주입된다고 보았다. 이 관점은 흔히 탄환 이론 또는 피하주사 이론이라 불린다. " +
    "메시지를 쏘면 표적이 그대로 맞는다는 비유, 주사를 놓으면 약효가 그대로 퍼진다는 비유에서 온 이름이다."
);
p(
  "이 시각의 배경에는 대중사회론이 있다. 산업화와 도시화로 전통적 공동체가 해체되면서, " +
    "개인은 서로 고립된 원자적 존재가 되었고 따라서 미디어의 영향에 무방비로 노출된다는 가정이다."
);
bullets([
  "전제: 수용자는 수동적이고 서로 연결되어 있지 않다.",
  "한계: 이후 실증 연구에서 동일한 메시지에도 사람마다 반응이 크게 달랐다.",
  "의의: 미디어를 사회적 영향력의 문제로 다루기 시작한 최초의 틀.",
]);

h2("2. 소효과 시기 — 사람들 사이의 관계가 끼어든다");
p(
  "선거 캠페인 연구들은 미디어가 유권자의 태도를 바꾸기보다는 기존 성향을 강화하는 " +
    "방향으로 작동한다는 결과를 반복해서 내놓았다. 여기서 나온 것이 2단계 유통 이론이다."
);
term(
  "2단계 유통 이론",
  "미디어 메시지는 대중에게 바로 가지 않고, 먼저 의견지도자에게 도달한 뒤 그들의 해석을 거쳐 주변으로 퍼진다는 설명. 카츠와 라자스펠드의 연구(1955)가 대표적이다."
);
term(
  "선택적 노출·선택적 지각",
  "사람들은 자기 생각과 맞는 정보를 골라 접하고, 접한 뒤에도 자기 방식으로 해석한다. 미디어의 설득 효과가 제한되는 핵심 이유."
);
p(
  "이 시기의 결론은 '미디어는 생각보다 힘이 약하다'였다. 다만 이는 태도 변화라는 " +
    "좁은 기준으로만 효과를 측정했기 때문이라는 비판을 나중에 받는다."
);

h2("3. 중효과 시기 — 무엇을 생각할지가 아니라 무엇에 대해 생각할지");
p(
  "1970년대 이후 연구자들은 효과의 기준을 바꾸었다. 태도를 바꾸는 대신, 인식과 " +
    "주목의 방향을 바꾸는 힘에 주목한 것이다."
);
term(
  "의제설정 이론",
  "미디어는 사람들에게 무엇을 생각하라고 말하는 데는 서툴지만, 무엇에 대해 생각할지를 정하는 데는 매우 성공적이다. 맥콤스와 쇼가 1972년 지역 선거 연구에서 제시했다."
);
term(
  "침묵의 나선",
  "사람들은 자신의 의견이 소수라고 느끼면 고립을 두려워해 침묵한다. 그 결과 다수 의견은 실제보다 더 크게, 소수 의견은 더 작게 보인다. 노엘레-노이만이 1974년에 제시했다."
);
term(
  "배양 이론",
  "특정 매체를 오래 접한 사람일수록 현실을 그 매체가 그리는 세계에 가깝게 인식하게 된다. 단발성 설득이 아니라 장기간 누적되는 효과를 본다는 점이 특징이다."
);

h2("4. 능동적 수용자 — 이용과 충족 이론");
p(
  "앞의 이론들이 '미디어가 사람에게 무엇을 하는가'를 물었다면, 이용과 충족 이론은 " +
    "질문을 뒤집는다. '사람들은 미디어로 무엇을 하는가.'"
);
bullets([
  "수용자는 정보 획득, 오락, 사회적 관계 유지, 자기 확인 같은 목적을 갖고 매체를 고른다.",
  "같은 콘텐츠라도 이용 동기가 다르면 효과도 다르게 나타난다.",
  "비판: 수용자의 선택 능력을 과대평가하고, 선택지 자체를 누가 만드는지를 놓친다는 지적이 있다.",
]);

h2("5. 디지털 환경에서의 재해석");
p(
  "알고리즘 추천과 소셜 미디어는 위 이론들을 폐기한 것이 아니라 작동 방식을 바꾸었다."
);
bullets([
  "의제설정의 주체가 언론사에서 플랫폼 알고리즘과 이용자 참여로 분산되었다.",
  "2단계 유통의 의견지도자 자리를 인플루언서와 커뮤니티 관리자가 일부 대체했다.",
  "침묵의 나선은 익명성 때문에 약해지기도 하고, 가시적인 좋아요 수 때문에 강해지기도 한다.",
  "배양 효과는 개인마다 다른 피드를 보게 되면서 집단 단위가 아니라 개인 단위로 나타난다.",
]);

h2("6. 정리 — 세 시기 비교");
bullets([
  "강효과: 수용자는 수동적, 효과는 직접적·즉각적. 측정 기준은 태도 변화.",
  "소효과: 수용자는 사회적 관계 속에 있음. 효과는 강화 중심. 측정 기준은 여전히 태도 변화.",
  "중효과: 수용자는 인지적으로 반응. 효과는 간접적·누적적. 측정 기준이 인식과 주목으로 이동.",
]);

h2("다음 주 예고 및 과제");
p(
  "4주차에는 프레이밍 이론과 점화 효과를 다룬다. 과제로는 최근 한 달 사이의 뉴스 " +
    "하나를 골라, 서로 다른 매체 두 곳이 같은 사건을 어떻게 다르게 배치하고 " +
    "규정했는지를 A4 2장으로 비교 분석해 온다."
);

h2("핵심 용어");
bullets([
  "탄환 이론 / 피하주사 이론",
  "2단계 유통 이론, 의견지도자",
  "선택적 노출, 선택적 지각",
  "의제설정, 침묵의 나선, 배양 이론",
  "이용과 충족",
]);

doc.moveDown(1);
note(
  "본 문서는 강원대 AI 마스터 챌린지의 NotebookLM 실습을 위해 작성된 샘플입니다. " +
    "학부 개론 수준으로 요약한 것이므로 실제 시험 준비에는 담당 교수님의 강의자료를 사용하세요."
);

doc.end();
console.log(`샘플 PDF 생성: ${path.relative(root, OUT)}`);
