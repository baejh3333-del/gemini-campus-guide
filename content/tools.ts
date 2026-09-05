/**
 * 제미나이 기능 사전. 커리큘럼과 별개로 언제든 찾아보는 상시 참조 페이지.
 * 카드 형식을 고정한다: 한 줄 정의 / 언제 / 어디서 / 3단계 / 학업 예시 2개 / 요금제
 */
export type Tool = {
  id: string;
  name: string;
  emoji: string;
  oneLiner: string;
  when: string;
  where: string;
  how: string[];
  examples: string[];
  plan: "무료" | "Pro";
  url: string;
  /** 사이트 안의 심화 가이드가 있으면 */
  guideHref?: string;
};

export const TOOLS: Tool[] = [
  {
    id: "gems",
    name: "Gems",
    emoji: "💎",
    oneLiner: "내 지시문을 저장해 둔 나만의 제미나이.",
    when: "같은 형식의 작업을 반복할 때. 레포트 첨삭, 개념 설명, 발표 연습처럼 매번 같은 규칙이 필요한 일.",
    where: "gemini.google.com/gems/view — 제미나이 왼쪽 메뉴의 Gem 관리자에서도 들어갑니다.",
    how: [
      "Gem 만들기를 누르고 이름을 정합니다",
      "지시문에 역할과 출력 형식을 적습니다 (STEP 1의 4블록이 그대로 지시문이 됩니다)",
      "저장하면 사이드바에 남고, 다음부터는 클릭 한 번으로 그 규칙이 적용됩니다",
    ],
    examples: [
      "전공 용어를 항상 쉬운 말 → 교과서 정의 → 시험 답안 3단계로 설명하는 조교",
      "내 글을 채점 기준표대로 평가하고 문단별 수정안을 주는 첨삭 조교",
    ],
    plan: "무료",
    url: "https://gemini.google.com/gems/view?hl=ko",
    guideHref: "/tools/gems",
  },
  {
    id: "notebooklm",
    name: "NotebookLM",
    emoji: "📓",
    oneLiner: "내가 올린 자료 안에서만 답하는 연구 노트.",
    when: "강의자료, 논문, 판례처럼 정해진 문서를 파고들 때. 시험 범위 전체를 넣고 물어볼 때.",
    where: "notebook.google.com — 제미나이와는 별도 사이트입니다.",
    how: [
      "새 노트북을 만들고 PDF·문서·유튜브 링크를 자료로 올립니다",
      "요약, 예상문제, 개념 비교 등을 요청합니다",
      "오디오 브리핑을 만들면 통학길에 들을 수 있습니다",
    ],
    examples: [
      "시험 범위 강의 PDF 8개를 한 노트북에 넣고 주차별 연결 개념 정리하기",
      "논문 5편을 올려놓고 저자별 입장 차이를 표로 정리하기",
    ],
    plan: "무료",
    url: "https://notebook.google.com/",
    guideHref: "/tools/notebooklm",
  },
  {
    id: "deep-research",
    name: "Deep Research",
    emoji: "🔍",
    oneLiner: "웹을 여러 단계로 훑어 출처가 달린 보고서를 만듭니다.",
    when: "레포트 자료조사 초반. 쟁점이 무엇인지, 어떤 입장들이 있는지 지도를 그려야 할 때.",
    where: "제미나이 입력창에서 Deep Research 모드를 켭니다.",
    how: [
      "조사 주제와 원하는 결과물 형태를 함께 적습니다",
      "제미나이가 조사 계획을 보여주면 확인하고 실행합니다 (몇 분 걸립니다)",
      "보고서가 나오면 출처를 눌러 원문을 반드시 확인합니다",
    ],
    examples: [
      "학부 레포트 주제의 핵심 쟁점 3가지와 대립하는 입장 정리하기",
      "공모전 준비 전 해당 산업의 최근 5년 동향 훑기",
    ],
    plan: "Pro",
    url: "https://gemini.google.com/app",
  },
  {
    id: "canvas",
    name: "Canvas",
    emoji: "📝",
    oneLiner: "채팅이 아니라 문서 편집기처럼 함께 고쳐 쓰는 모드.",
    when: "긴 글을 여러 번 다듬을 때. 대화가 길어져서 어느 버전이 최신인지 헷갈릴 때.",
    where: "제미나이 입력창의 Canvas 버튼.",
    how: [
      "초안을 만들거나 내 글을 붙여넣습니다",
      "고치고 싶은 부분만 선택해서 수정을 지시합니다",
      "버전이 문서로 관리되므로 이전 상태로 되돌릴 수 있습니다",
    ],
    examples: [
      "자기소개서를 문항별로 고쳐 쓰면서 글자수 맞추기",
      "발표 스크립트를 문단 단위로 다듬기",
    ],
    plan: "무료",
    url: "https://gemini.google.com/app",
  },
  {
    id: "nano-banana",
    name: "Nano Banana",
    emoji: "🍌",
    oneLiner: "이미지를 만들고, 만든 이미지를 말로 계속 고칩니다.",
    when: "발표자료 표지, 개념 도식, 포스터가 필요할 때. 무료 이미지 사이트에서 원하는 게 안 나올 때.",
    where: "gemini.google.com/images — 제미나이 입력창의 이미지 생성 기능에서도 됩니다.",
    how: [
      "무엇을 그릴지, 어떤 분위기인지, 어디에 쓸 건지 함께 적습니다",
      "나온 이미지에서 고칠 부분만 말로 지시합니다 (배경만 바꿔줘, 글씨 빼줘)",
      "슬라이드 비율에 맞춰 다시 요청합니다",
    ],
    examples: [
      "발표 표지용 일러스트를 학과 색상에 맞춰 만들기",
      "복잡한 순환 구조를 다이어그램 이미지로 만들기",
    ],
    plan: "Pro",
    url: "https://gemini.google.com/images?hl=ko",
    guideHref: "/tools/nano-banana",
  },
  {
    id: "upload",
    name: "파일 업로드",
    emoji: "📎",
    oneLiner: "PDF·이미지·표를 그대로 올려서 물어봅니다.",
    when: "손으로 옮겨 적기 귀찮은 모든 것. 필기 사진, 문제지, 엑셀 표.",
    where: "제미나이 입력창의 클립 아이콘.",
    how: [
      "파일이나 사진을 올립니다",
      "무엇을 해달라고 할지 함께 적습니다 (요약, 표로 변환, 풀이)",
      "결과가 원본과 맞는지 대조합니다",
    ],
    examples: [
      "칠판 필기 사진을 올려 정리된 노트로 바꾸기",
      "과제 명세서 PDF를 올려 체크리스트로 만들기",
    ],
    plan: "무료",
    url: "https://gemini.google.com/app",
  },
];
