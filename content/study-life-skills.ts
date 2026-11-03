import type { LibraryPrompt } from "@/lib/prompt-library";
import rawSkills from "./study-life-skills-raw.json";

type SkillEntry = {
  name: keyof typeof rawSkills;
  title: string;
  description: string;
  category: LibraryPrompt["category"];
  example: string;
  note?: string;
  repoUrl?: string;
};

const entries: SkillEntry[] = [
  {
    name: "study-system", title: "Study System · 시험 공부와 복습 계획",
    category: "학업·공부",
    description: "시험 범위를 작은 학습 단위로 나누고, 인출 연습·간격 복습·오답 기록을 포함한 공부 계획을 세워요.",
    example: "시험 범위와 남은 날짜를 첨부하고 ‘시험까지 3주, 하루 2시간 기준으로 복습 일정과 오답 기록 양식을 만들어줘’라고 요청하세요.",
  },
  {
    name: "quiz-generator", title: "Quiz Generator · 강의자료로 복습 문제 만들기",
    category: "학업·공부",
    description: "강의 노트에서 객관식·서술형 문제와 정답 해설을 만들고, 개념 이해와 응용을 함께 점검해요.",
    example: "강의자료를 첨부하고 ‘이 자료 안에서 복습 문제 10개를 내줘. 정답과 해설은 내가 푼 뒤 보여줘’라고 요청하세요.",
  },
  {
    name: "language-learning", title: "Language Learning · 매일 하는 외국어 공부",
    category: "학업·공부",
    description: "현재 언어 수준과 목표에 맞춰 읽기·어휘 복습·말하기 연습을 일상 루틴으로 구성해요.",
    example: "공부할 언어와 현재 수준을 알려주고 ‘하루 30분으로 여행 영어를 연습하는 주간 계획을 만들어줘’라고 요청하세요.",
  },
  {
    name: "academic-essay", title: "Academic Essay · 리포트의 주장과 근거 다듬기",
    category: "학업·공부",
    description: "리포트의 주장·근거·분석·반론을 구조화하고, 실제 출처를 보완해야 하는 부분을 찾아요.",
    example: "과제 조건과 내 초안을 첨부하고 ‘내 주장은 유지하면서 논리의 빈틈과 근거가 필요한 부분을 짚어줘. 출처를 지어내지 마’라고 요청하세요.",
  },
  {
    name: "deep-work-planner", title: "Deep Work Planner · 과제에 집중하는 시간표",
    category: "학업·공부",
    description: "수업과 약속 사이에 집중할 시간을 배치하고, 각 시간의 목표·첫 행동·휴식 계획을 정해요.",
    example: "시간표와 마감일을 보내고 ‘오늘 가능한 시간 안에서 과제 집중 시간과 휴식을 배치해줘’라고 요청하세요.",
    note: "시간표를 만드는 지침이에요. 캘린더 일정 등록이나 알림 설정은 자동으로 실행하지 않아요.",
  },
  {
    name: "habit-builder", title: "Habit Builder · 작은 행동부터 습관 만들기",
    category: "일상·자기관리",
    description: "독서나 정리처럼 미루던 일을 작은 행동으로 바꾸고, 실행 계기·환경·기록 방법을 설계해요.",
    example: "‘독서를 자꾸 미뤄. 저녁 양치 후 하루 5분부터 시작할 수 있는 습관 계획을 만들어줘’라고 요청하세요.",
  },
  {
    name: "journal-framework", title: "Journal Framework · 5분 일기와 하루 회고",
    category: "일상·자기관리",
    description: "생각 정리, 감사 기록, 하루 돌아보기 등 목적에 맞는 짧은 일기 질문과 주간 회고 양식을 만들어요.",
    example: "‘자기 전에 5분 동안 쓰는 회고 질문 3개와 주말에 돌아볼 질문을 만들어줘’라고 요청하세요.",
  },
  {
    name: "decision-making", title: "Decision Making · 고민되는 선택 비교하기",
    category: "일상·자기관리",
    description: "선택 기준과 중요도를 먼저 정하고, 대안의 장단점·불확실성·되돌릴 수 있는지를 비교해요.",
    example: "선택지와 고민을 설명하고 ‘두 동아리 중 어디가 나에게 맞을지 시간, 관심사, 활동 방식 기준으로 함께 비교해줘’라고 요청하세요.",
  },
  {
    name: "humanizer", title: "Humanizer · 내 글을 자연스럽게 다듬기",
    category: "일상·자기관리",
    description: "메일·소개글·에세이의 과장과 상투적인 표현을 줄이고, 원래 의미와 작성자의 목소리를 살려요.",
    example: "내 글을 붙여넣고 ‘사실과 내 말투는 유지하면서 어색한 표현을 자연스럽게 다듬어줘’라고 요청하세요.",
    note: "영어 문체에 관한 규칙이 많아 영문에 특히 적합해요. AI 작성 여부를 판별하거나 탐지 회피를 보장하는 도구는 아니에요.",
    repoUrl: "https://github.com/blader/humanizer/blob/main/SKILL.md",
  },
  {
    name: "tailored-resume-generator", title: "Tailored Resume Generator · 인턴·아르바이트 지원 준비",
    category: "일상·자기관리",
    description: "채용공고의 요구사항과 내 경험을 연결해 이력서의 경력·성과·키워드를 정리해요.",
    example: "채용공고와 기존 이력서를 붙여넣고 ‘이 공고에 맞춰 경험을 재배치해줘. 없는 경력이나 성과 수치는 만들지 마’라고 요청하세요.",
    repoUrl: "https://github.com/ComposioHQ/awesome-claude-skills/blob/master/tailored-resume-generator/SKILL.md",
  },
  {
    name: "doc-coauthoring", title: "Doc Co-authoring · 질문하며 함께 쓰는 기획서",
    category: "학업·공부",
    description: "배경과 독자를 정리하고, 목차와 내용을 함께 다듬은 뒤 처음 읽는 사람이 이해할 수 있는지 점검해요.",
    example: "‘교내 프로젝트 제안서를 함께 작성하자. 필요한 배경을 먼저 질문하고, 목차부터 단계적으로 다듬어줘’라고 요청하세요.",
    note: "원문에는 Claude 전용 도구와 새 대화에서의 독자 검토 절차가 포함돼요. Gemini에서는 대화형 작성에 활용하고, 사용할 수 없는 도구 대신 본문으로 결과를 요청하세요.",
    repoUrl: "https://github.com/anthropics/skills/blob/main/skills/doc-coauthoring/SKILL.md",
  },
  {
    name: "content-research-writer", title: "Content Research Writer · 자료에 근거한 글쓰기",
    category: "학업·공부",
    description: "참고 자료를 바탕으로 글의 개요·도입부·근거와 인용을 정리하고, 문단별 피드백으로 초안을 발전시켜요.",
    example: "참고 자료를 첨부하고 ‘이 자료를 바탕으로 교내 뉴스레터 글의 개요를 만들고, 근거의 출처를 표시해줘’라고 요청하세요.",
    note: "최신 자료 조사는 Gemini의 검색 기능 또는 직접 제공한 자료가 필요해요. 인용 내용과 출처는 원문과 대조해 확인하세요.",
    repoUrl: "https://github.com/ComposioHQ/awesome-claude-skills/blob/master/content-research-writer/SKILL.md",
  },
];

