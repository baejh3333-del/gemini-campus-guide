export type TargetScoreKey = 600 | 700 | 800 | 850 | 900 | 950;

export const TARGET_KEYS: TargetScoreKey[] = [600, 700, 800, 850, 900, 950];

export interface ToeicOption {
  label: string;
  text: string;
}

export interface ToeicPassage {
  header: string;
  paragraphs: string[];
}

export interface ToeicQuestion {
  id: number;
  part: string;
  skillKey: string;
  skillName: string;
  difficultyLabel: string;
  targetLevel: string;
  weight: number;
  targetSec: number;
  instruction: string;
  passage: ToeicPassage | null;
  prompt: string;
  options: ToeicOption[];
  correctIndex: number;
  explanation: string;
  studyTip: string;
}

export const TOEIC_QUESTIONS: ToeicQuestion[] = [
  {
    id: 1,
    part: "Part 5",
    skillKey: "basicGrammar",
    skillName: "기초 품사",
    difficultyLabel: "난이도 ★☆☆",
    targetLevel: "600점대 검증",
    weight: 14,
    targetSec: 15,
    instruction: "빈칸에 들어갈 가장 알맞은 어휘 형태를 고르세요.",
    passage: null,
    prompt:
      "Ms. Park reviewed the financial report ------- to ensure there were no calculation errors.",
    options: [
      { label: "A", text: "care" },
      { label: "B", text: "careful" },
      { label: "C", text: "carefully" },
      { label: "D", text: "carefulness" },
    ],
    correctIndex: 2,
    explanation:
      "주어(Ms. Park), 동사(reviewed), 목적어(the financial report)로 이미 완전한 문장이 형성되어 있습니다. 따라서 동사 reviewed를 수식하는 부사 (C) carefully(신중하게)가 정답입니다.",
    studyTip:
      "Part 5 품사 문제는 해석보다 빈칸 앞뒤 문장 성분을 3초 안에 파악하는 훈련이 핵심입니다.",
  },
  {
    id: 2,
    part: "Part 5",
    skillKey: "coreVocab",
    skillName: "핵심 어휘",
    difficultyLabel: "난이도 ★★☆",
    targetLevel: "700점대 검증",
    weight: 17,
    targetSec: 18,
    instruction: "문맥상 빈칸에 가장 자연스럽게 어울리는 동사를 고르세요.",
    passage: null,
    prompt:
      "To improve customer satisfaction, the service center has decided to ------- its operating hours on weekends.",
    options: [
      { label: "A", text: "extend" },
      { label: "B", text: "arrive" },
      { label: "C", text: "attend" },
      { label: "D", text: "inform" },
    ],
    correctIndex: 0,
    explanation:
      '목적어 operating hours(운영 시간)와 결합해 "운영 시간을 연장하다"라는 의미를 완성하는 타동사 (A) extend가 정답입니다. 토익에서는 extend a deadline/contract/hours 조합이 매우 자주 출제됩니다.',
    studyTip:
      '단어를 뜻 하나만 외우지 말고 "동사 + 자주 쓰이는 목적어(콜로케이션)" 세트로 암기하세요.',
  },
  {
    id: 3,
    part: "Part 5",
    skillKey: "advGrammar",
    skillName: "구조 문법",
    difficultyLabel: "난이도 ★★★",
    targetLevel: "800점대 검증",
    weight: 21,
    targetSec: 22,
    instruction: "문장 구조와 의미를 모두 고려해 빈칸에 알맞은 표현을 고르세요.",
    passage: null,
    prompt:
      "------- the unexpected delay in raw material shipments, the factory managed to meet the client's deadline.",
    options: [
      { label: "A", text: "Although" },
      { label: "B", text: "Despite" },
      { label: "C", text: "Even though" },
      { label: "D", text: "However" },
    ],
    correctIndex: 1,
    explanation:
      "빈칸 뒤에 동사가 없는 명사구(the unexpected delay in raw material shipments)가 왔고, 뒤 절과 역접(지연에도 불구하고 마감 준수) 관계이므로 양보의 전치사 (B) Despite가 정답입니다. Although/Even though는 접속사라 뒤에 주어+동사가 필요하며, However는 접속부사입니다.",
    studyTip:
      "전치사(Despite, During, Because of)와 접속사(Although, While, Because) 구분은 800점 돌파의 필수 관문입니다.",
  },
  {
    id: 4,
    part: "Part 6",
    skillKey: "contextLogic",
    skillName: "문맥 논리",
    difficultyLabel: "난이도 ★★★★",
    targetLevel: "850점대 검증",
    weight: 23,
    targetSec: 30,
    instruction:
      "아래 사내 공지사항의 흐름에 맞게 빈칸에 들어갈 가장 적절한 연결어를 고르세요.",
    passage: {
      header: "INTERNAL NOTICE · BUILDING MAINTENANCE",
      paragraphs: [
        "Notice to All Employees: The main elevator in Building B will undergo routine maintenance this Thursday from 9:00 A.M. to 2:00 P.M. -------, staff members working on the upper floors are encouraged to use the east stairwell or the service elevator in Building A.",
      ],
    },
    prompt: "Which word best fits the blank in the notice?",
    options: [
      { label: "A", text: "Nevertheless" },
      { label: "B", text: "Consequently" },
      { label: "C", text: "Otherwise" },
      { label: "D", text: "Previously" },
    ],
    correctIndex: 1,
    explanation:
      "앞 문장(B동 메인 엘리베이터 정기 점검)이 원인이고, 뒷 문장(상층부 직원들의 동쪽 계단 및 A동 화물 엘리베이터 이용 권장)이 그에 따른 결과입니다. 따라서 인과관계를 잇는 접속부사 (B) Consequently(그 결과, 따라서)가 정답입니다.",
    studyTip:
      "Part 6은 빈칸 문장만 보지 말고 바로 앞 문장과의 논리 관계(인과·역접·추가·예시)를 먼저 파악해야 오답을 줄입니다.",
  },
  {
    id: 5,
    part: "Part 7",
    skillKey: "readingComp",
    skillName: "실전 독해",
    difficultyLabel: "난이도 ★★★★★",
    targetLevel: "900점+ 검증",
    weight: 25,
    targetSec: 45,
    instruction: "이메일을 읽고 개정된 정책에 대한 내용으로 알맞은 것을 고르세요.",
    passage: {
      header: "E-MAIL · REVISED TRAVEL REIMBURSEMENT POLICY",
      paragraphs: [
        "From: David Chen, Operations Manager",
        "Starting next month, employees who travel for client meetings will no longer need to submit paper receipts for meals under $30. Instead, digital copies uploaded via the ExpenseHub app within five business days of returning will be accepted. Please note that lodging and airfare still require pre-approval from department heads at least two weeks prior to departure.",
      ],
    },
    prompt: "What is indicated about the updated policy?",
    options: [
      { label: "A", text: "All business expenses now require advance permission." },
      { label: "B", text: "Paper receipts are mandatory for every meal purchase." },
      {
        label: "C",
        text: "Digital receipts for qualifying meals must be uploaded promptly after a trip.",
      },
      {
        label: "D",
        text: "Employees must submit hotel receipts via email before departing.",
      },
    ],
    correctIndex: 2,
    explanation:
      '본문의 "digital copies uploaded via the ExpenseHub app within five business days of returning(복귀 후 5영업일 이내 앱으로 디지털 사본 업로드)"을 "출장 후 신속하게(promptly) 업로드해야 한다"로 바꿔 표현한 (C)가 정답입니다. (A) 숙박·항공만 사전 승인 필요, (B) 30달러 미만 식비는 종이 영수증 불필요, (D) 이메일 제출 언급 없음.',
    studyTip:
      "Part 7 고득점의 핵심은 지문의 표현을 보기의 동의어 표현으로 바꿔 쓰는 패러프레이징(Paraphrasing) 감각을 기르는 것입니다.",
  },
];

