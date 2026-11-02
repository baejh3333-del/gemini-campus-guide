import type { LibraryPrompt } from "@/lib/prompt-library";

export function LibraryVisual({ prompt }: { prompt: LibraryPrompt }) {
  const { variant, src, alt } = prompt.thumbnail;
  return (
    <div className={`library-art art-${variant}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt ?? prompt.title} className="library-cover" />
      ) : (
        <VisualMotif variant={variant} />
      )}
      <span className="library-art-badge">
        {prompt.source
          ? `${prompt.source.kind} #${prompt.source.number}`
          : prompt.kind === "gem"
            ? "Gem 템플릿"
            : prompt.kind === "skill"
              ? "Skill · MD"
              : "프롬프트"}
      </span>
      {!src && (
        <span className="library-art-caption" aria-hidden="true">
          {prompt.category}
          <span>↗</span>
        </span>
      )}
    </div>
  );
}

function VisualMotif({ variant }: { variant: LibraryPrompt["thumbnail"]["variant"] }) {
  /* 1. orbit -> 막막한 레포트, 목차부터 (3-Branch Outline Blueprint) */
  if (variant === "orbit") {
    return (
      <div className="art-object art-stage-blueprint" aria-hidden="true">
        <svg viewBox="0 0 320 220" fill="none" className="art-svg">
          <defs>
            <linearGradient id="bp-branch" x1="60" y1="110" x2="220" y2="110" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>
          {/* Blueprint CAD Grid */}
          <g stroke="#ffffff0a" strokeWidth="1">
            <line x1="0" y1="55" x2="320" y2="55" />
            <line x1="0" y1="110" x2="320" y2="110" />
            <line x1="0" y1="165" x2="320" y2="165" />
            <line x1="80" y1="0" x2="80" y2="220" />
            <line x1="160" y1="0" x2="160" y2="220" />
            <line x1="240" y1="0" x2="240" y2="220" />
          </g>
          {/* Branching connectors */}
          <path d="M 88 110 C 128 110, 132 56, 174 56" stroke="url(#bp-branch)" strokeWidth="2" strokeDasharray="4 4" className="mg-dash-flow" />
          <path d="M 88 110 L 174 110" stroke="url(#bp-branch)" strokeWidth="2" />
          <path d="M 88 110 C 128 110, 132 164, 174 164" stroke="url(#bp-branch)" strokeWidth="2" strokeDasharray="4 4" className="mg-dash-flow" />

          {/* Root Topic Node */}
          <g className="mg-float-slow">
            <rect x="26" y="88" width="64" height="44" rx="12" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
            <rect x="36" y="100" width="28" height="5" rx="2.5" fill="#38bdf8" />
            <rect x="36" y="111" width="42" height="4" rx="2" fill="#94a3b8" opacity=".6" />
            <circle cx="88" cy="110" r="4.5" fill="#38bdf8" className="mg-pulse-dot" />
          </g>

          {/* 3 Outline Cards (목차 1안, 2안, 3안) */}
          <g className="mg-card-shift-1">
            <rect x="174" y="36" width="116" height="38" rx="10" fill="#111827cc" stroke="#38bdf866" strokeWidth="1.2" />
            <circle cx="190" cy="55" r="5" fill="#38bdf833" stroke="#38bdf8" strokeWidth="1.2" />
            <rect x="203" y="48" width="52" height="5" rx="2.5" fill="#e2e8f0" />
            <rect x="203" y="58" width="72" height="4" rx="2" fill="#64748b" />
          </g>
          <g className="mg-card-shift-2">
            <rect x="174" y="91" width="116" height="38" rx="10" fill="#1e293b" stroke="#60a5fa" strokeWidth="1.5" />
            <circle cx="190" cy="110" r="5" fill="#60a5fa" />
            <rect x="203" y="103" width="60" height="5" rx="2.5" fill="#ffffff" />
            <rect x="203" y="113" width="68" height="4" rx="2" fill="#93c5fd" />
          </g>
          <g className="mg-card-shift-3">
            <rect x="174" y="146" width="116" height="38" rx="10" fill="#111827cc" stroke="#818cf866" strokeWidth="1.2" />
            <circle cx="190" cy="165" r="5" fill="#818cf833" stroke="#818cf8" strokeWidth="1.2" />
            <rect x="203" y="158" width="48" height="5" rx="2.5" fill="#e2e8f0" />
            <rect x="203" y="168" width="64" height="4" rx="2" fill="#64748b" />
          </g>
        </svg>
      </div>
    );
  }

  /* 2. sphere -> 강의 노트로 예상문제 만들기 (Exam Key-Point Scanner) */
  if (variant === "sphere") {
    return (
      <div className="art-object art-stage-scanner" aria-hidden="true">
        <svg viewBox="0 0 320 220" fill="none" className="art-svg">
          <defs>
            <linearGradient id="scan-beam" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0" />
              <stop offset="50%" stopColor="#2dd4bf" stopOpacity=".28" />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Concentric CAD Target */}
          <circle cx="160" cy="110" r="76" stroke="#2dd4bf1f" strokeWidth="1" strokeDasharray="3 5" />
          <circle cx="160" cy="110" r="52" stroke="#2dd4bf33" strokeWidth="1" />
          <line x1="70" y1="110" x2="250" y2="110" stroke="#2dd4bf1a" strokeWidth="1" />
          <line x1="160" y1="24" x2="160" y2="196" stroke="#2dd4bf1a" strokeWidth="1" />

          {/* Lecture Note Sheet */}
          <rect x="92" y="46" width="136" height="128" rx="14" fill="#0b131e" stroke="#2dd4bf55" strokeWidth="1.4" />
          {/* Question Checklist Rows */}
          <g className="mg-check-row-1">
            <rect x="108" y="66" width="16" height="16" rx="5" fill="#14b8a626" stroke="#2dd4bf" strokeWidth="1.4" />
            <path d="m112.5 74 3 3 5-6" stroke="#5eead4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="132" y="69" width="64" height="5" rx="2.5" fill="#f1f5f9" />
            <rect x="132" y="78" width="42" height="3.5" rx="1.75" fill="#2dd4bf" opacity=".75" />
          </g>
          <g className="mg-check-row-2">
            <rect x="108" y="98" width="16" height="16" rx="5" fill="#14b8a626" stroke="#2dd4bf" strokeWidth="1.4" />
            <path d="m112.5 106 3 3 5-6" stroke="#5eead4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="132" y="101" width="76" height="5" rx="2.5" fill="#f1f5f9" />
            <rect x="132" y="110" width="50" height="3.5" rx="1.75" fill="#64748b" />
          </g>
          <g className="mg-check-row-3">
            <rect x="108" y="130" width="16" height="16" rx="5" fill="#0f172a" stroke="#38bdf866" strokeWidth="1.3" />
            <circle cx="116" cy="138" r="3" fill="#38bdf8" />
            <rect x="132" y="133" width="56" height="5" rx="2.5" fill="#cbd5e1" />
            <rect x="132" y="142" width="38" height="3.5" rx="1.75" fill="#64748b" />
          </g>

          {/* Scanning Laser Bar */}
          <g className="mg-laser-scan">
            <rect x="82" y="88" width="156" height="24" fill="url(#scan-beam)" />
            <line x1="82" y1="100" x2="238" y2="100" stroke="#5eead4" strokeWidth="1.8" />
            <circle cx="82" cy="100" r="3" fill="#5eead4" />
            <circle cx="238" cy="100" r="3" fill="#5eead4" />
          </g>
        </svg>
      </div>
    );
  }

  /* 3. wave -> 10분 발표의 흐름 잡기 (Isometric Slide Deck & Pacing Timeline) */
  if (variant === "wave") {
    return (
      <div className="art-object art-stage-slides" aria-hidden="true">
        <svg viewBox="0 0 320 220" fill="none" className="art-svg">
          {/* Back Slide 01 */}
          <g className="mg-slide-back">
            <rect x="46" y="42" width="124" height="82" rx="12" fill="#0f172a" stroke="#6366f155" strokeWidth="1.2" />
            <rect x="60" y="56" width="32" height="4" rx="2" fill="#818cf8" />
            <rect x="60" y="66" width="76" height="6" rx="3" fill="#475569" />
          </g>
          {/* Middle Slide 02 */}
          <g className="mg-slide-mid">
            <rect x="96" y="58" width="128" height="84" rx="12" fill="#131c31" stroke="#38bdf877" strokeWidth="1.3" />
            <rect x="112" y="72" width="36" height="4" rx="2" fill="#38bdf8" />
            <rect x="112" y="82" width="84" height="6" rx="3" fill="#94a3b8" />
            <rect x="112" y="94" width="58" height="5" rx="2.5" fill="#475569" />
          </g>
          {/* Front Active Slide 03 */}
          <g className="mg-slide-front">
            <rect x="142" y="76" width="134" height="88" rx="14" fill="#172554" stroke="#60a5fa" strokeWidth="1.6" />
            <rect x="158" y="92" width="24" height="14" rx="4" fill="#3b82f633" stroke="#60a5fa" strokeWidth="1" />
            <rect x="190" y="95" width="68" height="6" rx="3" fill="#ffffff" />
            <rect x="158" y="116" width="98" height="5" rx="2.5" fill="#93c5fd" />
            <rect x="158" y="127" width="74" height="5" rx="2.5" fill="#60a5fa88" />
            {/* Mini chart bar inside slide */}
            <rect x="236" y="138" width="6" height="14" rx="2" fill="#38bdf8" />
            <rect x="246" y="132" width="6" height="20" rx="2" fill="#60a5fa" />
            <rect x="256" y="124" width="6" height="28" rx="2" fill="#93c5fd" />
          </g>
          {/* 10-Min Pacing Progress Track */}
          <line x1="48" y1="184" x2="272" y2="184" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
          <line x1="48" y1="184" x2="210" y2="184" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" className="mg-progress-bar" />
          <circle cx="210" cy="184" r="6" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2.5" className="mg-progress-knob" />
        </svg>
      </div>
    );
  }

  /* 4. pills -> 조별과제, 역할부터 일정까지 (Gantt Sprint Timeline & Role Nodes) */
  if (variant === "pills") {
    return (
      <div className="art-object art-stage-gantt" aria-hidden="true">
        <svg viewBox="0 0 320 220" fill="none" className="art-svg">
          {/* Vertical Week Columns */}
          <g stroke="#ffffff0d" strokeWidth="1" strokeDasharray="3 3">
            <line x1="76" y1="32" x2="76" y2="188" />
            <line x1="136" y1="32" x2="136" y2="188" />
            <line x1="196" y1="32" x2="196" y2="188" />
            <line x1="256" y1="32" x2="256" y2="188" />
          </g>

          {/* Row 1: Member A */}
          <g className="mg-gantt-1">
            <circle cx="48" cy="60" r="10" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="48" cy="60" r="3.5" fill="#38bdf8" />
            <rect x="76" y="50" width="96" height="20" rx="10" fill="#0284c733" stroke="#38bdf8" strokeWidth="1.4" />
            <rect x="88" y="58" width="52" height="4" rx="2" fill="#e0f2fe" />
          </g>

          {/* Row 2: Member B */}
          <g className="mg-gantt-2">
            <circle cx="48" cy="96" r="10" fill="#1e293b" stroke="#818cf8" strokeWidth="1.5" />
            <circle cx="48" cy="96" r="3.5" fill="#818cf8" />
            <rect x="116" y="86" width="110" height="20" rx="10" fill="#4f46e533" stroke="#818cf8" strokeWidth="1.4" />
            <rect x="128" y="94" width="64" height="4" rx="2" fill="#e0e7ff" />
          </g>

          {/* Row 3: Member C */}
          <g className="mg-gantt-3">
            <circle cx="48" cy="132" r="10" fill="#1e293b" stroke="#2dd4bf" strokeWidth="1.5" />
            <circle cx="48" cy="132" r="3.5" fill="#2dd4bf" />
            <rect x="148" y="122" width="92" height="20" rx="10" fill="#0d948833" stroke="#2dd4bf" strokeWidth="1.4" />
            <rect x="160" y="130" width="48" height="4" rx="2" fill="#ccfbf1" />
          </g>

          {/* Row 4: Final Milestone */}
          <g className="mg-gantt-4">
            <circle cx="48" cy="168" r="10" fill="#1e293b" stroke="#f472b6" strokeWidth="1.5" />
            <circle cx="48" cy="168" r="3.5" fill="#f472b6" />
            <rect x="206" y="158" width="68" height="20" rx="10" fill="#db277733" stroke="#f472b6" strokeWidth="1.4" />
            <rect x="218" y="166" width="38" height="4" rx="2" fill="#fce7f3" />
          </g>

          {/* Moving Milestone Playhead */}
          <g className="mg-playhead">
            <line x1="182" y1="30" x2="182" y2="190" stroke="#f8fafc" strokeWidth="1.5" />
            <polygon points="177,30 187,30 182,37" fill="#38bdf8" />
          </g>
        </svg>
      </div>
    );
  }

  /* 5. curves -> 내 경험이 드러나는 자기소개서 (Experience-to-Role Synthesis Lens) */
  if (variant === "curves") {
    return (
      <div className="art-object art-stage-bridge" aria-hidden="true">
        <svg viewBox="0 0 320 220" fill="none" className="art-svg">
          <defs>
            <linearGradient id="bridge-grad" x1="48" y1="110" x2="272" y2="110" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="50%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#2dd4bf" />
            </linearGradient>
          </defs>
          {/* Experience Threads */}
          <path d="M 64 56 C 112 56, 124 110, 160 110 C 196 110, 208 82, 252 82" stroke="url(#bridge-grad)" strokeWidth="1.8" opacity=".85" />
          <path d="M 64 110 L 252 110" stroke="url(#bridge-grad)" strokeWidth="2.2" />
          <path d="M 64 164 C 112 164, 124 110, 160 110 C 196 110, 208 138, 252 138" stroke="url(#bridge-grad)" strokeWidth="1.8" opacity=".85" />

          {/* Left Experience Chips */}
          <g className="mg-exp-nodes">
            <rect x="26" y="44" width="44" height="24" rx="12" fill="#0f172a" stroke="#60a5fa" strokeWidth="1.4" />
            <circle cx="48" cy="56" r="4" fill="#60a5fa" />
            <rect x="26" y="98" width="44" height="24" rx="12" fill="#0f172a" stroke="#a78bfa" strokeWidth="1.4" />
            <circle cx="48" cy="110" r="4" fill="#a78bfa" />
            <rect x="26" y="152" width="44" height="24" rx="12" fill="#0f172a" stroke="#2dd4bf" strokeWidth="1.4" />
            <circle cx="48" cy="164" r="4" fill="#2dd4bf" />
          </g>

          {/* Central Synthesis Prism Lens */}
          <g className="mg-prism-lens">
            <rect x="142" y="74" width="36" height="72" rx="18" fill="#1e1b4b99" stroke="#c4b5fd" strokeWidth="1.6" />
            <circle cx="160" cy="110" r="7" fill="#ede9fe" />
          </g>

          {/* Right Target Fit Card */}
          <g className="mg-float-slow">
            <rect x="236" y="66" width="58" height="88" rx="12" fill="#0f172a" stroke="#2dd4bf" strokeWidth="1.5" />
            <circle cx="265" cy="92" r="10" fill="#14b8a626" stroke="#2dd4bf" strokeWidth="1.4" />
            <path d="m261 92 3 3 5-5" stroke="#5eead4" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="248" y="114" width="34" height="5" rx="2.5" fill="#f1f5f9" />
            <rect x="248" y="124" width="24" height="4" rx="2" fill="#5eead4" />
            <rect x="248" y="134" width="30" height="4" rx="2" fill="#64748b" />
          </g>
        </svg>
      </div>
    );
  }

  /* 6. agent -> 레포트 첨삭 조교 Gem (Rubric Scorecard & Redline Inspector) */
  if (variant === "agent") {
    return (
      <div className="art-object art-stage-rubric" aria-hidden="true">
        <svg viewBox="0 0 320 220" fill="none" className="art-svg">
          {/* Main Rubric Glass Card */}
          <g className="mg-float-slow">
            <rect x="54" y="38" width="176" height="144" rx="16" fill="#0d1526" stroke="#38bdf866" strokeWidth="1.5" />
            {/* Header */}
            <circle cx="76" cy="60" r="5" fill="#38bdf8" />
            <rect x="88" y="57" width="64" height="6" rx="3" fill="#f8fafc" />
            <rect x="184" y="54" width="28" height="12" rx="6" fill="#0284c733" stroke="#38bdf8" strokeWidth="1" />

            {/* 4 Criteria Metric Bars (논지 / 근거 / 구조 / 문장) */}
            <rect x="72" y="84" width="28" height="5" rx="2.5" fill="#94a3b8" />
            <rect x="108" y="83" width="102" height="7" rx="3.5" fill="#1e293b" />
            <rect x="108" y="83" width="88" height="7" rx="3.5" fill="#38bdf8" className="mg-bar-fill-1" />

            <rect x="72" y="106" width="28" height="5" rx="2.5" fill="#94a3b8" />
            <rect x="108" y="105" width="102" height="7" rx="3.5" fill="#1e293b" />
            <rect x="108" y="105" width="64" height="7" rx="3.5" fill="#f472b6" className="mg-bar-fill-2" />

            <rect x="72" y="128" width="28" height="5" rx="2.5" fill="#94a3b8" />
            <rect x="108" y="127" width="102" height="7" rx="3.5" fill="#1e293b" />
            <rect x="108" y="127" width="94" height="7" rx="3.5" fill="#818cf8" className="mg-bar-fill-3" />

            <rect x="72" y="150" width="28" height="5" rx="2.5" fill="#94a3b8" />
            <rect x="108" y="149" width="102" height="7" rx="3.5" fill="#1e293b" />
            <rect x="108" y="149" width="80" height="7" rx="3.5" fill="#2dd4bf" className="mg-bar-fill-4" />
          </g>

          {/* Floating Callout Badge */}
          <g className="mg-badge-float">
            <rect x="182" y="92" width="96" height="42" rx="12" fill="#1e1b4b" stroke="#f472b6" strokeWidth="1.5" />
            <circle cx="200" cy="113" r="6" fill="#f472b633" stroke="#f472b6" strokeWidth="1.4" />
            <rect x="214" y="107" width="48" height="5" rx="2.5" fill="#fce7f3" />
            <rect x="214" y="116" width="34" height="4" rx="2" fill="#f472b6" />
          </g>
        </svg>
      </div>
    );
  }

  /* 7. axis -> 개념 설명 조교 Gem (3-Level Depth Knowledge Stack) */
  if (variant === "axis") {
    return (
      <div className="art-object art-stage-stack" aria-hidden="true">
        <svg viewBox="0 0 320 220" fill="none" className="art-svg">
          {/* Central Knowledge Axis Line */}
          <line x1="160" y1="26" x2="160" y2="194" stroke="#38bdf844" strokeWidth="2" strokeDasharray="3 3" />

          {/* Level 3 (Bottom): 서술형 답안 완성 */}
          <g className="mg-tier-3">
            <polygon points="160,126 254,158 160,190 66,158" fill="#0f172acc" stroke="#2dd4bf" strokeWidth="1.5" />
            <circle cx="160" cy="158" r="4.5" fill="#2dd4bf" />
          </g>

          {/* Level 2 (Middle): 교과서 핵심 정의 */}
          <g className="mg-tier-2">
            <polygon points="160,82 238,110 160,138 82,110" fill="#1e293bcc" stroke="#818cf8" strokeWidth="1.5" />
            <circle cx="160" cy="110" r="4.5" fill="#818cf8" />
          </g>

          {/* Level 1 (Top): 직관적 3줄 비유 */}
          <g className="mg-tier-1">
            <polygon points="160,38 220,62 160,86 100,62" fill="#172554e6" stroke="#38bdf8" strokeWidth="1.6" />
            <circle cx="160" cy="62" r="5" fill="#e0f2fe" />
          </g>
        </svg>
      </div>
    );
  }

  /* 8. portal -> 발표 리허설 파트너 Gem (Live Q&A Acoustic Spectrum) */
  return (
    <div className="art-object art-stage-acoustic" aria-hidden="true">
      <svg viewBox="0 0 320 220" fill="none" className="art-svg">
        {/* Background Dialogue Ring */}
        <rect x="44" y="48" width="232" height="124" rx="24" fill="#0b1120" stroke="#38bdf833" strokeWidth="1.2" />

        {/* Left Q Badge */}
        <g className="mg-float-slow">
          <rect x="62" y="64" width="46" height="26" rx="13" fill="#1e1b4b" stroke="#818cf8" strokeWidth="1.4" />
          <circle cx="76" cy="77" r="4" fill="#818cf8" />
          <rect x="85" y="75" width="14" height="4" rx="2" fill="#e0e7ff" />
        </g>

        {/* Right Feedback Badge */}
        <g className="mg-badge-float">
          <rect x="212" y="130" width="46" height="26" rx="13" fill="#064e3b" stroke="#34d399" strokeWidth="1.4" />
          <circle cx="226" cy="143" r="4" fill="#34d399" />
          <rect x="235" y="141" width="14" height="4" rx="2" fill="#d1fae5" />
        </g>

        {/* Dynamic Equalizer Bars */}
        <g className="mg-eq-bars" strokeLinecap="round">
          <line x1="96" y1="96" x2="96" y2="124" stroke="#60a5fa" strokeWidth="5" className="eq-bar-1" />
          <line x1="112" y1="82" x2="112" y2="138" stroke="#38bdf8" strokeWidth="5" className="eq-bar-2" />
          <line x1="128" y1="70" x2="128" y2="150" stroke="#818cf8" strokeWidth="5" className="eq-bar-3" />
          <line x1="144" y1="88" x2="144" y2="132" stroke="#a78bfa" strokeWidth="5" className="eq-bar-4" />
          <line x1="160" y1="64" x2="160" y2="156" stroke="#e0f2fe" strokeWidth="5" className="eq-bar-5" />
          <line x1="176" y1="84" x2="176" y2="136" stroke="#2dd4bf" strokeWidth="5" className="eq-bar-2" />
          <line x1="192" y1="74" x2="192" y2="146" stroke="#34d399" strokeWidth="5" className="eq-bar-3" />
          <line x1="208" y1="90" x2="208" y2="130" stroke="#38bdf8" strokeWidth="5" className="eq-bar-1" />
          <line x1="224" y1="98" x2="224" y2="122" stroke="#60a5fa" strokeWidth="5" className="eq-bar-4" />
        </g>
      </svg>
    </div>
  );
}
