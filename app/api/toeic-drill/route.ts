const MAX_BODY_BYTES = 8000;
const MAX_REQUESTS_PER_HOUR = 20;
const ONE_HOUR_MS = 60 * 60 * 1000;
const TRIAL_COOKIE_NAME = "gsa_toeic_drill_used";
const TRIAL_COOKIE_HEADER = `${TRIAL_COOKIE_NAME}=1; Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax`;
const OPTION_LABELS = ["A", "B", "C", "D"] as const;

type OptionLabel = (typeof OPTION_LABELS)[number];

interface DrillOption {
  label: OptionLabel;
  text: string;
}

interface DrillQuestion {
  part: string;
  skillName: string;
  prompt: string;
  options: DrillOption[];
  correctIndex: number;
  explanation: string;
  collocationTip: string;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const globalForRateLimit = globalThis as typeof globalThis & {
  __toeicDrillRateMap?: Map<string, RateLimitEntry>;
};

const ipRateLimitMap =
  globalForRateLimit.__toeicDrillRateMap ??
  (globalForRateLimit.__toeicDrillRateMap = new Map<string, RateLimitEntry>());

const DRILL_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    focusSummary: { type: "string" },
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          part: { type: "string" },
          skillName: { type: "string" },
          prompt: { type: "string" },
          options: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string", enum: [...OPTION_LABELS] },
                text: { type: "string" },
              },
              required: ["label", "text"],
              additionalProperties: false,
            },
          },
          correctIndex: { type: "integer" },
          explanation: { type: "string" },
          collocationTip: { type: "string" },
        },
        required: [
          "part",
          "skillName",
          "prompt",
          "options",
          "correctIndex",
          "explanation",
          "collocationTip",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["focusSummary", "questions"],
  additionalProperties: false,
};

const SYSTEM_INSTRUCTIONS = [
  "너는 ETS 토익 RC 출제위원 수준의 전문 문항 제작자이자 한국어 토익 강사다.",
  "학습자의 진단 결과(현재 점수, 목표 점수, 약점 스킬, 오답 주제, 찍어서 맞힌 주제, 남은 기간)를 반영해 완전히 새로운 ETS 스타일 토익 RC 변형 문제 3문항을 출제한다.",
  "반드시 지켜야 할 규칙:",
  "1. 기존 진단 문항을 복사하거나 문장만 살짝 바꾸지 말고, 비즈니스 이메일·사내 공지·계약·물류·인사·재무 등 현실적인 직장 상황으로 완전히 새로운 문항 3개를 만든다.",
  "2. 학습자의 weakSkills, wrongTopics, guessedTopics를 최우선으로 겨냥하며 targetScore 난이도에 맞춘다. 약점이 비어 있으면 900~950+ 고득점 변별력 함정(전치사/접속사 구분, 고급 연어, 문맥 어휘)으로 출제한다.",
  "3. questions 배열은 정확히 3개 문항이어야 하며, 각 문항의 part는 'Part 5' 또는 'Part 6'으로 표기한다.",
  "4. 각 문항의 prompt는 자연스러운 영어 토익 문장(또는 짧은 2~3문장 Part 6 지문)으로 작성하고, 빈칸은 반드시 정확히 하나의 '-------'로 표시한다.",
  "5. options는 반드시 A, B, C, D 순서대로 정확히 4개이며, 정답은 논쟁의 여지 없이 단 1개만 성립해야 한다. correctIndex는 0~3 정수이며 정답 보기와 정확히 일치해야 한다.",
  "6. explanation은 한국어로 3초 풀이 핵심 근거와 오답 함정 포인트를 간결하게(2~3문장) 설명한다.",
  "7. collocationTip은 실전 토익에서 자주 나오는 핵심 연어(collocation) 또는 패러프레이징 팁을 한국어로 짧게 정리한다.",
  "8. focusSummary는 이번 3문항이 어떤 약점을 집중 공략하는지 한국어 한 줄로 요약한다.",
].join(" ");

function hasTrialUsedCookie(cookieHeader: string | null): boolean {
  if (!cookieHeader) return false;
  return cookieHeader
    .split(";")
    .some((part) => part.trim() === `${TRIAL_COOKIE_NAME}=1`);
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const firstIp = forwarded?.split(",")[0]?.trim();
  return firstIp || "local";
}

function isStringArray(
  value: unknown,
  maxItems: number,
  maxItemLength: number
): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= maxItems &&
    value.every(
      (item) => typeof item === "string" && item.length <= maxItemLength
    )
  );
}