const variants = ["orbit", "sphere", "wave", "pills", "axis", "curves"] as const;

export const STUDY_LIFE_SKILLS: LibraryPrompt[] = entries.map((entry, index) => ({
  id: `skill-${entry.name}`,
  title: entry.title,
  description: entry.description,
  category: entry.category,
  kind: "skill",
  skillName: entry.name,
  repoUrl: entry.repoUrl ?? `https://github.com/SkillMedev/skills/blob/main/skills/${entry.name}/SKILL.md`,
  skillNote: [
    !entry.repoUrl ? "Skill Me 공개 스킬의 본문을 유지하고 업로드용 헤더 형식을 정리했어요." : "GitHub에 공개된 스킬 지침이에요.",
    entry.note,
  ].filter(Boolean).join(" "),
  thumbnail: { variant: variants[index % variants.length] },
  copyCount: null,
  steps: [
    "SKILL.md 다운로드 버튼으로 파일을 저장하세요.",
    "Gemini의 Customize(맞춤설정) → Skills(스킬) → Create(만들기) → Upload(업로드)에서 파일을 등록하세요.",
    entry.example,
    "한국어 답변을 원하면 ‘답변과 결과물은 한국어로 작성해줘’를 덧붙이세요.",
  ],
  body: rawSkills[entry.name],
}));
