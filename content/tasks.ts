/**
 * "지금 뭘 하려고 하세요?" -> 그 일에 쓸 기능 조합.
 *
 * 기능 사전은 도구를 나열하지만, 학생은 도구 이름이 아니라 할 일로 생각한다.
 * 여기서 toolId 는 content/tools.ts 의 id 와 일치해야 한다 (자체 점검에서 검사).
 */
export type TaskRecipe = {
  id: string;
  label: string;
  emoji: string;
  /** 언제 이걸 고르나 */
  when: string;
  /** 순서대로 쓰는 도구 */
  steps: { toolId: string; why: string }[];
  /** 이 작업에서 가장 자주 하는 실수 */
  watchOut: string;
};

export const TASKS: TaskRecipe[] = [
  {
    id: "report",
    label: "레포트 쓰기",
    emoji: "📝",
    when: "주제는 정해졌고 이제 자료를 모아 글을 써야 할 때",
    steps: [
      {
        toolId: "deep-research",
        why: "먼저 쟁점 지도를 그립니다. 어떤 입장들이 있는지 모르는 채로 쓰기 시작하면 나중에 갈아엎게 됩니다.",
      },
      {
        toolId: "notebooklm",
        why: "찾은 자료와 강의자료를 한 노트북에 넣고, 인용을 눌러 원문을 확인하며 근거를 확정합니다.",
      },
      {
        toolId: "canvas",
        why: "목차 → 개요 → 본문 순으로 초안을 잡고 문단 단위로 다듬습니다.",
      },
      {
        toolId: "gems",
        why: "채점 기준표를 붙인 첨삭 Gem으로 제출 전 마지막 점검을 받습니다.",
      },
    ],
    watchOut:
      "AI가 준 출처를 확인 없이 그대로 인용하는 것. 숫자와 연도는 특히 원문에서 직접 확인하세요.",
  },
  {
    id: "exam",
    label: "시험공부",
    emoji: "📚",
    when: "시험 범위 강의자료는 있는데 어디서부터 손대야 할지 모를 때",
    steps: [
      {
        toolId: "notebooklm",
        why: "시험 범위 자료를 전부 올리고 학습 가이드와 마인드맵으로 전체 구조를 먼저 잡습니다.",
      },
      {
        toolId: "gems",
        why: "약한 단원은 개념 설명 Gem으로 쉬운 말부터 시험 답안 수준까지 단계별로 이해합니다.",
      },
      {
        toolId: "upload",
        why: "손으로 쓴 필기나 칠판 사진을 올려 정리된 노트로 바꿔 자료에 보탭니다.",
      },
    ],
    watchOut:
      "읽기만 하고 안다고 착각하는 것. 시험 3일 전부터는 NotebookLM 퀴즈로 직접 풀어보세요.",
  },
  {
    id: "presentation",
    label: "발표 준비",
    emoji: "🎤",
    when: "발표 주제를 받았고 슬라이드와 대본을 만들어야 할 때",
    steps: [
      {
        toolId: "notebooklm",
        why: "자료를 넣고 발표 흐름을 잡습니다. FAQ 기능으로 예상 질문을 미리 뽑아둘 수 있습니다.",
      },
      {
        toolId: "canvas",
        why: "발표 스크립트를 문단 단위로 다듬습니다. 시간에 맞춰 분량을 조절하기 좋습니다.",
      },
      {
        toolId: "nano-banana",
        why: "표지 이미지와 개념 도식을 만듭니다. 처음부터 16:9 비율로 요청하세요.",
      },
      {
        toolId: "gems",
        why: "리허설 파트너 Gem에게 예상 질문을 받고 답변 연습을 합니다.",
      },
    ],
    watchOut:
      "AI가 그린 도식의 라벨과 화살표가 틀린 채로 발표에 들어가는 것. 전공 내용이면 반드시 직접 검토하세요.",
  },
  {
    id: "research",
    label: "자료조사",
    emoji: "🔍",
    when: "주제만 있고 뭘 읽어야 할지 모를 때",
    steps: [
      {
        toolId: "deep-research",
        why: "웹을 여러 단계로 훑어 출처가 달린 개관을 받습니다. 주제를 좁게 잡을수록 결과가 좋습니다.",
      },
      {
        toolId: "notebooklm",
        why: "쓸 만한 자료를 노트북에 모아 넣고, 이제 그 안에서만 답하게 해 정확도를 올립니다.",
      },
    ],
    watchOut:
      "곁다리 자료까지 다 모으는 것. 실제로 쓸 것만 남겨야 이후 답변이 정확해집니다.",
  },
  {
    id: "team",
    label: "조별과제",
    emoji: "👥",
    when: "팀원끼리 결과물 형식이 제각각이라 합치기 힘들 때",
    steps: [
      {
        toolId: "gems",
        why: "과제 규칙을 담은 Gem을 하나 만들어 팀원 전원에게 공유합니다. 결과물 형식이 통일됩니다.",
      },
      {
        toolId: "notebooklm",
        why: "팀 공용 자료를 한 노트북에 모아 모두가 같은 근거를 보게 합니다.",
      },
      {
        toolId: "canvas",
        why: "각자 쓴 글을 합치고 톤을 맞춥니다.",
      },
    ],
    watchOut:
      "각자 따로 AI를 돌려서 문체와 형식이 다 다른 것. 공유 Gem 하나가 이걸 막아줍니다.",
  },
  {
    id: "lecture",
    label: "강의 정리·복습",
    emoji: "🗂️",
    when: "수업은 들었는데 노트가 엉망이라 나중에 못 알아볼 때",
    steps: [
      {
        toolId: "upload",
        why: "필기 사진이나 강의 PDF를 그대로 올려 정리된 텍스트로 바꿉니다.",
      },
      {
        toolId: "notebooklm",
        why: "주차별로 쌓아두면 나중에 '3주차와 7주차를 연결해서 설명해줘' 같은 것도 됩니다.",
      },
    ],
    watchOut:
      "정리본만 만들고 안 보는 것. 오디오 개요로 만들어 통학길에 들으면 실제로 복습하게 됩니다.",
  },
];
