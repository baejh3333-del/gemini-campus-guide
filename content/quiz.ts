import type { StepId } from "@/lib/progress";

export type QuizItem = {
  q: string;
  options: string[];
  answer: number;
  /** 틀렸을 때 되돌아갈 스텝 */
  from: StepId;
  why: string;
};

/** 5문항 중 4개 이상 정답이면 통과. */
export const PASS_SCORE = 4;

export const QUIZ: QuizItem[] = [
  {
    q: "프롬프트 4블록에 해당하지 않는 것은?",
    options: ["역할", "맥락", "작업", "분량 결제"],
    answer: 3,
    from: "prompt",
    why: "역할 · 맥락 · 작업 · 형식과 제약, 이 넷이 4블록입니다.",
  },
  {
    q: "긴 자료를 프롬프트에 함께 붙여넣을 때 권장하는 방법은?",
    options: [
      "지시와 자료를 구분선으로 나눠서 넣는다",
      "자료를 지시문 중간중간에 섞어 넣는다",
      "자료는 넣지 않고 제목만 알려준다",
      "한 문장으로 요약해서 넣는다",
    ],
    answer: 0,
    from: "prompt",
    why: "무엇이 명령이고 무엇이 참고자료인지 구분되어야 지시가 정확히 전달됩니다.",
  },
  {
    q: "Deep Research가 붙여준 출처를 다룰 때 옳은 태도는?",
    options: [
      "출처가 달려 있으니 그대로 인용해도 된다",
      "출처를 열어 원문에 실제로 그 내용이 있는지 확인한다",
      "출처 개수가 많으면 확인하지 않아도 된다",
      "한글 출처만 확인하면 된다",
    ],
    answer: 1,
    from: "research",
    why: "출처가 붙어 있다는 것과 그 내용이 사실이라는 것은 다릅니다. 특히 숫자와 연도를 확인하세요.",
  },
  {
    q: "NotebookLM이 일반 챗봇과 다른 핵심은?",
    options: [
      "답변 속도가 빠르다",
      "이미지를 만들 수 있다",
      "내가 올린 자료 안에서만 답한다",
      "무료 사용자만 쓸 수 있다",
    ],
    answer: 2,
    from: "notebook",
    why: "출처를 내 자료로 고정하기 때문에 강의에 없는 내용이 섞이지 않습니다.",
  },
  {
    q: "Gem 지시문에 넣기 가장 적절한 것은?",
    options: [
      "이번 주 과제의 구체적인 주제",
      "매번 지켜야 할 역할과 출력 형식",
      "오늘 날짜",
      "내가 받은 학점",
    ],
    answer: 1,
    from: "gem",
    why: "변하지 않는 것은 지시문에, 매번 바뀌는 것은 대화에 넣습니다.",
  },
];