export interface FocusPart {
  part: string;
  matchPart: string;
  priority: string;
  desc: string;
}

export interface StudyMethod {
  title: string;
  icon: "vocab" | "grammar" | "listening" | "time";
  desc: string;
}

export interface TargetPlan {
  label: string;
  headline: string;
  dailyHours: string;
  rcTime: { p5: number; p6: number; p7: number };
  rcTip: string;
  focusParts: FocusPart[];
  methods: StudyMethod[];
}

export const TOEIC_TARGET_PLANS: Record<TargetScoreKey, TargetPlan> = {
  600: {
    label: "600점",
    headline:
      "핵심 기초 어휘와 Part 1·2·5 기본기만 잡아도 빠르게 도달할 수 있어요!",
    dailyHours: "하루 1~1.5시간",
    rcTime: { p5: 18, p6: 12, p7: 45 },
    rcTip:
      "600점 목표에서는 Part 7을 끝까지 다 풀기보다, Part 5·6에서 확실히 점수를 확보하고 Part 7 단일 지문 위주로 정확도를 높이는 전략이 유리합니다.",
    focusParts: [
      {
        part: "RC Part 5 (기초 품사·시제)",
        matchPart: "Part 5",
        priority: "최우선",
        desc: "명사·형용사·부사 자리와 수일치 같은 공식형 문제만 익혀도 RC 점수가 가장 빠르게 오릅니다.",
      },
      {
        part: "LC Part 1 & 2 (기본 청취)",
        matchPart: "LC",
        priority: "최우선",
        desc: "사진 묘사 빈출 표현과 Who/When/Where 의문사 질문의 첫 단어를 놓치지 않는 훈련에 집중하세요.",
      },
      {
        part: "RC Part 7 (단일 지문 앞부분)",
        matchPart: "Part 7",
        priority: "핵심",
        desc: "이메일·공지사항 등 짧은 단일 지문의 주제·목적·구체적 정보(시간/장소) 찾기부터 정복하세요.",
      },
      {
        part: "LC Part 3 (키워드 매칭)",
        matchPart: "LC",
        priority: "보조",
        desc: "모든 문장을 해석하려 하지 말고 질문의 키워드가 들릴 때 집중해 정답 단서를 잡으세요.",
      },
    ],
    methods: [
      {
        title: "빈출 기초 영단어 하루 50개",
        icon: "vocab",
        desc: "토익 기본 단어장의 1~15일차 핵심 비즈니스 어휘를 눈으로 여러 번 회독하며 품사와 함께 익히세요.",
      },
      {
        title: "문법 개념서 1회독 + 유형별 풀이",
        icon: "grammar",
        desc: "품사, 동사 태/시제, 전치사/접속사 3대 뼈대 문법을 2주 안에 정리하고 Part 5 기본 문제로 바로 적용하세요.",
      },
      {
        title: "LC 스크립트 소리 내어 따라 읽기",
        icon: "listening",
        desc: "Part 2 오답 문장은 반드시 원어민 음성을 듣고 입으로 따라 말하며 발음·연음에 귀를 트이게 하세요.",
      },
      {
        title: "시간 압박 없이 정확도 우선 훈련",
        icon: "time",
        desc: "처음부터 200문제를 다 풀려다 찍지 말고, 풀 수 있는 140문제를 정확히 맞추는 습관을 들이세요.",
      },
    ],
  },
  700: {
    label: "700점",
    headline:
      "LC 400점대 확보와 Part 5·6 감점 최소화 전략이 가장 효율적이에요!",
    dailyHours: "하루 1.5~2시간",
    rcTime: { p5: 15, p6: 10, p7: 50 },
    rcTip:
      "700점대 진입을 위해서는 Part 5·6을 총 25분 이내에 끝내고, Part 7에 최소 50분을 확보해 단일 지문 전체와 이중 지문 초반까지 풀어야 합니다.",
    focusParts: [
      {
        part: "LC Part 2 & 3 (점수 견인)",
        matchPart: "LC",
        priority: "최우선",
        desc: "LC에서 380~420점을 만들면 700점 달성이 훨씬 수월합니다. Part 2 우회 답변과 Part 3 스키밍을 익히세요.",
      },
      {
        part: "RC Part 5 (어휘 + 전치사/접속사)",
        matchPart: "Part 5",
        priority: "최우선",
        desc: "문법 문제는 15초 내외로 풀고, 자주 출제되는 동사·명사 콜로케이션 어휘 오답을 집중 정리하세요.",
      },
      {
        part: "RC Part 6 (문맥·연결어)",
        matchPart: "Part 6",
        priority: "핵심",
        desc: "접속부사와 문장 삽입 유형의 논리 흐름을 익히면 짧은 시간에 안정적인 득점이 가능합니다.",
      },
      {
        part: "RC Part 7 (단일 지문 완주)",
        matchPart: "Part 7",
        priority: "핵심",
        desc: "단일 지문(147~175번)의 정답률을 75% 이상으로 끌어올리는 데 집중하세요.",
      },
    ],
    methods: [
      {
        title: "콜로케이션 중심 어휘 확장",
        icon: "vocab",
        desc: '단독 단어 암기에서 벗어나 "meet a deadline, submit a proposal"처럼 덩어리 표현으로 암기하세요.',
      },
      {
        title: "Part 3·4 문제/보기 미리 읽기(스키밍)",
        icon: "listening",
        desc: "음성이 나오기 전 질문 3개의 핵심 키워드를 미리 파악해 듣고 풀 수 있는 리듬을 만드세요.",
      },
      {
        title: "Part 5 오답노트(유형별 분류)",
        icon: "grammar",
        desc: "틀린 문제를 단순히 체크만 하지 말고 [품사/접속사/어휘] 태그별로 모아 시험 전날 반복 복습하세요.",
      },
      {
        title: "주 1회 실전 타이머 모의고사",
        icon: "time",
        desc: "실제 OMR 마킹 시간을 포함해 2시간 집중력을 기르고, Part 7에서 몇 문제 남는지 매주 기록하세요.",
      },
    ],
  },
  800: {
    label: "800점",
    headline:
      "RC 시간 관리와 Part 7 패러프레이징 적응력이 800점 돌파의 열쇠예요!",
    dailyHours: "하루 2시간",
    rcTime: { p5: 12, p6: 9, p7: 54 },
    rcTip:
      "Part 5를 12분 안에 끊어내는 것이 800점의 핵심입니다. 확보한 54분으로 Part 7의 이중·삼중 지문까지 안정적으로 접근해야 합니다.",
    focusParts: [
      {
        part: "RC Part 7 (패러프레이징 & 이중 지문)",
        matchPart: "Part 7",
        priority: "최우선",
        desc: "지문 속 단어를 그대로 찾으려 하지 말고, 동의어·유사 표현으로 바뀐 보기를 연결하는 연습이 필수입니다.",
      },
      {
        part: "LC Part 3 & 4 (화자 의도·시각 자료)",
        matchPart: "LC",
        priority: "최우선",
        desc: 'LC 430점 이상을 목표로 도표 연계 문제와 따옴표("...") 화자 의도 파악 문제를 집중 훈련하세요.',
      },
      {
        part: "RC Part 5 (12분 타임어택)",
        matchPart: "Part 5",
        priority: "핵심",
        desc: "30문제 중 25개 이상을 12분 안에 맞추는 속도·정확도 밸런스를 완성해야 합니다.",
      },
      {
        part: "RC Part 6 (문장 삽입 4문제)",
        matchPart: "Part 6",
        priority: "핵심",
        desc: "대명사(it/they/this)와 관사(the) 단서를 활용해 문장 삽입 문제의 오답률을 줄이세요.",
      },
    ],
    methods: [
      {
        title: "패러프레이징 동의어 노트 정리",
        icon: "vocab",
        desc: "Part 7과 LC 3·4에서 지문 표현과 정답 보기 표현이 어떻게 바뀌었는지 짝지어 기록하세요. (예: within 5 days ↔ promptly)",
      },
      {
        title: "LC 1.1~1.2배속 쉐도잉 훈련",
        icon: "listening",
        desc: "평소보다 약간 빠른 배속으로 영국·호주 발음 지문을 듣고 따라 말하면 실전 시험이 훨씬 느리게 들립니다.",
      },
      {
        title: "Part 5·6 매일 1세트 20분 컷 훈련",
        icon: "grammar",
        desc: "매일 Part 5(30문항) + Part 6(16문항)을 20분 타이머를 켜고 풀어 실전 감각을 유지하세요.",
      },
      {
        title: "Part 7 지문 근거 형광펜 리뷰",
        icon: "time",
        desc: "채점 후 맞춘 문제라도 정답 근거 문장을 지문에서 정확히 찾아 표시하며 꼼꼼한 독해 속도를 끌어올리세요.",
      },
    ],
  },
  850: {
    label: "850점",
    headline:
      "실전 200문항 완주와 함정 보기 소거 능력으로 상위권에 안착하세요!",
    dailyHours: "하루 2~2.5시간",
    rcTime: { p5: 10, p6: 8, p7: 57 },
    rcTip:
      "850점대부터는 Part 5·6을 합쳐 18분 이내에 마무리하고, Part 7 54문항을 시간 내에 모두 읽고 푸는 체력과 속도가 요구됩니다.",
    focusParts: [
      {
        part: "RC Part 7 (다중 지문 연계 추론)",
        matchPart: "Part 7",
        priority: "최우선",
        desc: "이중·삼중 지문에서 두 개 이상의 문서를 교차 확인해야 풀리는 연계 문제(날짜·금액·할인 조건)를 집중 공략하세요.",
      },
      {
        part: "LC Part 2 (고난도 우회·평서문)",
        matchPart: "LC",
        priority: "최우선",
        desc: "LC 450+ 달성을 위해 후반부(18~31번)의 간접 답변과 소거법(오답 지우기) 전략을 체화하세요.",
      },
      {
        part: "RC Part 5 (고난도 어휘 뉘앙스)",
        matchPart: "Part 5",
        priority: "핵심",
        desc: "비슷한 뜻의 형용사·부사·전치사 뉘앙스 차이(예: notable vs noticeable, beside vs besides)를 정리하세요.",
      },
      {
        part: "LC Part 4 (긴 담화 흐름 유지)",
        matchPart: "LC",
        priority: "핵심",
        desc: "담화 전체의 맥락을 놓치지 않고 3문제를 동시에 처리하는 멀티태스킹 집중력을 훈련하세요.",
      },
    ],
    methods: [
      {
        title: "기출 실전서 주 2~3회 풀세트 실전",
        icon: "time",
        desc: "실제 시험 시간(오전 10시 10분 시작)에 맞춰 200문항을 끝까지 푸는 실전 루틴을 만드세요.",
      },
      {
        title: "Part 7 NOT/TRUE 문제 역추적 훈련",
        icon: "vocab",
        desc: "시간을 많이 잡아먹는 NOT/TRUE 유형은 보기의 키워드를 먼저 스캔해 지문 위치를 빠르게 찾는 연습을 하세요.",
      },
      {
        title: "LC 오답 소거법(A·B·C 탈락 기준)",
        icon: "listening",
        desc: "정답이 애매한 Part 2 고난도 문항은 시제 불일치·유사 발음 함정 보기를 지우는 소거법으로 정답률을 높이세요.",
      },
      {
        title: "고득점 800~900 전용 어휘 집중 암기",
        icon: "grammar",
        desc: "기본 단어장 대신 실전 모의고사 Part 5·7에서 모르는 어휘만 별도 추출해 나만의 오답 단어장을 완성하세요.",
      },
    ],
  },
  900: {
    label: "900점",
    headline:
      "LC 470+ 고정과 RC Part 5~7 무결점 속도전으로 900 벽을 넘으세요!",
    dailyHours: "하루 2.5시간",
    rcTime: { p5: 9, p6: 7, p7: 59 },
    rcTip:
      "900점 이상은 Part 5·6을 16분 내외로 끝내고, Part 7을 55분 안에 완주한 뒤 남은 3~4분 동안 헷갈렸던 추론 문항을 재검토하는 것이 이상적입니다.",
    focusParts: [
      {
        part: "LC 전 파트 (470~495점 방어)",
        matchPart: "LC",
        priority: "최우선",
        desc: "LC에서 실수 3~5개 이내로 막아주면 RC 부담이 크게 줄어듭니다. 호주·영국 성우 발음과 고난도 Part 2를 완벽 방어하세요.",
      },
      {
        part: "RC Part 7 (삼중 지문 & 의도/추론)",
        matchPart: "Part 7",
        priority: "최우선",
        desc: "185~200번 후반부 삼중 지문에서 집중력이 떨어지지 않도록 고난도 지문 연속 풀이 훈련을 하세요.",
      },
      {
        part: "RC Part 5 (10분 컷 & 어휘 함정)",
        matchPart: "Part 5",
        priority: "핵심",
        desc: "단순 문법은 5초 만에 넘기고, 까다로운 전치사 관용구·부사 어휘 문제에만 시간을 배분하세요.",
      },
      {
        part: "RC Part 6 (만점 목표)",
        matchPart: "Part 6",
        priority: "핵심",
        desc: "Part 6에서 1개 이하로 틀려야 900점 안착이 안정적입니다. 시제 일치와 지칭어 흐름을 정밀 점검하세요.",
      },
    ],
    methods: [
      {
        title: "고난도 1000제 실전 타이머 훈련",
        icon: "time",
        desc: "실제 시험보다 난이도가 약간 높은 고득점 실전서로 RC를 70분(5분 단축) 안에 푸는 압박 훈련을 진행하세요.",
      },
      {
        title: "지문 직독직해 & 재독 금지 습관",
        icon: "vocab",
        desc: "앞 문장을 다시 되돌아 읽는 습관을 없애고, 문장 단위가 아닌 의미 덩어리(청크) 단위로 한 번에 읽어 내려가세요.",
      },
      {
        title: '틀린 문제의 "오답 선택 이유" 분석',
        icon: "grammar",
        desc: '왜 정답이 맞는지보다 "내가 왜 매력적인 오답 보기에 속았는지" 출제자의 함정 패턴을 기록하세요.',
      },
      {
        title: "고속 LC 딕테이션(약점 문장만)",
        icon: "listening",
        desc: "전체 받아쓰기 대신 Part 2~4에서 뭉개져 들렸던 특정 1~2문장만 5회 반복 청취하며 약한 연음을 제거하세요.",
      },
    ],
  },
  950: {
    label: "950점+",
    headline:
      "최상위권 실력 완성! 미세한 함정 제거와 컨디션·집중력 관리가 승부처예요.",
    dailyHours: "하루 1.5~2시간 (실전 감각 유지)",
    rcTime: { p5: 8, p6: 7, p7: 60 },
    rcTip:
      "이미 충분한 기초와 속도를 갖추고 있습니다. Part 5·6을 15분 이내에 정확히 처리하고, Part 7의 세밀한 함정 조건(예외 조항, 날짜, 주체)을 놓치지 마세요.",
    focusParts: [
      {
        part: "RC Part 7 (고난도 추론 & 동의어)",
        matchPart: "Part 7",
        priority: "최우선",
        desc: "단어 뜻 추론(closest in meaning)과 문맥상 암시된 사실(imply/infer) 문항의 오답 제로화를 노리세요.",
      },
      {
        part: "LC 만점(495) 방어 전략",
        matchPart: "LC",
        priority: "최우선",
        desc: "방심하기 쉬운 Part 1의 상태/동작 수동태 함정과 Part 2의 1~2개 초고난도 문항만 잡아도 LC 만점이 가능합니다.",
      },
      {
        part: "RC Part 5 (최상위 어휘·관용구)",
        matchPart: "Part 5",
        priority: "핵심",
        desc: "자동사/타동사 혼동, 생소한 비즈니스 관용 표현 등 상위 1% 변별력 문항을 집중 수집하세요.",
      },
      {
        part: "실전 마킹 & 집중력 페이스 유지",
        matchPart: "Part 6",
        priority: "보조",
        desc: "2시간 동안 단 한 순간도 집중력이 끊기지 않도록 시험장 소음 환경에서도 실전 모의고사를 연습하세요.",
      },
    ],
    methods: [
      {
        title: "실전 기출 변형 문제 오답 제로 훈련",
        icon: "time",
        desc: "양치기보다 최신 경향 기출 모의고사 1회분을 풀고 틀린 2~3문항의 논리 구조를 완벽히 해부하세요.",
      },
      {
        title: "최상위 어휘·숙어 미세 뉘앙스 정리",
        icon: "vocab",
        desc: "유의어 그룹(예: assure/ensure/insure, complimentary/complementary)의 정확한 문맥 차이를 완벽 구분하세요.",
      },
      {
        title: "LC 고사장 스피커 환경 적응 훈련",
        icon: "listening",
        desc: "이어폰 대신 약간 울리는 스피커 음향으로 LC를 풀며 실전 고사장 환경의 청취 변수에 대비하세요.",
      },
      {
        title: "Part 7 함정 조건(예외·단서) 체크 습관",
        icon: "grammar",
        desc: '지문 끝부분의 "Please note / Except / Unless / Asterisk(*)" 같은 단서 문장을 자동으로 주목하는 습관을 유지하세요.',
      },
    ],
  },
};