function sanitizeStrings(items: string[]): string[] {
  return items.map((item) => item.trim()).filter(Boolean);
}

async function callOpenAIResponses(
  model: string,
  userPrompt: string
): Promise<Response> {
  return fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(30000),
    body: JSON.stringify({
      model,
      store: false,
      max_output_tokens: 1800,
      instructions: SYSTEM_INSTRUCTIONS,
      input: [{ role: "user", content: userPrompt }],
      text: {
        format: {
          type: "json_schema",
          name: "toeic_weakness_drill",
          strict: true,
          schema: DRILL_RESPONSE_SCHEMA,
        },
      },
    }),
  });
}

function validateDrillOutput(raw: unknown): {
  focusSummary: string;
  questions: DrillQuestion[];
} | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as {
    focusSummary?: unknown;
    questions?: unknown;
  };

  if (
    typeof candidate.focusSummary !== "string" ||
    !candidate.focusSummary.trim()
  ) {
    return null;
  }

  if (!Array.isArray(candidate.questions) || candidate.questions.length !== 3) {
    return null;
  }

  const questions: DrillQuestion[] = [];

  for (const item of candidate.questions) {
    if (!item || typeof item !== "object") return null;
    const q = item as Record<string, unknown>;

    if (
      typeof q.part !== "string" ||
      !q.part.trim() ||
      typeof q.skillName !== "string" ||
      !q.skillName.trim() ||
      typeof q.prompt !== "string" ||
      !q.prompt.trim() ||
      typeof q.explanation !== "string" ||
      !q.explanation.trim() ||
      typeof q.collocationTip !== "string" ||
      !q.collocationTip.trim() ||
      typeof q.correctIndex !== "number" ||
      !Number.isInteger(q.correctIndex) ||
      q.correctIndex < 0 ||
      q.correctIndex > 3 ||
      !Array.isArray(q.options) ||
      q.options.length !== 4
    ) {
      return null;
    }

    const options: DrillOption[] = [];
    for (let i = 0; i < 4; i++) {
      const opt = q.options[i];
      if (!opt || typeof opt !== "object") return null;
      const o = opt as Record<string, unknown>;
      const expectedLabel = OPTION_LABELS[i];
      if (
        typeof o.label !== "string" ||
        !OPTION_LABELS.includes(o.label as OptionLabel) ||
        typeof o.text !== "string" ||
        !o.text.trim()
      ) {
        return null;
      }
      options.push({
        label: expectedLabel,
        text: o.text.trim().slice(0, 300),
      });
    }

    questions.push({
      part: q.part.trim().slice(0, 30),
      skillName: q.skillName.trim().slice(0, 60),
      prompt: q.prompt.trim().slice(0, 1200),
      options,
      correctIndex: q.correctIndex,
      explanation: q.explanation.trim().slice(0, 800),
      collocationTip: q.collocationTip.trim().slice(0, 400),
    });
  }

  return {
    focusSummary: candidate.focusSummary.trim().slice(0, 240),
    questions,
  };
}

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return Response.json(
      { error: "허용되지 않은 요청입니다." },
      { status: 403 }
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      {
        error:
          "AI 맞춤 문제 출제 기능을 준비 중입니다. 잠시 후 다시 시도하거나 아래 Gemini 프롬프트로 바로 훈련해 보세요!",
      },
      { status: 503 }
    );
  }

  if (hasTrialUsedCookie(request.headers.get("cookie"))) {
    return Response.json(
      {
        code: "TRIAL_USED",
        error:
          "무료 1회 AI 맞춤 문제 체험을 이미 사용했어요. 학생 Gemini 무료 구독으로 무제한 이어서 훈련해 보세요!",
      },
      { status: 429 }
    );
  }

  const clientIp = getClientIp(request);
  const now = Date.now();
  const existingRate = ipRateLimitMap.get(clientIp);
  if (existingRate && now < existingRate.resetAt) {
    if (existingRate.count >= MAX_REQUESTS_PER_HOUR) {
      return Response.json(
        {
          code: "IP_RATE_LIMIT",
          error:
            "잠시 요청이 몰렸어요. 잠시 후 다시 시도하거나 Gemini에서 바로 이어서 풀어보세요!",
        },
        { status: 429 }
      );
    }
  } else if (existingRate && now >= existingRate.resetAt) {
    ipRateLimitMap.delete(clientIp);
  }

  if (Number(request.headers.get("content-length") || 0) > MAX_BODY_BYTES) {
    return Response.json(
      { error: "요청 데이터가 너무 큽니다." },
      { status: 413 }
    );
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return Response.json(
      { error: "올바른 요청이 아닙니다." },
      { status: 400 }
    );
  }

  if (new TextEncoder().encode(rawBody).length > MAX_BODY_BYTES) {
    return Response.json(
      { error: "요청 데이터가 너무 큽니다." },
      { status: 413 }
    );
  }

  let data: unknown;
  try {
    data = JSON.parse(rawBody);
  } catch {
    return Response.json(
      { error: "올바른 요청이 아닙니다." },
      { status: 400 }
    );
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return Response.json(
      { error: "진단 데이터를 확인해 주세요." },
      { status: 400 }
    );
  }

  const payload = data as Record<string, unknown>;
  const {
    finalScore,
    targetScore,
    weakSkills,
    wrongTopics,
    guessedTopics,
    ddayLabel,
  } = payload;

  if (
    typeof finalScore !== "number" ||
    !Number.isFinite(finalScore) ||
    finalScore < 0 ||
    finalScore > 990 ||
    typeof targetScore !== "number" ||
    !Number.isFinite(targetScore) ||
    targetScore < 0 ||
    targetScore > 990 ||
    !isStringArray(weakSkills, 20, 120) ||
    !isStringArray(wrongTopics, 20, 160) ||
    (guessedTopics !== undefined && !isStringArray(guessedTopics, 20, 160)) ||
    (ddayLabel !== undefined &&
      (typeof ddayLabel !== "string" || ddayLabel.length > 80))
  ) {
    return Response.json(
      { error: "진단 데이터를 확인해 주세요." },
      { status: 400 }
    );
  }

  // Record IP usage after validation passes; prune map if it grows large.
  if (ipRateLimitMap.size > 5000) {
    for (const [key, entry] of ipRateLimitMap.entries()) {
      if (now >= entry.resetAt) ipRateLimitMap.delete(key);
    }
  }
  const activeRate = ipRateLimitMap.get(clientIp);
  if (activeRate && now < activeRate.resetAt) {
    activeRate.count += 1;
  } else {
    ipRateLimitMap.set(clientIp, { count: 1, resetAt: now + ONE_HOUR_MS });
  }

  const cleanWeakSkills = sanitizeStrings(weakSkills);
  const cleanWrongTopics = sanitizeStrings(wrongTopics);
  const cleanGuessedTopics = guessedTopics
    ? sanitizeStrings(guessedTopics)
    : [];
  const cleanDdayLabel = ddayLabel?.trim() || "";

  const userPrompt = JSON.stringify({
    learnerProfile: {
      finalScore: Math.round(finalScore),
      targetScore: Math.round(targetScore),
      weakSkills: cleanWeakSkills,
      wrongTopics: cleanWrongTopics,
      guessedTopics: cleanGuessedTopics,
      ...(cleanDdayLabel ? { ddayLabel: cleanDdayLabel } : {}),
    },
    request:
      "위 학습자 약점 데이터를 기반으로 ETS 실전 스타일의 새로운 토익 RC 변형 문제 3문항을 JSON 스키마에 맞춰 출제해 주세요.",
  });

  const primaryModel = process.env.OPENAI_TOEIC_MODEL || "gpt-4.1-nano";
  const fallbackModel = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  try {
    let modelUsed = primaryModel;
    let response = await callOpenAIResponses(primaryModel, userPrompt);

    if (!response.ok && fallbackModel !== primaryModel) {
      modelUsed = fallbackModel;
      response = await callOpenAIResponses(fallbackModel, userPrompt);
    }

    if (!response.ok) {
      throw new Error("upstream");
    }

    const result = (await response.json()) as {
      status?: string;
      output?: Array<{ content?: Array<{ type: string; text?: string }> }>;
    };

    if (result.status !== "completed") {
      throw new Error("incomplete");
    }

    const outputText = result.output
      ?.flatMap((item) => item.content ?? [])
      .find((item) => item.type === "output_text")?.text;

    const parsed: unknown = JSON.parse(outputText || "{}");
    const validated = validateDrillOutput(parsed);
    if (!validated) {
      throw new Error("invalid");
    }

    return Response.json(
      {
        ok: true,
        modelUsed,
        focusSummary: validated.focusSummary,
        questions: validated.questions,
      },
      {
        status: 200,
        headers: {
          "Set-Cookie": TRIAL_COOKIE_HEADER,
        },
      }
    );
  } catch {
    return Response.json(
      {
        error:
          "AI 맞춤 문제를 생성하지 못했어요. 잠시 후 다시 시도하거나 Gemini에서 바로 이어서 풀어보세요!",
      },
      { status: 502 }
    );
  }
}
