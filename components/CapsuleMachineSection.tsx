"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FUNNY_CAPSULES,
  type CapsuleItem,
  type CapsuleRarity,
} from "@/content/funny-capsules";

const SIGNUP_URL = process.env.NEXT_PUBLIC_SIGNUP_URL || "https://goo.gle/kangwonchuncheon";

const CAPSULE_ORBS = [
  { id: 1, a: "#38bdf8", b: "#818cf8" },
  { id: 2, a: "#f472b6", b: "#a78bfa" },
  { id: 3, a: "#2dd4bf", b: "#38bdf8" },
  { id: 4, a: "#fbbf24", b: "#f472b6" },
  { id: 5, a: "#818cf8", b: "#2dd4bf" },
  { id: 6, a: "#38bdf8", b: "#f472b6" },
  { id: 7, a: "#a78bfa", b: "#38bdf8" },
  { id: 8, a: "#2dd4bf", b: "#818cf8" },
  { id: 9, a: "#f472b6", b: "#38bdf8" },
  { id: 10, a: "#34d399", b: "#a78bfa" },
];

type PhysBody = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  angle: number;
  omega: number;
};

const DOME_RADIUS = 132;
const WALL_RADIUS = 124;
const ORB_RADIUS = 21;

function extractVars(body: string): string[] {
  const matches = body.match(/\[([^\][\n]{1,55})\]/g) ?? [];
  const cleaned = matches
    .map((m) => m.slice(1, -1).trim())
    .filter((m) => m !== "작성 조건");
  return Array.from(new Set(cleaned));
}

