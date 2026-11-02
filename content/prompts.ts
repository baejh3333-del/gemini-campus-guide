import { BUILDER_PRESETS, GEM_TEMPLATES } from "./templates";
import { buildPrompt } from "@/lib/prompt";
import type { LibraryPrompt } from "@/lib/prompt-library";
import rawSkills from "./github-skills-raw.json";

const presets: Record<
  string,
  {
    title: string;
    description: string;
    variant: LibraryPrompt["thumbnail"]["variant"];
    sourceKind: "릴스" | "카드뉴스";
    sourceNumber: number;
  }
> = {
  report: {
    title: "막막한 레포트, 목차부터",
    description: "주제 하나에서 서로 다른 관점의 목차 3안을 만들고, 내 글의 방향을 정해 보세요.",
    variant: "orbit",
    sourceKind: "카드뉴스",
    sourceNumber: 1,
  },
  exam: {
    title: "강의 노트로 예상문제 만들기",
    description: "내 강의 자료 안에서 예상문제와 채점 포인트를 만들어 이해한 내용을 확인해 보세요.",
    variant: "sphere",
    sourceKind: "릴스",
    sourceNumber: 1,
  },
  presentation: {
    title: "10분 발표의 흐름 잡기",
    description: "슬라이드 구성부터 장별 핵심 멘트까지, 발표 시간에 맞춰 정리해 보세요.",
    variant: "wave",
    sourceKind: "카드뉴스",
    sourceNumber: 2,
  },
  team: {
    title: "조별과제, 역할부터 일정까지",
    description: "팀원별 역할과 마감일, 서로 기다리는 작업을 한눈에 정리해 보세요.",
    variant: "pills",
    sourceKind: "릴스",
    sourceNumber: 2,
  },
  cover: {
    title: "내 경험이 드러나는 자기소개서",
    description: "내 초안의 약한 부분을 찾고, 경험과 지원 직무의 연결을 다듬어 보세요.",
    variant: "curves",
    sourceKind: "카드뉴스",
    sourceNumber: 3,
  },
};

