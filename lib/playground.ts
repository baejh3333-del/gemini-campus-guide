import type { Category, LibraryPrompt } from "./prompt-library";

export type PlaygroundPrompt = {
  id: string;
  title: string;
  description: string;
  body: string;
  category: Category;
  author: string;
  variant: LibraryPrompt["thumbnail"]["variant"];
  artwork?: string;
  copies: number;
  likes: number;
  createdAt: string;
};

export const VISUAL_VARIANTS: {
  id: LibraryPrompt["thumbnail"]["variant"];
  label: string;
}[] = [
  { id: "orbit", label: "Orbit 링" },
  { id: "sphere", label: "Blue Dawn" },
  { id: "wave", label: "Prismatic 돔" },
  { id: "portal", label: "Aurora 웨이브" },
  { id: "agent", label: "Sky Agent" },
  { id: "curves", label: "Sigmoid 곡선" },
  { id: "pills", label: "Capsules" },
  { id: "axis", label: "Axis 스퀘어" },
];

export const SEED_PLAYGROUND_PROMPTS: PlaygroundPrompt[] = [
  {
    id: "pg-email",
    title: "교수님께 정중하게 성적·출석 문의 메일 쓰기",
    description: "무례해 보이지 않으면서 용건과 근거를 명확히 전달하는 대학생 이메일 초안을 만들어 줍니다.",
    category: "글쓰기·리서치 (internal-comms)",
    author: "경영 22",
    variant: "agent",
    copies: 42,
    likes: 19,
    createdAt: "2026-10-28",
    body: `당신은 대학 행정 및 비즈니스 커뮤니케이션 코치입니다.
저는 [수업명] 수업을 듣는 [학과·학년] 학생 [내 이름]입니다.

교수님께 [문의 용건]에 대해 정중하게 문의하는 이메일 초안을 작성해 주세요.

내 상황 설명:
- [상세 상황 및 사유]

조건:
- 제목은 '[수업명] 관련 문의드립니다 (학번 이름)' 형식으로 2가지 제안해 주세요
- 첫인사(날씨/안부)는 담백하게 1문장으로 줄이고, 본론을 먼저 명확히 적어 주세요
- 변명처럼 들리는 표현은 빼고, 확인 부탁드리는 내용과 첨부 증빙([첨부자료])을 깔끔하게 정리해 주세요`,
  },
  {
    id: "pg-paper",
    title: "전공 영어 원서·논문 3단계 요약 & 시험 포인트",
    description: "어려운 영어 전공 텍스트를 붙여넣으면 핵심 번역, 개념 구조화, 서술형 예상문제까지 한 번에 뽑아줍니다.",
    category: "문서·오피스 (docx·pdf·pptx·xlsx)",
    author: "바이오 23",
    variant: "curves",
    copies: 38,
    likes: 24,
    createdAt: "2026-10-29",
    body: `당신은 [전공 분야] 과목의 대학원 조교입니다.
아래에 붙여넣는 영어 원서/논문 발췌문을 학부생이 시험공부에 바로 쓸 수 있게 정리해 주세요.

정리 순서:
1. 핵심 3줄 요약 — 이 글이 주장하는 결론을 쉬운 한국어로 먼저 요약
2. 문단별 핵심 개념 — 전문 용어는 '한국어(원어)'로 병기하고 인과관계 위주로 화살표(→) 정리
3. 시험 출제 포인트 — 교수님이 서술형이나 빈칸 문제로 낼 만한 핵심 문장 2개와 이유

---
[여기에 영어 원문 붙여넣기]`,
  },
  {
    id: "pg-qna",
    title: "발표 직전 악마의 대변인 (송곳 질문 방어)",
    description: "내 발표 대본의 논리적 허점을 찾아내고, 청중이나 교수님의 날카로운 질문과 방어 답변을 미리 준비합니다.",
    category: "릴스·카드뉴스",
    author: "미디어 21",
    variant: "portal",
    copies: 29,
    likes: 15,
    createdAt: "2026-10-30",
    body: `당신은 날카롭지만 건설적인 전공 수업 발표 심사위원입니다.
주제는 [발표 주제]이고, 발표 대상은 [청중]입니다.

아래 발표 개요/대본을 읽고 다음을 도와주세요:
1. 논리나 근거가 약해서 공격받기 쉬운 허점 3가지 지목
2. 교수님이 던질 법한 난이도 상(上) 질문 2개 + 같은 과 학생이 궁금해할 질문 2개
3. 각 질문에 대해 당황하지 않고 30초 안에 답변할 수 있는 모범 답변 스크립트

---
[내 발표 개요 또는 대본]`,
  },
  {
    id: "pg-debate",
    title: "레포트 반대 논거 & 재반박 아이디어 브레인스토밍",
    description: "내 주장만 나열하는 레포트에서 벗어나, 예상 반론과 이를 재반박하는 탄탄한 논리 구조를 만들어 줍니다.",
    category: "문서·오피스 (docx·pdf·pptx·xlsx)",
    author: "사회 24",
    variant: "orbit",
    copies: 34,
    likes: 17,
    createdAt: "2026-11-01",
    body: `당신은 비판적 글쓰기를 지도하는 대학 교수입니다.
제가 쓰려는 레포트의 주제는 [레포트 주제]이고, 저의 핵심 주장은 "[내 핵심 주장]"입니다.

글의 설득력을 높이기 위해 다음을 작성해 주세요:
1. 제 주장에 대해 반대 입장에서 제기할 수 있는 가장 강력한 반론 3가지
2. 각 반론을 인정하면서도 제 주장을 지킬 수 있는 '재반박 논리'와 필요한 근거([근거 유형])
3. 본론 마지막 문단에 넣을 '예상 반론 및 재반박' 문단 구성안 (개조식)`,
  },
];

/** Extracts unique bracketed variables like [주제], [수업명] in order of appearance */
export function extractVariables(body: string): string[] {
  const matches = body.match(/\[([^[\]\n]{1,24})\]/g) ?? [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const m of matches) {
    const inner = m.slice(1, -1).trim();
    if (inner && !seen.has(inner)) {
      seen.add(inner);
      result.push(inner);
    }
  }
  return result;
}
