import { NextResponse } from "next/server";
import { validateEntry, hasErrors, normalizePhone } from "@/lib/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Apps Script URL 을 클라이언트에 노출하면 누구나 개인정보 시트에 쓰기가 가능해진다.
// 그래서 이 핸들러를 반드시 거치게 하고, 공유 비밀키는 서버에만 둔다.
const WEBHOOK = process.env.ENTRY_WEBHOOK_URL;
const SECRET = process.env.ENTRY_SHARED_SECRET;

// ponytail: 인스턴스 로컬 카운터라 서버리스에서는 완벽하지 않다.
// 실제 스팸이 관측되면 Upstash 같은 공유 저장소로 교체할 것.
const HITS = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (HITS.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  HITS.set(ip, recent);
  if (HITS.size > 5000) HITS.clear(); // 메모리 누수 방지
  return recent.length > MAX_PER_WINDOW;
}

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const b = (body ?? {}) as Record<string, unknown>;
  const name = typeof b.name === "string" ? b.name.trim() : "";
  const phone = typeof b.phone === "string" ? b.phone : "";
  const consent = b.consent === true;

  // 클라이언트 검증은 UX용일 뿐이므로 서버에서 다시 검사한다.
  const errs = validateEntry({ name, phone, consent });
  if (hasErrors(errs)) {
    return NextResponse.json(
      { error: errs.name || errs.phone || errs.consent },
      { status: 400 }
    );
  }

  if (!WEBHOOK || !SECRET) {
    console.error("[entry] ENTRY_WEBHOOK_URL / ENTRY_SHARED_SECRET 미설정");
    return NextResponse.json(
      { error: "응모 접수가 아직 준비되지 않았습니다. 운영진에게 알려주세요." },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: SECRET,
        name,
        phone: normalizePhone(phone),
        // 추첨 전 이상치 확인용. 개인 식별과 무관한 학습 기록.
        progress: b.progress ?? null,
        submittedAt: new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      // 개인정보가 로그에 남지 않도록 상태 코드만 기록한다.
      console.error("[entry] webhook status", res.status);
      return NextResponse.json(
        { error: "접수 서버에 문제가 있습니다. 잠시 후 다시 시도해 주세요." },
        { status: 502 }
      );
    }

    const out = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      duplicate?: boolean;
    };
    if (out.duplicate) {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    return NextResponse.json({ ok: true });
  } catch {
    console.error("[entry] webhook 호출 실패");
    return NextResponse.json(
      { error: "접수에 실패했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 502 }
    );
  }
}