const GITHUB_POPULAR_SKILLS: LibraryPrompt[] = [
  {
    id: "skill-frontend-design",
    title: "Frontend Design (고퀄리티 웹 UI 디자인 스킬 · 원본 전문)",
    description:
      "GitHub 공식 스킬 저장소 인기 1위(9,363자 무삭제 원본)! AI 특유의 뻔한 템플릿을 탈피하고 타이포그래피·모션·레이아웃을 프로덕션급으로 끌어올리는 공식 SKILL.md입니다.",
    category: "웹·디자인 (frontend·canvas)",
    kind: "skill",
    skillName: "frontend-design",
    repoUrl: "https://github.com/anthropics/skills/tree/main/skills/frontend-design",
    thumbnail: { variant: "orbit" },
    copyCount: null,
    steps: [
      "하단의 'SKILL.md 다운로드' 버튼을 눌러 9,363자 분량의 공식 원본 SKILL.md 파일을 내 컴퓨터에 저장하세요.",
      "Gemini 좌측 메뉴의 [스킬(Skills)] → [만들기 / 기능 업로드] 창에서 다운로드한 SKILL.md 파일을 드래그하여 업로드하세요.",
      "또는 'SKILL.md 텍스트 복사하기'를 눌러 일반 프롬프트처럼 대화창에 바로 붙여넣어도 동일하게 작동합니다.",
    ],
    body: rawSkills["frontend-design"],
  },
  {
    id: "skill-pdf-processor",
    title: "PDF Document Suite (PDF 분석·병합·OCR·양식 자동화 스킬 · 원본 전문)",
    description:
      "논문·전공서적 PDF에서 표와 텍스트를 추출하고 분할·병합·워터마크·OCR·양식 작성을 자동화하는 GitHub 공식 Document Skill(8,035자 무삭제 원본)입니다.",
    category: "문서·오피스 (docx·pdf·pptx·xlsx)",
    kind: "skill",
    skillName: "pdf",
    repoUrl: "https://github.com/anthropics/skills/tree/main/skills/pdf",
    thumbnail: { variant: "sphere" },
    copyCount: null,
    steps: [
      "'SKILL.md 다운로드'를 눌러 공식 원본(8,035자) 파일을 저장한 뒤 Gemini [스킬] → [기능 업로드]에 등록하세요.",
      "전공 PDF나 논문 파일을 첨부하고 원하는 작업(표 추출, 페이지 병합, 요약 리포트 생성 등)을 지시하세요.",
      "pypdf, pdfplumber, reportlab, pypdfium2 등 실제 프로덕션 코드 레퍼런스가 모두 포함되어 있습니다.",
    ],
    body: rawSkills["pdf"],
  },
  {
    id: "skill-pptx-deck",
    title: "PPTX Presentation Architect (발표 슬라이드 제작·편집 스킬 · 원본 전문)",
    description:
      "발표 자료(.pptx)의 슬라이드 구조 설계, 타이포그래피·컬러 팔레트, python-pptx/pptxgenjs 생성 및 QA 검증까지 담긴 초대형 공식 스킬(20,647자 무삭제 원본)입니다.",
    category: "문서·오피스 (docx·pdf·pptx·xlsx)",
    kind: "skill",
    skillName: "pptx",
    repoUrl: "https://github.com/anthropics/skills/tree/main/skills/pptx",
    thumbnail: { variant: "wave" },
    copyCount: null,
    steps: [
      "20,647자 분량의 공식 원본 SKILL.md 파일을 다운로드해 Gemini [스킬] 탭에 업로드하거나 복사해 붙여넣으세요.",
      "발표할 주제나 레포트 초안을 함께 보내며 슬라이드 덱 구성이나 .pptx 생성을 요청하세요.",
      "슬라이드 레이아웃 설계부터 컬러 조합, 시각적 QA 절차까지 원본 그대로 수행합니다.",
    ],
    body: rawSkills["pptx"],
  },
  {
    id: "skill-docx-editor",
    title: "DOCX Word Report Pro (워드 보고서·레포트 작성 스킬 · 원본 전문)",
    description:
      "대학 레포트, 공식 보고서, 기획안(.docx) 작성 시 목차(TOC)·표·머리글·교정 추적(Tracked Changes)까지 처리하는 GitHub 공식 스킬(6,868자 무삭제 원본)입니다.",
    category: "문서·오피스 (docx·pdf·pptx·xlsx)",
    kind: "skill",
    skillName: "docx",
    repoUrl: "https://github.com/anthropics/skills/tree/main/skills/docx",
    thumbnail: { variant: "pills" },
    copyCount: null,
    steps: [
      "6,868자 분량의 공식 원본 SKILL.md 파일을 다운로드하여 Gemini [스킬]에 업로드하거나 텍스트를 복사해 붙여넣으세요.",
      "작성할 레포트 주제나 초안 파일을 첨부하고 원하는 워드(.docx) 문서 양식을 요청하세요.",
      "docx-js 및 pandoc/LibreOffice 변환 규격까지 포함된 프로덕션 스킬입니다.",
    ],
    body: rawSkills["docx"],
  },
  {
    id: "skill-xlsx-analyst",
    title: "XLSX Data & Spreadsheet Analyst (엑셀·CSV 데이터 모델링 스킬 · 원본 전문)",
    description:
      "엑셀(.xlsx) 및 CSV 데이터 정제, 동적 수식 설계, 재무/통계 컬러 코딩 표준 및 수식 에러 검증까지 수행하는 공식 데이터 스킬(8,542자 무삭제 원본)입니다.",
    category: "문서·오피스 (docx·pdf·pptx·xlsx)",
    kind: "skill",
    skillName: "xlsx",
    repoUrl: "https://github.com/anthropics/skills/tree/main/skills/xlsx",
    thumbnail: { variant: "axis" },
    copyCount: null,
    steps: [
      "8,542자 분량의 공식 원본 SKILL.md를 다운로드해 Gemini [스킬]에 추가하거나 텍스트를 복사해 붙여넣으세요.",
      "CSV 또는 엑셀 데이터를 첨부하고 데이터 정제, 재무/통계 표 생성, 수식 작성을 요청하세요.",
      "openpyxl 수식 규칙과 업계 표준 색상 코딩, #REF!/#DIV/0! 제로 검증 절차가 그대로 적용됩니다.",
    ],
    body: rawSkills["xlsx"],
  },
  {
    id: "skill-canvas-design",
    title: "Canvas & Poster Design (포스터·인포그래픽 아트 디렉터 스킬 · 원본 전문)",
    description:
      "학회 포스터, 동아리 홍보물, 아트 그래픽을 미술관·매거진 급 디자인 철학과 공간 미학으로 설계해 주는 공식 비주얼 스킬(11,937자 무삭제 원본)입니다.",
    category: "웹·디자인 (frontend·canvas)",
    kind: "skill",
    skillName: "canvas-design",
    repoUrl: "https://github.com/anthropics/skills/tree/main/skills/canvas-design",
    thumbnail: { variant: "curves" },
    copyCount: null,
    steps: [
      "11,937자 분량의 공식 원본 SKILL.md 파일을 다운로드해 Gemini [스킬]에 업로드하거나 본문을 복사해 붙여넣으세요.",
      "만들고 싶은 포스터, 배너, 시각 디자인의 주제를 입력해 주세요.",
      "디자인 선언문(Design Philosophy) 수립부터 고해상도 PDF/PNG 캔버스 렌더링까지 수행합니다.",
    ],
    body: rawSkills["canvas-design"],
  },
  {
    id: "skill-mcp-builder",
    title: "MCP Server Builder (AI 외부 도구·API 연결 서버 구축 스킬 · 원본 전문)",
    description:
      "AI 에이전트에 외부 API, 데이터베이스, 노션/슬랙 등을 연결하는 Model Context Protocol(MCP) 서버를 구축하는 공식 개발 스킬(11,099자 무삭제 원본)입니다.",
    category: "개발·자동화 (mcp·webapp-testing)",
    kind: "skill",
    skillName: "mcp-builder",
    repoUrl: "https://github.com/anthropics/skills/tree/main/skills/mcp-builder",
    thumbnail: { variant: "agent" },
    copyCount: null,
    steps: [
      "11,099자 분량의 공식 원본 SKILL.md 파일을 다운로드해 Gemini [스킬]에 업로드하거나 텍스트를 복사해 붙여넣으세요.",
      "연결하고 싶은 외부 API나 서비스를 설명하면 Python(FastMCP) 또는 TypeScript(MCP SDK) 기반 서버를 설계해 줍니다.",
      "4단계 리서치·구현·리뷰·평가(Evaluation) 프로토콜 전문이 그대로 수록되어 있습니다.",
    ],
    body: rawSkills["mcp-builder"],
  },
  {
    id: "skill-webapp-testing",
    title: "Webapp Testing & QA (Playwright 웹 자동 테스트 스킬 · 원본 전문)",
    description:
      "내가 만든 웹사이트나 팀 프로젝트의 UI 동작, 콘솔 로그, 스크린샷 검증을 Playwright로 자동화하는 공식 QA 스킬(3,861자 무삭제 원본)입니다.",
    category: "개발·자동화 (mcp·webapp-testing)",
    kind: "skill",
    skillName: "webapp-testing",
    repoUrl: "https://github.com/anthropics/skills/tree/main/skills/webapp-testing",
    thumbnail: { variant: "portal" },
    copyCount: null,
    steps: [
      "공식 원본 SKILL.md 파일(3,861자)을 Gemini [스킬]에 업로드하거나 본문을 복사해 대화창에 붙여넣으세요.",
      "테스트할 로컬/배포 웹페이지 URL이나 시나리오를 입력하면 Reconnaissance-Then-Action 패턴으로 검증합니다.",
      "동적 웹앱 대기 처리, DOM 스냅샷 조사, 멀티 서버 구동 자동화 지침이 모두 담겨 있습니다.",
    ],
    body: rawSkills["webapp-testing"],
  },
  {
    id: "skill-internal-comms",
    title: "Internal Comms & 공지 작성 (팀 공지·주간보고·FAQ 스킬 · 원본 전문)",
    description:
      "3P 주간 보고(Progress, Plans, Problems), 팀 전체 공지, 프로젝트 업데이트, 사건 리포트 및 FAQ 작성을 돕는 공식 커뮤니케이션 스킬(1,511자 원본 전문)입니다.",
    category: "글쓰기·리서치 (internal-comms)",
    kind: "skill",
    skillName: "internal-comms",
    repoUrl: "https://github.com/anthropics/skills/tree/main/skills/internal-comms",
    thumbnail: { variant: "orbit" },
    copyCount: null,
    steps: [
      "공식 원본 SKILL.md 파일을 Gemini [스킬]에 업로드하거나 본문을 복사해 대화창에 붙여넣으세요.",
      "작성할 공지 유형(3P 주간 업데이트, 뉴스레터, FAQ, 프로젝트 공지 등)과 핵심 내용을 전달하세요.",
      "실무 표준 포맷에 맞춘 명확하고 간결한 커뮤니케이션 문서를 작성해 줍니다.",
    ],
    body: rawSkills["internal-comms"],
  },
];