export interface QuestionDetail {
  question: ToeicQuestion;
  userAnswer: number | null;
  isCorrect: boolean;
  timeSpent: number;
  isSlow: boolean;
}

export interface DiagnosisResult {
  correctCount: number;
  totalTime: number;
  speedLabel: string;
  finalScore: number;
  tierTitle: string;
  reasons: string[];
  roastComment: string;
  details: QuestionDetail[];
  defaultTarget: TargetScoreKey;
  weakParts: string[];
}

export function formatSecondsToMMSS(totalSec: number): string {
  const safeSec = Math.max(0, totalSec);
  const mins = Math.floor(safeSec / 60);
  const secs = Math.floor(safeSec % 60);
  return String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
}

export function formatDurationKorean(totalSec: number): string {
  const rounded = Math.max(1, Math.round(totalSec));
  if (rounded < 60) return `${rounded}초`;
  const mins = Math.floor(rounded / 60);
  const secs = rounded % 60;
  return secs === 0 ? `${mins}분` : `${mins}분 ${secs}초`;
}

export function calculateToeicDiagnosis(
  answers: (number | null)[],
  questionTimes: number[]
): DiagnosisResult {
  let correctCount = 0;
  let weightedPoints = 0;
  let totalTime = 0;

  const details: QuestionDetail[] = TOEIC_QUESTIONS.map((q, idx) => {
    const userAnswer = answers[idx] ?? null;
    const isCorrect = userAnswer === q.correctIndex;
    const timeSpent = Math.max(1, Math.round(questionTimes[idx] ?? 0));
    totalTime += timeSpent;
    if (isCorrect) {
      correctCount += 1;
      weightedPoints += q.weight;
    }
    return {
      question: q,
      userAnswer,
      isCorrect,
      timeSpent,
      isSlow: timeSpent > q.targetSec * 1.45,
    };
  });

  // 기본 점수 매핑 (0점 -> 445점, 100점 -> 945점)
  let rawScore = 445 + weightedPoints * 5.0;

  // 풀이 속도 보정 (정확도가 뒷받침될 때 빠른 풀이 가산, 매우 느릴 때 감산)
  let speedLabel = "적정";
  let speedFeedback =
    "전반적인 풀이 속도가 실전 권장 페이스를 잘 유지하고 있습니다.";

  if (totalTime <= 90) {
    speedLabel = "매우 빠름";
    if (correctCount >= 4) {
      rawScore += 30;
      speedFeedback =
        "문제당 평균 풀이 속도가 매우 빠르고 정확해, 실전 Part 7에서도 시간 여유를 확보할 수 있는 강점이 있습니다.";
    } else if (correctCount <= 2) {
      speedFeedback =
        "풀이 속도는 매우 빠르지만 오답이 발생했습니다. 보기를 끝까지 확인하지 않고 성급하게 고르는 습관을 점검해 보세요.";
    } else {
      rawScore += 10;
      speedFeedback =
        "전반적으로 빠른 풀이 리듬을 갖고 있어, 취약한 문법·독해 개념만 보완하면 점수가 가파르게 오를 잠재력이 큽니다.";
    }
  } else if (totalTime <= 150) {
    speedLabel = "안정적";
    if (correctCount >= 4) rawScore += 15;
    speedFeedback =
      "적절한 시간 안에 안정적으로 문제를 해결했습니다. 실전에서는 Part 5를 조금 더 단축하면 고득점에 유리합니다.";
  } else if (totalTime <= 210) {
    speedLabel = "다소 느림";
    if (correctCount >= 2) rawScore -= 15;
    speedFeedback =
      "문제당 고민 시간이 다소 길어지는 경향이 있습니다. 실전 시험 후반부(Part 7)에서 시간 부족으로 찍는 문항이 생길 가능성이 있어 감점 요인으로 반영되었습니다.";
  } else {
    speedLabel = "시간 부족 주의";
    if (correctCount >= 1) rawScore -= 25;
    speedFeedback =
      "풀이 시간이 권장 기준보다 크게 초과되었습니다. 실전 RC(75분 100문항)에서 시간 압박을 받을 가능성이 높아 속도 훈련이 반드시 필요합니다.";
  }

  // 0문제 정답 시 하한선 보정
  if (correctCount === 0) {
    rawScore = 440;
  }

  // 토익 점수 단위(5점 단위)로 반올림 및 420~990 범위 제한
  const finalScore = Math.min(
    990,
    Math.max(420, Math.round(rawScore / 5) * 5)
  );

  // 점수대별 등급 타이틀
  let tierTitle = "기초 입문형";
  if (finalScore >= 920) tierTitle = "최상위권 완성형 (900+)";
  else if (finalScore >= 840) tierTitle = "상위권 실전형 (850대)";
  else if (finalScore >= 750) tierTitle = "중상급 도약형 (750~800대)";
  else if (finalScore >= 650) tierTitle = "중급 성장형 (650~700대)";
  else if (finalScore >= 550) tierTitle = "기초 다지기형 (550~600대)";
  else tierTitle = "입문 출발형 (500 이하)";

  // 점수 산출 원인(왜 이 점수가 나왔는지) 맞춤 분석 문장 생성
  const reasons: string[] = [];
  const q1Ok = details[0]?.isCorrect ?? false;
  const q2Ok = details[1]?.isCorrect ?? false;
  const q3Ok = details[2]?.isCorrect ?? false;
  const q4Ok = details[3]?.isCorrect ?? false;
  const q5Ok = details[4]?.isCorrect ?? false;

  // 1) 패턴 기반 핵심 진단
  if (correctCount === 5) {
    reasons.push(
      "기초 품사부터 고난도 전치사/접속사 구분, Part 6 논리 연결, Part 7 패러프레이징 독해까지 전 영역에서 빈틈없는 정확도를 보여주었습니다."
    );
  } else if (correctCount === 0) {
    reasons.push(
      "5개 핵심 유형 모두에서 오답이 발생해, 아직 토익 빈출 문법 구조와 비즈니스 어휘 패턴에 익숙하지 않은 상태로 진단되었습니다."
    );
  } else if ((!q1Ok || !q2Ok) && (q4Ok || q5Ok)) {
    reasons.push(
      '독해 감각(Part 6·7)은 좋은 편이지만, 상대적으로 배점이 쉽고 빠르게 맞아야 할 기초 품사·필수 어휘(Part 5)에서 점수를 아쉽게 잃고 있는 전형적인 "감으로 푸는 유형"입니다.'
    );
  } else if (q1Ok && q2Ok && q3Ok && (!q4Ok || !q5Ok)) {
    reasons.push(
      "Part 5 문법과 핵심 어휘 기본기는 매우 탄탄합니다! 다만 지문이 길어지는 Part 6·7의 문맥 추론과 패러프레이징에서 점수가 막혀 850+ 진입이 지연되는 패턴입니다."
    );
  } else if (q1Ok && q2Ok && !q3Ok) {
    reasons.push(
      "600~700점대 기초 품사와 기본 어휘력은 갖추고 있으나, 800점 변별력 문항인 전치사·접속사 구조 구분(Q3)에서 흔들려 중급대에 머무르는 흐름입니다."
    );
  } else {
    const correctNames = details
      .filter((d) => d.isCorrect)
      .map((d) => d.question.skillName)
      .join(", ");
    const wrongNames = details
      .filter((d) => !d.isCorrect)
      .map((d) => d.question.skillName)
      .join(", ");
    reasons.push(
      `[${correctNames}] 영역은 정확하게 해결했으나, [${wrongNames}] 영역의 오답이 난이도 가중치에 반영되어 현재 점수로 산출되었습니다.`
    );
  }

  // 2) 세부 취약 포인트 짚어주기
  if (!q1Ok) {
    reasons.push(
      "Q1(기초 품사) 오답: 문장 성분(주어·동사·목적어·수식어)을 빠르게 구분하는 Part 5 공식형 문제를 보강하면 단기간에 50~80점 이상 끌어올릴 수 있습니다."
    );
  }
  if (!q2Ok) {
    reasons.push(
      'Q2(핵심 어휘) 오답: "extend operating hours" 같은 토익 빈출 비즈니스 동사-목적어 짝꿍 표현(콜로케이션) 암기가 부족한 상태입니다.'
    );
  }
  if (!q3Ok) {
    reasons.push(
      'Q3(전치사/접속사) 오답: 의미만 해석하고 빈칸 뒤에 "절(주어+동사)"이 오는지 "명사구"가 오는지 확인하는 문장 구조 분석 습관이 필요합니다.'
    );
  }
  if (!q4Ok) {
    reasons.push(
      "Q4(Part 6 문맥 논리) 오답: 빈칸 문장만 보지 않고 앞뒤 문장의 인과·역접 관계를 연결하는 접속부사 훈련이 필요합니다."
    );
  }
  if (!q5Ok) {
    reasons.push(
      'Q5(Part 7 패러프레이징) 오답: 지문의 "within five business days"가 보기의 "promptly"로 바뀌는 동의어 치환(Paraphrasing)에 익숙해져야 고득점에 도달합니다.'
    );
  }

  // 3) 풀이 속도 영향 추가
  reasons.push(
    `시간 관리 분석 (${formatDurationKorean(totalTime)} 소요): ${speedFeedback}`
  );

  // 4) 점수대 및 풀이 패턴 기반 인터넷 커뮤니티 감성 한 줄 팩폭 멘트 생성
  let roastComment = "";
  if (correctCount === 5 && totalTime <= 90) {
    roastComment =
      "응시료 아깝게 시험장 왜 감? YBM 기부천사 그만하고 지금 당장 900+ 찍고 토익판 탈출하셈 ㄹㅇㅋㅋ";
  } else if (correctCount === 5) {
    roastComment =
      "실력은 이미 토익 고인물인데 속도가 거북이네;; 시험장 가서 마지막에 마킹 밀릴 각이니까 타임어택만 좀 빡세게 하셈.";
  } else if (correctCount === 0) {
    roastComment =
      "찍신도 오늘 휴가 갔네 ㅋㅋ 이대로 가면 5만원 내고 2시간 동안 영어 ASMR 듣다 나옴. 오늘부터 단어장 펴라 제발.";
  } else if ((!q1Ok || !q2Ok) && (q4Ok || q5Ok)) {
    roastComment =
      "독해 감 하나로 버티는 야생형 인간이네 ㅋㅋ Part 5에서 주는 점수 다 발로 차고 있음. 기초 문법만 3일 봐도 점수 떡상할 듯.";
  } else if (q1Ok && q2Ok && q3Ok && !q4Ok && !q5Ok) {
    roastComment =
      "Part 5 여포 납셨네 ㅋㅋ 문법은 씹어 먹으면서 지문만 길어지면 갑자기 난독증 오는 거 실화냐? 이제 Part 7 정면승부 가자.";
  } else if (correctCount >= 3 && totalTime > 180) {
    roastComment =
      "정답률은 나쁘지 않은데 이 속도면 실전 Part 7 막판 20문제는 무조건 B로 한 줄 기둥 세워야 됨;; 지금 당장 스톱워치 켜라.";
  } else if (q1Ok && q2Ok && !q3Ok && finalScore < 800) {
    roastComment =
      '전형적인 "공부는 했는데 700대에서 평생 갇히는" 지박령 루트임. Despite랑 Although 구분 못 하면 800은 영원히 남의 점수다.';
  } else if (finalScore >= 840) {
    roastComment =
      '800 후반대 찍고 "아 900 아깝다 ㅠ" 하면서 응시료만 계속 갖다 바칠 관상임. 함정 보기 딱 두 개만 덜 밟으면 바로 졸업인데 가보자고!';
  } else if (finalScore >= 750) {
    roastComment =
      '제일 위험한 "어중간한 700 후반" 구간 ㅋㅋ 이 정도면 되겠지 하고 놀다가 성적표 까면 795점 뜨고 베개 치며 오열하는 루트임.';
  } else if (finalScore >= 650) {
    roastComment =
      "느낌적인 느낌으로 푸는데 꼭 2개 남기고 틀린 거 고르는 마이너스의 손이네;; 빈출 어휘랑 문법 뼈대만 채워도 앞자리 바로 바뀜.";
  } else if (finalScore >= 550) {
    roastComment =
      "아직 토익이랑 낯가리는 사이네 ㅋㅋ 지금 시험 보러 가면 감독관이랑 눈싸움만 하다 나옴. 기초 단어랑 Part 5 공식부터 2주만 굴리자.";
  } else {
    roastComment =
      "영어랑 내적 친밀감만 가득하고 실전은 초면인 상태 ㅋㅋ 감으로 찍는 메타는 끝났다, 기초 품사랑 단어장 Day 1부터 다시 가보자고!";
  }

  // 추천 기본 목표 점수 자동 선택 (현재 점수보다 한 단계 높은 현실적 목표)
  let defaultTarget: TargetScoreKey = 950;
  for (let i = 0; i < TARGET_KEYS.length; i++) {
    const key = TARGET_KEYS[i];
    if (key >= finalScore + 50) {
      defaultTarget = key;
      break;
    }
  }
  if (finalScore >= 900) defaultTarget = 950;

  // 방금 틀린 파트 집합 추출 (집중 파트 카드 강조용)
  const weakParts = Array.from(
    new Set(details.filter((d) => !d.isCorrect).map((d) => d.question.part))
  );

  return {
    correctCount,
    totalTime,
    speedLabel,
    finalScore,
    tierTitle,
    reasons,
    roastComment,
    details,
    defaultTarget,
    weakParts,
  };
}

