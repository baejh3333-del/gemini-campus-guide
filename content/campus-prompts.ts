import type { LibraryPrompt } from "@/lib/prompt-library";
import { CAMPUS_LIFE_PROMPT } from "./original-prompts/campus-life";
import { PHOTO_TASTE_PROMPT } from "./original-prompts/photo-taste";
import { MONTHLY_RECAP_PROMPT } from "./original-prompts/monthly-recap";
import { SYLLABUS_CALENDAR_PROMPT } from "./original-prompts/syllabus-calendar";
import { INTERNSHIP_ALERT_PROMPT } from "./original-prompts/internship-alert";
import { FOOD_BUDGET_PROMPT } from "./original-prompts/food-budget";
import { FRIDGE_COOKING_PROMPT } from "./original-prompts/fridge-cooking";
import { COMPUTER_LITERACY_PROMPT } from "./original-prompts/computer-literacy";

export const CAMPUS_PROMPTS: LibraryPrompt[] = [
  {
    id: "campus-life-review",
    title: "내 캠퍼스 생활을 분석해보자",
    ...CAMPUS_LIFE_PROMPT,
    category: "학업·공부",
    kind: "prompt",
    thumbnail: { variant: "orbit", src: "/prompt-thumbnails/campus-life-review.png", alt: "내 캠퍼스 생활을 분석해보자 썸네일" },
    copyCount: null,
    steps: ["프롬프트를 AI 대화창에 붙여넣으세요.", "최근 일주일의 시간표와 과제·활동 기록을 필요한 범위만 공유하세요.", "시간이 몰리는 구간을 확인하고 다음 주 조정안 하나를 골라 보세요."],
  },
  {
    id: "drive-photo-taste",
    title: "내 드라이브 사진으로 취향 찾기",
    ...PHOTO_TASTE_PROMPT,
    category: "일상·자기관리",
    kind: "prompt",
    thumbnail: { variant: "wave", src: "/prompt-thumbnails/drive-photo-taste.png", alt: "내 드라이브 사진으로 취향 찾기 썸네일" },
    copyCount: null,
    steps: ["프롬프트를 AI 대화창에 붙여넣으세요.", "직접 고른 사진이나 연락시트를 첨부하세요. 연결 기능이 있으면 읽을 폴더를 지정할 수 있어요.", "관찰한 패턴이 실제 취향과 맞는지 알려 주고 작은 촬영 실험을 골라 보세요."],
  },
  {
    id: "google-monthly-recap",
    title: "구글이 기억하는 최근 한 달의 나",
    ...MONTHLY_RECAP_PROMPT,
    category: "일상·자기관리",
    kind: "prompt",
    thumbnail: { variant: "sphere", src: "/prompt-thumbnails/google-monthly-recap.png", alt: "구글이 기억하는 최근 한 달의 나 썸네일" },
    copyCount: null,
    steps: ["프롬프트와 돌아볼 날짜 범위를 AI에 보내세요.", "캘린더·문서 발췌·활동 메모 중 공유할 기록을 선택하세요. 계정 전체 자료는 필요 없어요.", "주요 사건과 반복된 주제를 확인하고 다음 달에 이어 갈 일을 골라 보세요."],
  },
  {
    id: "syllabus-to-calendar",
    title: "강의계획서를 구글 캘린더에 바로 넣어보자",
    ...SYLLABUS_CALENDAR_PROMPT,
    category: "학업·공부",
    kind: "prompt",
    thumbnail: { variant: "axis", src: "/prompt-thumbnails/syllabus-to-calendar.png", alt: "강의계획서를 구글 캘린더에 바로 넣어보자 썸네일" },
    copyCount: null,
    steps: ["프롬프트와 강의계획서를 보내고 학기·연도·시간대를 확인하세요.", "AI가 추출한 수업·시험·마감 일정에서 불확실한 날짜와 시각을 확인하세요.", "연결 도구로 등록하거나 생성한 ICS·CSV 파일을 컴퓨터의 Google Calendar로 가져오세요."],
  },
  {
    id: "daily-internship-alert",
    title: "직무 인턴 공고 AI로 매일 자동 확인하기",
    ...INTERNSHIP_ALERT_PROMPT,
    category: "일상·자기관리",
    kind: "prompt",
    thumbnail: { variant: "agent", src: "/prompt-thumbnails/daily-internship-alert.png", alt: "직무 인턴 공고 AI로 매일 자동 확인하기 썸네일" },
    copyCount: null,
    steps: ["프롬프트와 원하는 직무·지역·근무 가능 기간을 보내세요.", "공식 공고에서 자격과 마감일을 확인하고 검색 조건을 조정하세요.", "실제 예약 기능이 있으면 시각·시간대를 정해 저장하세요. 없으면 일회성 검색이나 수동 재실행으로 사용해요."],
  },
  {
    id: "random-food-budget",
    title: "랜덤 식비 예산 챌린지",
    ...FOOD_BUDGET_PROMPT,
    category: "일상·자기관리",
    kind: "prompt",
    thumbnail: { variant: "pills", src: "/prompt-thumbnails/random-food-budget.png", alt: "랜덤 식비 예산 챌린지 썸네일" },
    copyCount: null,
    steps: ["총 식비·기간·식사 조건과 함께 프롬프트를 보내세요.", "이미 있는 재료와 확정 지출을 반영한 하루 예산안을 확인하세요.", "실제 지출을 기록하고 남은 예산으로 다음 날의 선택을 조정하세요."],
  },
  {
    id: "fridge-cooking",
    title: "냉장고 재료로 자취 요리 조합 찾아보자",
    ...FRIDGE_COOKING_PROMPT,
    category: "일상·자기관리",
    kind: "prompt",
    thumbnail: { variant: "curves", src: "/prompt-thumbnails/fridge-cooking.png", alt: "냉장고 재료로 자취 요리 조합 찾아보자 썸네일" },
    copyCount: null,
    steps: ["재료 목록이나 사진과 프롬프트를 AI에 보내세요.", "수량·보관 정보·조리 도구·피해야 할 음식을 확인하세요.", "메뉴 후보를 고르고 실제 사용할 분량과 조리 순서를 받아 보세요."],
  },
  {
    id: "computer-literacy-week",
    title: "일주일 만에 벼락치기 컴활 공부",
    ...COMPUTER_LITERACY_PROMPT,
    category: "학업·공부",
    kind: "prompt",
    thumbnail: { variant: "portal", src: "/prompt-thumbnails/computer-literacy-week.png", alt: "일주일 만에 벼락치기 컴활 공부 썸네일" },
    copyCount: null,
    steps: ["프롬프트와 급수·필기 또는 실기·시험일을 알려 주세요.", "하루 공부 시간과 현재 수준을 확인해 7일 계획을 만드세요.", "확인 문제나 실제 프로그램 연습을 하고 오답에 맞춰 남은 계획을 조정하세요."],
  },
];