export const LIBRARY_PROMPTS: LibraryPrompt[] = [
  ...["report", "exam", "presentation", "team", "cover"].map((id): LibraryPrompt => {
    const preset = BUILDER_PRESETS.find((item) => item.id === id)!;
    const item = presets[id];
    return {
      id,
      title: item.title,
      description: item.description,
      category: "릴스·카드뉴스",
      kind: "prompt",
      source: {
        kind: item.sourceKind,
        number: item.sourceNumber,
        url: "https://www.instagram.com/",
      },
      thumbnail: { variant: item.variant },
      copyCount: null,
      body: buildPrompt({
        preset: id,
        role: preset.role,
        context: preset.context,
        task: preset.task,
        format: preset.format,
      }),
      steps: [
        "아래 프롬프트를 복사해 Gemini 대화창에 붙여넣으세요.",
        "[주제], [범위]처럼 대괄호로 표시된 부분과 예시 조건을 내 상황에 맞게 바꾸세요.",
        "참고할 자료나 초안을 덧붙여 보내고, 답변을 확인하며 필요한 부분을 추가로 요청하세요.",
      ],
    };
  }),
  ...GEM_TEMPLATES.map((gem, index): LibraryPrompt => ({
    id: `gem-${gem.id}`,
    title: gem.title,
    description: gem.desc,
    category: "릴스·카드뉴스",
    kind: "gem",
    source: {
      kind: index % 2 === 0 ? "릴스" : "카드뉴스",
      number: index + 3,
      url: "https://www.instagram.com/",
    },
    thumbnail: { variant: (["agent", "axis", "portal"] as const)[index] },
    copyCount: null,
    body: gem.instruction,
    steps: [
      "아래 지시문을 복사하세요.",
      "Gemini에서 Gem을 만들 때 지시 사항에 붙여넣고 저장하세요. 일반 대화창에 붙여넣어 시작해도 됩니다.",
      "내 자료나 질문을 보내고, 안내에 따라 대화를 이어가세요.",
    ],
  })),
  ...GITHUB_POPULAR_SKILLS,
];