export function CapsuleMachineSection() {
  const [filterRarity, setFilterRarity] = useState<"ALL" | CapsuleRarity>("ALL");
  const [machineState, setMachineState] = useState<"idle" | "mixing" | "dropping" | "opened">("idle");
  const [currentCapsule, setCurrentCapsule] = useState<CapsuleItem | null>(null);
  const [history, setHistory] = useState<CapsuleItem[]>([]);
  const [varValues, setVarValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  const domeRef = useRef<HTMLDivElement>(null);
  const orbRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const bodiesRef = useRef<PhysBody[]>([]);
  const pointerRef = useRef<{ x: number; y: number; vx: number; vy: number; active: boolean }>({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    active: false,
  });
  const mixingRef = useRef(false);

  useEffect(() => {
    mixingRef.current = machineState === "mixing";
  }, [machineState]);

  // Real-time 2D Rigid-Body Physics Engine inside the circular glass dome
  useEffect(() => {
    // Initialize 10 heavy capsule bodies settled in the lower bowl of the dome
    bodiesRef.current = CAPSULE_ORBS.map((_, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      return {
        x: 78 + col * 36 + (row % 2) * 14,
        y: 120 + row * 34,
        vx: (Math.random() - 0.5) * 1.5,
        vy: 0,
        r: ORB_RADIUS,
        angle: (Math.random() - 0.5) * 45,
        omega: 0,
      };
    });

    let rafId = 0;
    let tick = 0;
    const SUBSTEPS = 4;
    const GRAVITY = 0.9; // 30% lighter than 1.28 (1.28 * 0.7 = 0.896)

    const stepPhysics = () => {
      const bodies = bodiesRef.current;
      const isMixing = mixingRef.current;
      const ptr = pointerRef.current;
      tick++;

      for (let s = 0; s < SUBSTEPS; s++) {
        const dt = 1 / SUBSTEPS;

        for (let i = 0; i < bodies.length; i++) {
          const b = bodies[i];

          // Balanced downward gravity (30% reduced from heavy mode)
          b.vy += GRAVITY * dt;

          // Lively rotor & swirl when cranking the handle
          if (isMixing) {
            if (b.y > DOME_RADIUS + 4) {
              const paddleDir = Math.sin(tick * 0.22 + i) > 0 ? 1 : -1;
              b.vx += (paddleDir * 3.2 + (Math.random() - 0.5) * 2.2) * dt;
              b.vy -= (2.35 + Math.random() * 1.5) * dt;
              b.omega += paddleDir * 2.5 * dt;
            }
          }

          // Interactive mouse/touch pushing (feels heavy to push)
          if (ptr.active) {
            const dx = b.x - ptr.x;
            const dy = b.y - ptr.y;
            const distSq = dx * dx + dy * dy;
            const minDist = b.r + 24;
            if (distSq < minDist * minDist && distSq > 0.01) {
              const dist = Math.sqrt(distSq);
              const nx = dx / dist;
              const ny = dy / dist;
              const overlap = minDist - dist;
              b.x += nx * overlap * 0.65;
              b.y += ny * overlap * 0.65;
              b.vx += (nx * 0.9 + ptr.vx * 0.16) * dt;
              b.vy += (ny * 0.9 + ptr.vy * 0.16) * dt;
              b.omega += (nx * ptr.vy - ny * ptr.vx) * 0.08 * dt;
            }
          }

          // Heavy damping & rotational resistance so capsules settle with a solid thud
          b.vx *= Math.pow(0.965, dt);
          b.vy *= Math.pow(0.972, dt);
          b.omega *= Math.pow(0.88, dt);

          // Micro-jitter sleep threshold when resting at the bottom
          if (!isMixing && !ptr.active && Math.hypot(b.vx, b.vy) < 0.08) {
            b.vx = 0;
            b.vy = 0;
            b.omega *= 0.7;
          }

          // Integrate position and rotation
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.angle += b.omega * dt;

          // Circular Glass Dome Boundary Collision (low bounce like heavy acrylic balls)
          const dx = b.x - DOME_RADIUS;
          const dy = b.y - DOME_RADIUS;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxR = WALL_RADIUS - b.r;

          if (dist > maxR && dist > 0.001) {
            const nx = dx / dist;
            const ny = dy / dist;
            b.x = DOME_RADIUS + nx * maxR;
            b.y = DOME_RADIUS + ny * maxR;

            const vn = b.vx * nx + b.vy * ny;
            if (vn > 0) {
              const restitution = isMixing ? 0.48 : 0.28;
              b.vx -= (1 + restitution) * vn * nx;
              b.vy -= (1 + restitution) * vn * ny;

              // Rolling friction along the glass wall
              const tx = -ny;
              const ty = nx;
              const vt = b.vx * tx + b.vy * ty;
              b.vx -= vt * 0.1 * tx;
              b.vy -= vt * 0.1 * ty;
              b.omega += vt * 0.18;
            }
          }
        }

        // Capsule-to-Capsule Collisions
        for (let i = 0; i < bodies.length; i++) {
          for (let j = i + 1; j < bodies.length; j++) {
            const a = bodies[i];
            const b = bodies[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const minDist = a.r + b.r;
            const distSq = dx * dx + dy * dy;

            if (distSq < minDist * minDist && distSq > 0.0001) {
              const dist = Math.sqrt(distSq);
              const nx = dx / dist;
              const ny = dy / dist;
              const overlap = minDist - dist;

              // Stiff positional separation so heavy balls don't sink into each other
              a.x -= nx * overlap * 0.52;
              a.y -= ny * overlap * 0.52;
              b.x += nx * overlap * 0.52;
              b.y += ny * overlap * 0.52;

              const rvx = b.vx - a.vx;
              const rvy = b.vy - a.vy;
              const velAlongNormal = rvx * nx + rvy * ny;

              if (velAlongNormal < 0) {
                const restitution = isMixing ? 0.44 : 0.25;
                const jImpulse = (-(1 + restitution) * velAlongNormal) * 0.5;
                const ix = jImpulse * nx;
                const iy = jImpulse * ny;

                a.vx -= ix;
                a.vy -= iy;
                b.vx += ix;
                b.vy += iy;

                // Contact friction dampens sliding between capsules
                const tx = -ny;
                const ty = nx;
                const vt = rvx * tx + rvy * ty;
                a.vx += vt * 0.08 * tx;
                a.vy += vt * 0.08 * ty;
                b.vx -= vt * 0.08 * tx;
                b.vy -= vt * 0.08 * ty;
                a.omega -= vt * 0.08;
                b.omega += vt * 0.08;
              }
            }
          }
        }
      }

      ptr.vx *= 0.6;
      ptr.vy *= 0.6;

      // Apply 60fps hardware-accelerated transforms to each capsule DOM node
      for (let i = 0; i < bodies.length; i++) {
        const el = orbRefs.current[i];
        if (!el) continue;
        const b = bodies[i];
        el.style.transform = `translate3d(${(b.x - b.r).toFixed(1)}px, ${(b.y - b.r * 1.25).toFixed(1)}px, 0) rotate(${b.angle.toFixed(1)}deg)`;
      }

      rafId = window.requestAnimationFrame(stepPhysics);
    };

    rafId = window.requestAnimationFrame(stepPhysics);
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  function handleDomePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const rect = domeRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * (DOME_RADIUS * 2);
    const y = ((e.clientY - rect.top) / rect.height) * (DOME_RADIUS * 2);
    const prev = pointerRef.current;
    pointerRef.current = {
      x,
      y,
      vx: prev.active ? x - prev.x : 0,
      vy: prev.active ? y - prev.y : 0,
      active: true,
    };
  }

  function handleDomePointerLeave() {
    pointerRef.current.active = false;
  }

  function shakeDome() {
    for (const b of bodiesRef.current) {
      b.vy -= 7.2 + Math.random() * 5.2;
      b.vx += (Math.random() - 0.5) * 9.8;
      b.omega += (Math.random() - 0.5) * 8;
    }
  }

  const pool = useMemo(() => {
    if (filterRarity === "ALL") return FUNNY_CAPSULES;
    return FUNNY_CAPSULES.filter((c) => c.rarity === filterRarity);
  }, [filterRarity]);

  function pullCapsule() {
    if (machineState === "mixing" || machineState === "dropping") return;
    const candidates = pool.length > 0 ? pool : FUNNY_CAPSULES;
    const filtered =
      candidates.length > 1 && currentCapsule
        ? candidates.filter((c) => c.id !== currentCapsule.id)
        : candidates;
    const picked = filtered[Math.floor(Math.random() * filtered.length)];

    setCopied(false);
    setVarValues({});
    setMachineState("mixing");
    shakeDome();

    window.setTimeout(() => {
      setCurrentCapsule(picked);
      setMachineState("dropping");
    }, 1050);

    window.setTimeout(() => {
      setMachineState("opened");
      setHistory((prev) => [picked, ...prev.filter((item) => item.id !== picked.id)].slice(0, 8));
    }, 1680);
  }

  function selectFromHistory(item: CapsuleItem) {
    setCurrentCapsule(item);
    setVarValues({});
    setCopied(false);
    setMachineState("opened");
  }

  const activeVars = useMemo(
    () => (currentCapsule ? extractVars(currentCapsule.body) : []),
    [currentCapsule]
  );

  const resolvedBody = useMemo(() => {
    if (!currentCapsule) return "";
    let text = currentCapsule.body;
    for (const v of activeVars) {
      const val = varValues[v]?.trim();
      if (val) {
        text = text.replaceAll(`[${v}]`, val);
      }
    }
    return text;
  }, [currentCapsule, activeVars, varValues]);

  async function handleCopy() {
    if (!resolvedBody) return;
    try {
      await navigator.clipboard.writeText(resolvedBody);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="capsule-section">
      <div className="capsule-header-bar">
        <div>
          <span className="capsule-eyebrow">RANDOM PROMPT CAPSULE</span>
          <h2>랜덤 프롬프트 캡슐</h2>
          <p>재미있는 프롬프트를 한번 뽑아봐요! 운좋으면 희귀한 프롬프트를 손에 얻게 될수도?!</p>
        </div>
        <div className="capsule-pool-filters" role="group" aria-label="희귀도 등급 선택">
          {(
            [
              { key: "ALL", label: "전체" },
              { key: "SSR", label: "SSR" },
              { key: "SR", label: "SR" },
              { key: "R", label: "R" },
            ] as const
          ).map((r) => (
            <button
              type="button"
              key={r.key}
              aria-pressed={filterRarity === r.key}
              onClick={() => setFilterRarity(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="capsule-stage-grid">
        {/* Left: Neon Glass Gacha Machine */}
        <div className={`gacha-machine-card is-${machineState}`}>
          <div className="gacha-top-cap">
            <span className="gacha-cap-light" />
            <span>RANDOM PROMPT CAPSULE</span>
          </div>

          {/* Transparent Glass Dome with Capsules */}
          <div
            className="gacha-dome"
            ref={domeRef}
            onPointerMove={handleDomePointerMove}
            onPointerLeave={handleDomePointerLeave}
            onClick={shakeDome}
          >
            <div className="gacha-dome-glare" aria-hidden="true" />
            <div className="gacha-orbs-container is-physics" aria-hidden="true">
              {CAPSULE_ORBS.map((orb, idx) => (
                <span
                  key={orb.id}
                  ref={(el) => {
                    orbRefs.current[idx] = el;
                  }}
                  className="gacha-orb is-phys-orb"
                  style={
                    {
                      "--orb-a": orb.a,
                      "--orb-b": orb.b,
                    } as React.CSSProperties
                  }
                >
                  <i className="orb-half-top" />
                  <i className="orb-band" />
                  <i className="orb-half-bot" />
                </span>
              ))}
            </div>
          </div>

          {/* Dispenser Neck + Rotary Handle + Exit Chute */}
          <div className="gacha-base">
            <div className="gacha-dial-row">
              <div className="gacha-dial-plate">
                <button
                  type="button"
                  className="gacha-wheel-btn"
                  onClick={pullCapsule}
                  disabled={machineState === "mixing" || machineState === "dropping"}
                  aria-label="레버 돌려 캡슐 뽑기"
                >
                  <span className="wheel-bar" />
                  <span className="wheel-center" />
                </button>
              </div>
              <div className="gacha-action-wrap">
                <button
                  type="button"
                  className="gacha-pull-cta"
                  onClick={pullCapsule}
                  disabled={machineState === "mixing" || machineState === "dropping"}
                >
                  {machineState === "mixing"
                    ? "캡슐 섞는 중..."
                    : machineState === "dropping"
                      ? "캡슐 배출 중!"
                      : currentCapsule
                        ? "다른 프롬프트 뽑기 ↻"
                        : "프롬프트 캡슐 뽑기 ↻"}
                </button>
                <span className="gacha-pool-count">
                  SSR · SR · R 희귀도 프롬프트 {pool.length}종 대기 중
                </span>
              </div>
            </div>

            {/* Exit Chute & Dropping/Splitting Capsule Animation */}
            <div className="gacha-chute">
              <div className="chute-door" />
              {currentCapsule && (machineState === "dropping" || machineState === "opened") && (
                <div
                  className={`dropped-capsule ${machineState === "opened" ? "is-split" : "is-falling"}`}
                  style={
                    {
                      "--cap-a": currentCapsule.colorA,
                      "--cap-b": currentCapsule.colorB,
                    } as React.CSSProperties
                  }
                >
                  <span className="cap-shell cap-shell-left" />
                  <span className="cap-core-spark" />
                  <span className="cap-shell cap-shell-right" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Opened Capsule Result Panel */}
        <div className="capsule-result-panel">
          {machineState === "opened" && currentCapsule ? (
            <div className="capsule-reveal-card" key={currentCapsule.id}>
              <div className="capsule-reveal-top">
                <div className="capsule-badges">
                  <span className={`rarity-pill rarity-${currentCapsule.rarity.toLowerCase()}`}>
                    {currentCapsule.rarityLabel}
                  </span>
                </div>
              </div>

              <h3>{currentCapsule.title}</h3>
              <p className="capsule-desc">{currentCapsule.description}</p>

              {activeVars.length > 0 && (
                <div className="capsule-vars-box">
                  <span className="capsule-vars-title">
                    내 상황 넣어서 바로 돌리기 <span>(비워두면 예시 상황 그대로 복사됩니다)</span>
                  </span>
                  <div className="capsule-vars-grid">
                    {activeVars.map((v) => {
                      const shortLabel = v.includes(":") ? v.split(":")[0].trim() : v;
                      const exampleHint = v.includes(":") ? v.split(":")[1].trim() : `${v} 입력`;
                      return (
                        <label key={v} className="capsule-var-field">
                          <span>[{shortLabel}]</span>
                          <input
                            type="text"
                            placeholder={exampleHint}
                            value={varValues[v] ?? ""}
                            onChange={(e) =>
                              setVarValues((prev) => ({ ...prev, [v]: e.target.value }))
                            }
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="capsule-prompt-preview">
                <pre>{resolvedBody}</pre>
              </div>

              <div className="library-primary-cta capsule-cta-row">
                <button
                  type="button"
                  className={`capsule-copy-btn ${copied ? "is-done" : ""}`}
                  onClick={handleCopy}
                >
                  {copied ? "복사 완료! Gemini에 붙여넣으세요 ✓" : "프롬프트 복사하기 ⧉"}
                </button>
                <a
                  href={`https://gemini.google.com/app?q=${encodeURIComponent(resolvedBody)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`open-gemini-btn ${copied ? "is-ready" : ""}`}
                  onClick={handleCopy}
                >
                  자동 복사 후 Gemini 열기 ↗
                </a>
              </div>

              <a
                href={SIGNUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="library-student-subscribe"
              >
                대학생 Google AI Pro 1년 무료 혜택 받기 <span>→</span>
              </a>
            </div>
          ) : (
            <div className="capsule-standby-card">
              <div className="standby-capsule-graphic" aria-hidden="true">
                <span className="standby-shell-l" />
                <span className="standby-ring" />
                <span className="standby-shell-r" />
              </div>
              <h3>
                {machineState === "mixing"
                  ? "캡슐을 섞고 있어요..."
                  : machineState === "dropping"
                    ? "캡슐이 열리고 있어요!"
                    : "레버를 돌려 인터넷 유행 프롬프트를 뽑아보세요!"}
              </h3>
              <p>
                스레드·X·Reddit·틱톡을 달군 <strong>세상에서 제일 하찮은 그림판 프롬프트</strong>,{" "}
                <strong>나무위키 문서 생성기</strong>,{" "}
                <strong>과거 대화 기반 팩폭(Roast Me)</strong>,{" "}
                <strong>나만의 액션 피규어 패키지</strong>,{" "}
                <strong>세종대왕 맥북프로 던짐 사건 실록</strong> 등 국내외 실제 인기 바이럴 프롬프트{" "}
                <strong>{FUNNY_CAPSULES.length}종</strong>이 들어 있습니다.
              </p>
              <button
                type="button"
                className="standby-pull-btn"
                onClick={pullCapsule}
                disabled={machineState === "mixing" || machineState === "dropping"}
              >
                프롬프트 캡슐 뽑기 ↻
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Pulled Capsule History Tray */}
      {history.length > 0 && (
        <div className="capsule-history-tray">
          <div className="capsule-history-head">
            <h4>내가 뽑은 예능 캡슐 보관함</h4>
            <span>클릭하면 다시 열립니다 ({history.length}개)</span>
          </div>
          <div className="capsule-history-list">
            {history.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`history-capsule-chip ${currentCapsule?.id === item.id ? "is-selected" : ""}`}
                onClick={() => selectFromHistory(item)}
              >
                <span
                  className="mini-cap-dot"
                  style={
                    {
                      background: `linear-gradient(135deg, ${item.colorA}, ${item.colorB})`,
                    } as React.CSSProperties
                  }
                />
                <span className={`mini-rarity rarity-${item.rarity.toLowerCase()}`}>
                  {item.rarity}
                </span>
                <span className="mini-title">{item.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