export function getGoalGapSummary(
  currentScore: number,
  targetScore: TargetScoreKey
): { gapBadge: string; durationText: string } {
  const gap = targetScore - currentScore;

  if (gap <= 0) {
    return {
      gapBadge: "이미 목표 도달권!",
      durationText: "권장 학습 기간: 1~2주 실전 감각 유지",
    };
  }
  if (gap <= 60) {
    return {
      gapBadge: `+${gap}점 목표`,
      durationText: "권장 학습 기간: 약 2~4주 집중",
    };
  }
  if (gap <= 140) {
    return {
      gapBadge: `+${gap}점 목표`,
      durationText: "권장 학습 기간: 약 4~8주 권장",
    };
  }
  if (gap <= 240) {
    return {
      gapBadge: `+${gap}점 목표`,
      durationText: "권장 학습 기간: 약 2~3개월 체계적 학습",
    };
  }
  return {
    gapBadge: `+${gap}점 대도약`,
    durationText: "권장 학습 기간: 약 3~4개월 단계별 정복",
  };
}

export function buildDiagnosisCopyText(
  d: DiagnosisResult,
  targetScore: TargetScoreKey
): string {
  const plan = TOEIC_TARGET_PLANS[targetScore];
  const wrongDetails = d.details.filter((item) => !item.isCorrect);
  const slowCorrectDetails = d.details.filter(
    (item) => item.isCorrect && item.isSlow
  );
  const allCorrect = wrongDetails.length === 0;

  const correctSkills = d.details
    .filter((item) => item.isCorrect)
    .map((item) => `${item.question.part} ${item.question.skillName}`);
  const wrongSkills = wrongDetails.map(
    (item) => `${item.question.part} ${item.question.skillName}`
  );
  const slowSkills = slowCorrectDetails.map(
    (item) => `${item.question.part} ${item.question.skillName}`
  );

  const itemBreakdown = d.details.map((item, idx) => {
    const q = item.question;
    const status = item.isCorrect ? "O 정답" : "X 오답";
    const slowTag = item.isSlow ? ", 시간 초과 주의" : "";
    const base = `- Q${idx + 1} [${q.part} · ${q.skillName}] ${status} (${item.timeSpent}초${slowTag})`;
    if (item.isCorrect) {
      return base;
    }
    const userOpt =
      item.userAnswer !== null ? q.options[item.userAnswer] : undefined;
    const correctOpt = q.options[q.correctIndex];
    const userLabel = userOpt ? `(${userOpt.label}) ${userOpt.text}` : "미선택";
    const correctLabel = correctOpt
      ? `(${correctOpt.label}) ${correctOpt.text}`
      : "";
    return `${base}\n  · 내 선택: ${userLabel} / 정답: ${correctLabel}\n  · 핵심 약점 포인트: ${q.studyTip}`;
  });

  const priorityDrillRule = allCorrect
    ? slowSkills.length > 0
      ? `1. 5문제를 모두 맞혔으므로 900+ 고난도 변별력·패러프레이징·타임어택 훈련으로 진행하되, 풀이 시간이 길었던 영역(${slowSkills.join(", ")})의 속도 단축을 우선 공략할 것.`
      : `1. 5문제를 모두 정확히 맞혔으므로 900+ 고난도 변별력(어휘 뉘앙스·함정 보기 소거), Part 7 패러프레이징, 실전 타임어택 훈련 중심으로 진행할 것.`
    : `1. 틀린 영역(${wrongSkills.join(", ")})${
        slowSkills.length > 0
          ? `과 시간이 오래 걸린 영역(${slowSkills.join(", ")})`
          : ""
      }부터 우선순위를 정해 집중 공략할 것.`;

  const lines = [
    "[역할]",
    "너는 나의 1:1 토익 전문 튜터다. 한국어로 간결하고 명확하게 코칭하며, 실전 RC 풀이 속도 단축과 출제자의 오답 함정 분석에 특화되어 있다.",
    "",
    "[내 토익 진단 프로필]",
    `- 예상 점수: ${d.finalScore}점 (${d.tierTitle})`,
    `- 목표 점수: ${plan.label} (하루 권장 학습량: ${plan.dailyHours})`,
    `- 정답 수: ${d.correctCount}/${TOEIC_QUESTIONS.length} | 총 소요 시간: ${formatDurationKorean(d.totalTime)} (풀이 속도: ${d.speedLabel})`,
    `- 맞힌 영역: ${correctSkills.length > 0 ? correctSkills.join(", ") : "없음"}`,
    `- 틀린 영역: ${wrongSkills.length > 0 ? wrongSkills.join(", ") : "없음"}`,
    "",
    "▶ 문항별 정오표 및 소요 시간",
    ...itemBreakdown,
    "",
    "▶ 핵심 원인 분석",
    ...d.reasons.map((r) => `- ${r}`),
    "",
    `▶ 목표(${plan.label}) 우선 집중 파트 & RC 시간 배분 (총 75분)`,
    `- 추천 RC 시간 배분: Part 5 ${plan.rcTime.p5}분 / Part 6 ${plan.rcTime.p6}분 / Part 7 ${plan.rcTime.p7}분`,
    ...plan.focusParts.map((fp) => `- [${fp.priority}] ${fp.part}: ${fp.desc}`),
    "",
    "[맞춤 교육 진행 규칙]",
    priorityDrillRule,
    "2. 한 번에 1문제씩 실전 토익 변형 문제(A~D 4지선다)를 출제하고, 정답과 해설을 먼저 공개하지 말고 반드시 내 답변을 기다릴 것.",
    "3. 내가 답하면 아래 3단 구성으로 피드백한 뒤 바로 다음 문제를 출제할 것:",
    "   ① 정답 여부 및 핵심 3초 풀이 근거",
    "   ② 내가 고른 오답 함정 분석 (맞혔다면 가장 매력적인 오답 함정 짚기)",
    "   ③ 실전에 바로 쓰는 필수 콜로케이션·패러프레이징 정리",
    "4. 5문제마다 미니 리포트(정답률·개선된 점·남은 약점·다음 5문제 훈련 계획)를 제공할 것.",
    "",
    "[시작 지시]",
    "불필요한 인사나 서론 없이 지금 바로 내 핵심 약점 2줄 요약과 함께 **1번 맞춤 훈련 문제**부터 출제해 줘.",
  ];

  return lines.join("\n");
}
