import { GRADER_PROMPT } from "./original-prompts/grader";
import { TUTOR_PROMPT } from "./original-prompts/tutor";
import { REHEARSAL_PROMPT } from "./original-prompts/rehearsal";

/** 프롬프트 빌더 프리셋 + Gem 템플릿 */

export type BuilderPreset = {
  id: string;
  label: string;
  /** 네 칸의 예시. 학생이 한 줄로 짧게 적는 분량이다. */
  role: string;
  context: string;
  task: string;
  format: string;
  /**
   * 학생이 적은 한 줄 뒤에 자동으로 붙는 세부 지침.
   * 칸이 짧아도 완성된 프롬프트는 충분히 상세해진다. 칸이 비면 그 블록째 빠진다.
   */
  more: { role: string; context: string; task: string; format: string[] };
};

export const BUILDER_PRESETS: BuilderPreset[] = [
  {
    id: "report",
    label: "레포트",
    role: "해당 분야를 20년 가르친 교수",
    context: "3학년 전공 레포트, A4 4장, 주제는 [주제]",
    task: "목차 3안 제안, 안마다 핵심 논지 한 줄",
    format: "표로, 안마다 소제목 4개",
    more: {
      role: "학부생 레포트를 수백 편 채점해 봤고, 논지가 흐린 글과 선명한 글의 차이를 잘 압니다.",
      context:
        "주장이 분명하고 근거로 뒷받침되는 글을 쓰는 것이 목표입니다. 참고할 강의노트나 자료는 맨 아래에 붙이겠습니다.",
      task: "여러 안을 낼 때는 관점이 서로 겹치지 않게 하고, 각 안의 장점과 쓰기 어려운 점도 한 줄씩 붙여 주세요.",
      format: [
        "사료나 통계가 필요한 자리는 [근거 필요]로 표시해 주세요",
        "붙인 자료에 없는 내용은 따로 표시하고, 모르는 것은 지어내지 말아 주세요",
        "본문은 대신 쓰지 말고 요청한 것까지만 해 주세요",
        "마지막에 제가 다음에 결정해야 할 것을 질문 2개로 알려 주세요",
      ],
    },
  },
  {
    id: "presentation",
    label: "발표",
    role: "청중을 사로잡는 프레젠테이션 코치",
    context: "전공 수업 10분 발표, 청중은 같은 과 30명, 주제는 [주제]",
    task: "슬라이드 8장 구성안과 장별 핵심 멘트",
    format: "장 번호 / 제목 / 시각자료 / 말할 내용 3줄",
    more: {
      role: "학부생 발표를 많이 봐 왔고, 내용보다 구성과 전달에서 점수가 갈린다는 것을 압니다.",
      context:
        "청중이 끝까지 집중하고, 끝난 뒤 핵심 메시지 하나는 기억하게 만드는 것이 목표입니다. 조사한 내용이 있으면 맨 아래에 붙이겠습니다.",
      task: "구성을 짤 때는 도입에 관심을 끄는 장치를 하나 넣고, 마지막은 핵심 메시지 한 문장으로 끝나게 해 주세요.",
      format: [
        "슬라이드에는 글자를 최소로 하고, 말할 내용은 스크립트로 분리해 주세요",
        "장별 예상 시간을 적어서 전체 발표 시간 안에 들어오는지 확인해 주세요",
        "통계나 사례가 필요한 자리는 [근거 필요]로 표시해 주세요",
        "마지막에 청중이 던질 만한 질문 3개를 알려 주세요",
      ],
    },
  },
  {
    id: "exam",
    label: "시험공부",
    role: "출제 경험이 많은 조교",
    context: "중간고사, 범위는 [범위], 서술형 위주",
    task: "예상문제 10개와 채점 포인트",
    format: "문제 / 배점 / 필수 키워드 3개",
    more: {
      role: "교수님이 어디서 문제를 내고, 학생들이 어디서 점수를 잃는지 잘 압니다.",
      context:
        "외우는 것이 아니라 이해해서 서술형 답안을 직접 쓸 수 있게 되는 것이 목표입니다. 강의 요약이나 노트는 맨 아래에 붙이겠습니다.",
      task: "문제는 쉬운 것부터 어려운 것 순으로, 붙인 자료 범위 안에서만 내 주세요.",
      format: [
        "모범답안은 바로 보여 주지 말고 맨 아래에 모아 주세요",
        "학생들이 자주 헷갈리는 개념은 따로 짚어 주세요",
        "자료에 없는 내용은 지어내지 말아 주세요",
        "마지막에 시험 전까지 공부할 순서를 한 줄로 추천해 주세요",
      ],
    },
  },
  {
    id: "team",
    label: "조별과제",
    role: "프로젝트 매니저",
    context: "4명, 2주, 주제는 [주제], 결과물은 발표와 보고서",
    task: "역할 분담안과 2주 일정표",
    format: "표로, 담당자 / 할 일 / 마감일",
    more: {
      role: "끝까지 가는 팀과 중간에 무너지는 팀의 차이가 역할 분담과 중간 점검에 있다는 것을 압니다.",
      context:
        "한 사람에게 일이 몰리지 않고, 마감 전날 몰아서 하지 않는 것이 목표입니다. 팀원별 강점이나 사정이 있으면 맨 아래에 적겠습니다.",
      task: "누가 누구의 결과물을 기다려야 하는지 순서가 보이게 짜고, 중간 점검 날짜를 최소 한 번 넣어 주세요.",
      format: [
        "'다른 사람이 기다리는 것' 열을 추가해 주세요",
        "자료 취합, 최종 검토, 제출처럼 빠뜨리기 쉬운 일도 넣어 주세요",
        "일이 한 사람에게 쏠리지 않았는지 마지막에 확인해 주세요",
        "팀 단톡방에 바로 올릴 수 있는 공지문 3줄도 써 주세요",
      ],
    },
  },
  {
    id: "cover",
    label: "자기소개서",
    role: "채용 담당자 관점의 첨삭 전문가",
    context: "[회사·직무] 지원, 문항은 [문항], [숫자]자 제한",
    task: "약한 부분을 먼저 짚고 수정본 제안",
    format: "① 문제점 3가지 ② 수정본 ③ 바꾼 이유",
    more: {
      role: "하루에 수백 장을 읽는 사람이 어디서 멈추고 어디서 넘기는지 압니다.",
      context:
        "읽는 사람이 제 경험과 직무의 연결을 한 번에 알아보게 만드는 것이 목표입니다. 제 초안은 맨 아래에 붙이겠습니다.",
      task: "고칠 때는 제가 쓴 경험과 표현을 최대한 살리고, 문장 다듬기보다 구조와 메시지를 먼저 봐 주세요.",
      format: [
        "없는 경험이나 수치는 절대 지어내지 말아 주세요",
        "수정본 끝에 글자수를 적어서 제한을 넘지 않는지 확인해 주세요",
        "'열정', '성실' 같은 추상적인 말은 구체적인 행동으로 바꿔 주세요",
        "마지막에 면접에서 이 글로 받을 만한 질문 2개를 알려 주세요",
      ],
    },
  },
];

export type GemTemplate = {
  id: string;
  title: string;
  desc: string;
  outcomes: string[];
  instruction: string;
};

export const GEM_TEMPLATES: GemTemplate[] = [
  {
    id: "grader",
    title: "레포트 첨삭 조교",
    desc: GRADER_PROMPT.description,
    outcomes: GRADER_PROMPT.outcomes,
    instruction: GRADER_PROMPT.body,
  },
  {
    id: "tutor",
    title: "개념 설명 조교",
    desc: TUTOR_PROMPT.description,
    outcomes: TUTOR_PROMPT.outcomes,
    instruction: TUTOR_PROMPT.body,
  },
  {
    id: "rehearsal",
    title: "발표 리허설 파트너",
    desc: REHEARSAL_PROMPT.description,
    outcomes: REHEARSAL_PROMPT.outcomes,
    instruction: REHEARSAL_PROMPT.body,
  },
];
