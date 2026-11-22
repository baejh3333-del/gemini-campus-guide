import {
  type DiagnosisResult,
  formatDurationKorean,
} from "@/content/toeic-diagnosis";

export type ShareCardFormat = "square" | "story";

interface PartStat {
  part: string;
  correct: number;
  total: number;
}

const FALLBACK_FONT_STACK =
  '"Pretendard", -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif';

function resolveFontStack(): string {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return FALLBACK_FONT_STACK;
  }
  const bodyFont = window.getComputedStyle(document.body).fontFamily;
  return bodyFont ? `${bodyFont}, ${FALLBACK_FONT_STACK}` : FALLBACK_FONT_STACK;
}

function makeFont(weight: number, size: number, family: string): string {
  return `${weight} ${size}px ${family}`;
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function fillAndStrokeRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string | CanvasGradient,
  stroke?: string,
  lineWidth = 1.5
): void {
  roundRectPath(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

/**
 * Character-aware Korean word wrapper:
 * Prefers breaking on spaces, and falls back to grapheme/code-point breaks
 * when a single token exceeds `maxWidth` so Korean text never overflows.
 */
function wrapKoreanText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const paragraphs = text.split(/\r?\n/);
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) {
      lines.push("");
      continue;
    }

    const words = trimmed.split(/\s+/);
    let currentLine = "";

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth) {
        currentLine = candidate;
        continue;
      }

      if (currentLine) {
        lines.push(currentLine);
        currentLine = "";
      }

      if (ctx.measureText(word).width <= maxWidth) {
        currentLine = word;
      } else {
        let chunk = "";
        for (const ch of Array.from(word)) {
          const nextChunk = chunk + ch;
          if (chunk && ctx.measureText(nextChunk).width > maxWidth) {
            lines.push(chunk);
            chunk = ch;
          } else {
            chunk = nextChunk;
          }
        }
        currentLine = chunk;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}

function computePartStats(d: DiagnosisResult): PartStat[] {
  const parts = ["Part 5", "Part 6", "Part 7"];
  return parts.map((part) => {
    const items = d.details.filter((item) => item.question.part === part);
    const correct = items.filter((item) => item.isCorrect).length;
    return { part, correct, total: items.length };
  });
}

function getAccuracyAccent(correct: number, total: number): string {
  if (total === 0) return "#94a3b8";
  const ratio = correct / total;
  if (ratio >= 0.8) return "#34d399";
  if (ratio >= 0.5) return "#8ab4f8";
  return "#fbbf24";
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number
): void {
  // Base vertical editorial dark gradient
  const baseGrad = ctx.createLinearGradient(0, 0, w * 0.35, h);
  baseGrad.addColorStop(0, "#07090f");
  baseGrad.addColorStop(0.52, "#0b1120");
  baseGrad.addColorStop(1, "#0d1322");
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, w, h);

  // Subtle blue aura glow (top-left)
  const blueAura = ctx.createRadialGradient(
    w * 0.18,
    h * 0.14,
    20,
    w * 0.18,
    h * 0.14,
    w * 0.68
  );
  blueAura.addColorStop(0, "rgba(66, 133, 244, 0.24)");
  blueAura.addColorStop(0.5, "rgba(66, 133, 244, 0.08)");
  blueAura.addColorStop(1, "rgba(66, 133, 244, 0)");
  ctx.fillStyle = blueAura;
  ctx.fillRect(0, 0, w, h);

  // Subtle violet aura glow (bottom-right)
  const violetAura = ctx.createRadialGradient(
    w * 0.86,
    h * 0.78,
    20,
    w * 0.86,
    h * 0.78,
    w * 0.65
  );
  violetAura.addColorStop(0, "rgba(167, 139, 250, 0.22)");
  violetAura.addColorStop(0.5, "rgba(167, 139, 250, 0.07)");
  violetAura.addColorStop(1, "rgba(167, 139, 250, 0)");
  ctx.fillStyle = violetAura;
  ctx.fillRect(0, 0, w, h);

  // Subtle warm amber rim behind roast area
  const amberAura = ctx.createRadialGradient(
    w * 0.5,
    h * 0.78,
    10,
    w * 0.5,
    h * 0.78,
    w * 0.48
  );
  amberAura.addColorStop(0, "rgba(251, 191, 36, 0.08)");
  amberAura.addColorStop(1, "rgba(251, 191, 36, 0)");
  ctx.fillStyle = amberAura;
  ctx.fillRect(0, 0, w, h);

  // Subtle editorial dot grid
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.035)";
  const step = 48;
  for (let gx = step; gx < w; gx += step) {
    for (let gy = step; gy < h; gy += step) {
      ctx.beginPath();
      ctx.arc(gx, gy, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // Outer crisp hairline frame
  const inset = 26;
  roundRectPath(ctx, inset, inset, w - inset * 2, h - inset * 2, 36);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawTopPill(
  ctx: CanvasRenderingContext2D,
  w: number,
  y: number,
  height: number,
  fontSize: number,
  fontFamily: string
): void {
  const label = "AI 프롬프트 저장소 · 토익 10문제 정밀 진단";
  ctx.font = makeFont(600, fontSize, fontFamily);
  const textWidth = ctx.measureText(label).width;
  const dotSize = 9;
  const pillW = textWidth + 68;
  const pillX = (w - pillW) / 2;

  const pillFill = ctx.createLinearGradient(pillX, y, pillX + pillW, y + height);
  pillFill.addColorStop(0, "rgba(66, 133, 244, 0.16)");
  pillFill.addColorStop(1, "rgba(167, 139, 250, 0.14)");

  fillAndStrokeRoundedRect(
    ctx,
    pillX,
    y,
    pillW,
    height,
    height / 2,
    pillFill,
    "rgba(138, 180, 248, 0.34)",
    1.5
  );

  // Glowing accent dot
  const dotX = pillX + 26;
  const dotY = y + height / 2;
  ctx.save();
  ctx.shadowColor = "#4285f4";
  ctx.shadowBlur = 12;
  ctx.fillStyle = "#8ab4f8";
  ctx.beginPath();
  ctx.arc(dotX, dotY, dotSize / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "#e2e8f0";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(label, dotX + 16, dotY + 1);
}

function drawScoreGauge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  trackHeight: number,
  score: number,
  labelSize: number,
  fontFamily: string
): void {
  const minScore = 400;
  const maxScore = 990;
  const clamped = Math.max(minScore, Math.min(maxScore, score));
  const ratio = (clamped - minScore) / (maxScore - minScore);

  // Track background
  fillAndStrokeRoundedRect(
    ctx,
    x,
    y,
    width,
    trackHeight,
    trackHeight / 2,
    "rgba(255, 255, 255, 0.08)",
    "rgba(255, 255, 255, 0.1)",
    1
  );

  // Filled bar
  const fillW = Math.max(trackHeight, width * ratio);
  const barGrad = ctx.createLinearGradient(x, y, x + width, y);
  barGrad.addColorStop(0, "#4285f4");
  barGrad.addColorStop(0.58, "#8ab4f8");
  barGrad.addColorStop(1, "#a78bfa");

  ctx.save();
  ctx.shadowColor = "rgba(66, 133, 244, 0.55)";
  ctx.shadowBlur = 16;
  fillAndStrokeRoundedRect(ctx, x, y, fillW, trackHeight, trackHeight / 2, barGrad);
  ctx.restore();

  // Glowing thumb indicator
  const thumbX = x + fillW;
  const thumbY = y + trackHeight / 2;
  ctx.save();
  ctx.shadowColor = "rgba(251, 191, 36, 0.65)";
  ctx.shadowBlur = 16;
  ctx.fillStyle = "#f8fafc";
  ctx.beginPath();
  ctx.arc(thumbX, thumbY, trackHeight * 0.68, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#4285f4";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  // Scale labels: 400 / 700 / 990
  const labelY = y + trackHeight + 24;
  ctx.font = makeFont(600, labelSize, fontFamily);
  ctx.fillStyle = "rgba(148, 163, 184, 0.85)";
  ctx.textBaseline = "middle";

  ctx.textAlign = "left";
  ctx.fillText("400", x, labelY);

  const midRatio = (700 - minScore) / (maxScore - minScore);
  ctx.textAlign = "center";
  ctx.fillText("700", x + width * midRatio, labelY);

  ctx.textAlign = "right";
  ctx.fillText("990", x + width, labelY);
}

function drawFooter(
  ctx: CanvasRenderingContext2D,
  w: number,
  centerY: number,
  fontSize: number,
  fontFamily: string,
  pillStyle: boolean
): void {
  const prefix = "나도 3분 만에 진단하기 → ";
  const url = "gemini-campus-guide.vercel.app/?tab=toeic";

  ctx.font = makeFont(500, fontSize, fontFamily);
  const prefixW = ctx.measureText(prefix).width;
  ctx.font = makeFont(700, fontSize, fontFamily);
  const urlW = ctx.measureText(url).width;
  const totalW = prefixW + urlW;

  if (pillStyle) {
    const padX = 32;
    const pillH = 64;
    const pillW = Math.min(w - 112, totalW + padX * 2);
    fillAndStrokeRoundedRect(
      ctx,
      (w - pillW) / 2,
      centerY - pillH / 2,
      pillW,
      pillH,
      pillH / 2,
      "rgba(255, 255, 255, 0.04)",
      "rgba(255, 255, 255, 0.12)",
      1.2
    );
  }

  const startX = (w - totalW) / 2;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  ctx.font = makeFont(500, fontSize, fontFamily);
  ctx.fillStyle = "#94a3b8";
  ctx.fillText(prefix, startX, centerY);

  ctx.font = makeFont(700, fontSize, fontFamily);
  ctx.fillStyle = "#8ab4f8";
  ctx.fillText(url, startX + prefixW, centerY);
}

function drawRoastCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  roastComment: string,
  isStory: boolean,
  fontFamily: string
): void {
  const cardGrad = ctx.createLinearGradient(x, y, x + w, y + h);
  cardGrad.addColorStop(0, "rgba(251, 191, 36, 0.11)");
  cardGrad.addColorStop(0.55, "rgba(15, 23, 42, 0.72)");
  cardGrad.addColorStop(1, "rgba(167, 139, 250, 0.11)");

  fillAndStrokeRoundedRect(
    ctx,
    x,
    y,
    w,
    h,
    28,
    cardGrad,
    "rgba(251, 191, 36, 0.34)",
    1.8
  );

  // Subtle decorative quote mark
  ctx.save();
  ctx.font = makeFont(800, isStory ? 180 : 136, fontFamily);
  ctx.fillStyle = "rgba(251, 191, 36, 0.08)";
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText("”", x + w - 26, y + (isStory ? 12 : 4));
  ctx.restore();

  const innerPadX = isStory ? 44 : 38;
  const headerY = y + (isStory ? 54 : 42);

  // Header badge: 🔥 한 줄 팩폭
  ctx.font = makeFont(800, isStory ? 30 : 25, fontFamily);
  ctx.fillStyle = "#fbbf24";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const headerText = "🔥 한 줄 팩폭";
  ctx.fillText(headerText, x + innerPadX, headerY);

  const headerW = ctx.measureText(headerText).width;
  const dividerX = x + innerPadX + headerW + 18;
  const dividerEndX = x + w - innerPadX;
  if (dividerEndX > dividerX + 24) {
    const lineGrad = ctx.createLinearGradient(dividerX, headerY, dividerEndX, headerY);
    lineGrad.addColorStop(0, "rgba(251, 191, 36, 0.42)");
    lineGrad.addColorStop(1, "rgba(251, 191, 36, 0.04)");
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(dividerX, headerY);
    ctx.lineTo(dividerEndX, headerY);
    ctx.stroke();
  }

  // Adaptive multi-line Korean wrapping inside remaining card body
  const textMaxW = w - innerPadX * 2;
  const bodyTop = headerY + (isStory ? 40 : 32);
  const bodyBottom = y + h - (isStory ? 36 : 26);
  const bodyHeight = Math.max(80, bodyBottom - bodyTop);

  let fontSize = isStory ? 36 : 29;
  let lineHeight = Math.round(fontSize * 1.48);
  let lines: string[] = [];

  for (let attempt = 0; attempt < 4; attempt++) {
    ctx.font = makeFont(700, fontSize, fontFamily);
    lines = wrapKoreanText(ctx, roastComment, textMaxW);
    if (lines.length * lineHeight <= bodyHeight || fontSize <= 22) {
      break;
    }
    fontSize -= 3;
    lineHeight = Math.round(fontSize * 1.45);
  }

  const totalTextH = lines.length * lineHeight;
  const startY = bodyTop + Math.max(0, (bodyHeight - totalTextH) / 2) + lineHeight / 2;

  ctx.font = makeFont(700, fontSize, fontFamily);
  ctx.fillStyle = "#f8fafc";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  lines.forEach((line, idx) => {
    const drawY = startY + idx * lineHeight;
    if (drawY <= bodyBottom + 4) {
      ctx.fillText(line, x + innerPadX, drawY);
    }
  });
}

function renderSquareCard(
  ctx: CanvasRenderingContext2D,
  d: DiagnosisResult,
  fontFamily: string
): void {
  const W = 1080;
  const H = 1080;
  const padX = 64;
  const contentW = W - padX * 2;

  drawBackground(ctx, W, H);

  // 1. Top pill badge
  drawTopPill(ctx, W, 54, 48, 21, fontFamily);

  // 2. Hero Score Glass Card
  const heroY = 124;
  const heroH = 352;
  const heroGrad = ctx.createLinearGradient(padX, heroY, padX + contentW, heroY + heroH);
  heroGrad.addColorStop(0, "rgba(255, 255, 255, 0.065)");
  heroGrad.addColorStop(1, "rgba(255, 255, 255, 0.025)");
  fillAndStrokeRoundedRect(
    ctx,
    padX,
    heroY,
    contentW,
    heroH,
    30,
    heroGrad,
    "rgba(255, 255, 255, 0.12)",
    1.5
  );

  // Subtle eyebrow inside hero card
  ctx.font = makeFont(700, 17, fontFamily);
  ctx.fillStyle = "rgba(138, 180, 248, 0.85)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("ESTIMATED TOEIC SCORE", W / 2, heroY + 38);

  // Big predicted score + 점
  const scoreNum = `${d.finalScore}`;
  const scoreUnit = "점";
  ctx.font = makeFont(800, 120, fontFamily);
  const numW = ctx.measureText(scoreNum).width;
  ctx.font = makeFont(700, 44, fontFamily);
  const unitW = ctx.measureText(scoreUnit).width;
  const scoreTotalW = numW + unitW + 8;
  const scoreStartX = (W - scoreTotalW) / 2;
  const scoreBaseY = heroY + 158;

  ctx.save();
  ctx.shadowColor = "rgba(66, 133, 244, 0.38)";
  ctx.shadowBlur = 28;
  ctx.font = makeFont(800, 120, fontFamily);
  ctx.fillStyle = "#f8fafc";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(scoreNum, scoreStartX, scoreBaseY);
  ctx.restore();

  ctx.font = makeFont(700, 44, fontFamily);
  ctx.fillStyle = "#8ab4f8";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(scoreUnit, scoreStartX + numW + 8, scoreBaseY - 8);

  // Tier badge + (±25점 오차 범위)
  const tierText = d.tierTitle;
  const marginText = "(±25점 오차 범위)";
  ctx.font = makeFont(700, 23, fontFamily);
  const tierTextW = ctx.measureText(tierText).width;
  const tierPillW = tierTextW + 38;
  const tierPillH = 44;
  ctx.font = makeFont(500, 21, fontFamily);
  const marginW = ctx.measureText(marginText).width;
  const rowGap = 14;
  const rowTotalW = tierPillW + rowGap + marginW;
  const rowStartX = (W - rowTotalW) / 2;
  const rowCenterY = heroY + 206;

  fillAndStrokeRoundedRect(
    ctx,
    rowStartX,
    rowCenterY - tierPillH / 2,
    tierPillW,
    tierPillH,
    tierPillH / 2,
    "rgba(251, 191, 36, 0.14)",
    "rgba(251, 191, 36, 0.42)",
    1.5
  );
  ctx.font = makeFont(700, 23, fontFamily);
  ctx.fillStyle = "#fbbf24";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(tierText, rowStartX + tierPillW / 2, rowCenterY + 1);

  ctx.font = makeFont(500, 21, fontFamily);
  ctx.fillStyle = "#94a3b8";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(marginText, rowStartX + tierPillW + rowGap, rowCenterY + 1);

  // 3. Score Gauge Bar (400 ~ 990)
  drawScoreGauge(
    ctx,
    padX + 46,
    heroY + 268,
    contentW - 92,
    16,
    d.finalScore,
    18,
    fontFamily
  );

  // 4. Three Compact Stat Chips
  const chipY = 496;
  const chipH = 84;
  const gap = 16;
  const chipW = (contentW - gap * 2) / 3;
  const stats = [
    { label: "정답", value: `${d.correctCount}/${d.details.length}`, accent: "#8ab4f8" },
    { label: "소요", value: formatDurationKorean(d.totalTime), accent: "#f8fafc" },
    { label: "속도", value: d.speedLabel, accent: "#a78bfa" },
  ];

  stats.forEach((stat, idx) => {
    const cx = padX + idx * (chipW + gap);
    fillAndStrokeRoundedRect(
      ctx,
      cx,
      chipY,
      chipW,
      chipH,
      20,
      "rgba(255, 255, 255, 0.045)",
      "rgba(255, 255, 255, 0.12)",
      1.4
    );

    ctx.font = makeFont(600, 18, fontFamily);
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(stat.label, cx + chipW / 2, chipY + 25);

    ctx.font = makeFont(800, 26, fontFamily);
    ctx.fillStyle = stat.accent;
    ctx.fillText(stat.value, cx + chipW / 2, chipY + 57);
  });

  // 5. Part 5 / Part 6 / Part 7 Hit-Rate Pills
  const partY = 598;
  const partH = 74;
  const partStats = computePartStats(d);

  partStats.forEach((ps, idx) => {
    const px = padX + idx * (chipW + gap);
    const accent = getAccuracyAccent(ps.correct, ps.total);
    const ratio = ps.total > 0 ? ps.correct / ps.total : 0;

    fillAndStrokeRoundedRect(
      ctx,
      px,
      partY,
      chipW,
      partH,
      18,
      "rgba(255, 255, 255, 0.04)",
      "rgba(255, 255, 255, 0.12)",
      1.3
    );

    // Status dot + Part label
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(px + 26, partY + 31, 5.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = makeFont(700, 22, fontFamily);
    ctx.fillStyle = "#cbd5e1";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(ps.part, px + 42, partY + 32);

    ctx.font = makeFont(800, 25, fontFamily);
    ctx.fillStyle = "#f8fafc";
    ctx.textAlign = "right";
    ctx.fillText(`${ps.correct}/${ps.total}`, px + chipW - 22, partY + 32);

    // Mini progress bar
    const barX = px + 22;
    const barY = partY + 54;
    const barW = chipW - 44;
    const barH = 6;
    fillAndStrokeRoundedRect(
      ctx,
      barX,
      barY,
      barW,
      barH,
      3,
      "rgba(255, 255, 255, 0.09)"
    );
    if (ratio > 0) {
      fillAndStrokeRoundedRect(
        ctx,
        barX,
        barY,
        Math.max(barH, barW * ratio),
        barH,
        3,
        accent
      );
    }
  });

  // 6. Prominent 🔥 한 줄 팩폭 Callout Card
  drawRoastCard(ctx, padX, 694, contentW, 280, d.roastComment, false, fontFamily);

  // 7. Bottom subtle footer
  drawFooter(ctx, W, 1024, 21, fontFamily, false);
}

function renderStoryCard(
  ctx: CanvasRenderingContext2D,
  d: DiagnosisResult,
  fontFamily: string
): void {
  const W = 1080;
  const H = 1920;
  const padX = 68;
  const contentW = W - padX * 2;

  drawBackground(ctx, W, H);

  // 1. Top pill badge (placed below Instagram Story top safe zone)
  drawTopPill(ctx, W, 182, 56, 23, fontFamily);

  // 2. Hero Score Glass Card
  const heroY = 278;
  const heroH = 510;
  const heroGrad = ctx.createLinearGradient(padX, heroY, padX + contentW, heroY + heroH);
  heroGrad.addColorStop(0, "rgba(255, 255, 255, 0.07)");
  heroGrad.addColorStop(1, "rgba(255, 255, 255, 0.025)");
  fillAndStrokeRoundedRect(
    ctx,
    padX,
    heroY,
    contentW,
    heroH,
    34,
    heroGrad,
    "rgba(255, 255, 255, 0.12)",
    1.6
  );

  ctx.font = makeFont(700, 20, fontFamily);
  ctx.fillStyle = "rgba(138, 180, 248, 0.88)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("ESTIMATED TOEIC SCORE", W / 2, heroY + 54);

  // Big predicted score + 점
  const scoreNum = `${d.finalScore}`;
  const scoreUnit = "점";
  ctx.font = makeFont(800, 156, fontFamily);
  const numW = ctx.measureText(scoreNum).width;
  ctx.font = makeFont(700, 56, fontFamily);
  const unitW = ctx.measureText(scoreUnit).width;
  const scoreTotalW = numW + unitW + 10;
  const scoreStartX = (W - scoreTotalW) / 2;
  const scoreBaseY = heroY + 224;

  ctx.save();
  ctx.shadowColor = "rgba(66, 133, 244, 0.42)";
  ctx.shadowBlur = 34;
  ctx.font = makeFont(800, 156, fontFamily);
  ctx.fillStyle = "#f8fafc";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(scoreNum, scoreStartX, scoreBaseY);
  ctx.restore();

  ctx.font = makeFont(700, 56, fontFamily);
  ctx.fillStyle = "#8ab4f8";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(scoreUnit, scoreStartX + numW + 10, scoreBaseY - 12);

  // Tier badge pill
  const tierText = d.tierTitle;
  ctx.font = makeFont(700, 28, fontFamily);
  const tierW = ctx.measureText(tierText).width + 50;
  const tierH = 54;
  const tierY = heroY + 266;
  fillAndStrokeRoundedRect(
    ctx,
    (W - tierW) / 2,
    tierY,
    tierW,
    tierH,
    tierH / 2,
    "rgba(251, 191, 36, 0.14)",
    "rgba(251, 191, 36, 0.45)",
    1.6
  );
  ctx.fillStyle = "#fbbf24";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(tierText, W / 2, tierY + tierH / 2 + 1);

  // (±25점 오차 범위)
  ctx.font = makeFont(500, 23, fontFamily);
  ctx.fillStyle = "#94a3b8";
  ctx.fillText("(±25점 오차 범위)", W / 2, tierY + tierH + 34);

  // 3. Score Gauge Bar (400 ~ 990)
  drawScoreGauge(
    ctx,
    padX + 52,
    heroY + 412,
    contentW - 104,
    20,
    d.finalScore,
    20,
    fontFamily
  );

  // 4. Three Compact Stat Chips
  const chipY = 826;
  const chipH = 126;
  const gap = 18;
  const chipW = (contentW - gap * 2) / 3;
  const stats = [
    { label: "정답", value: `${d.correctCount}/${d.details.length}`, accent: "#8ab4f8" },
    { label: "소요", value: formatDurationKorean(d.totalTime), accent: "#f8fafc" },
    { label: "속도", value: d.speedLabel, accent: "#a78bfa" },
  ];

  stats.forEach((stat, idx) => {
    const cx = padX + idx * (chipW + gap);
    fillAndStrokeRoundedRect(
      ctx,
      cx,
      chipY,
      chipW,
      chipH,
      24,
      "rgba(255, 255, 255, 0.048)",
      "rgba(255, 255, 255, 0.12)",
      1.5
    );

    ctx.font = makeFont(600, 22, fontFamily);
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(stat.label, cx + chipW / 2, chipY + 38);

    ctx.font = makeFont(800, 31, fontFamily);
    ctx.fillStyle = stat.accent;
    ctx.fillText(stat.value, cx + chipW / 2, chipY + 84);
  });

  // 5. Part 5 / Part 6 / Part 7 Hit-Rate Pills
  const partY = 986;
  const partH = 112;
  const partStats = computePartStats(d);

  partStats.forEach((ps, idx) => {
    const px = padX + idx * (chipW + gap);
    const accent = getAccuracyAccent(ps.correct, ps.total);
    const ratio = ps.total > 0 ? ps.correct / ps.total : 0;

    fillAndStrokeRoundedRect(
      ctx,
      px,
      partY,
      chipW,
      partH,
      22,
      "rgba(255, 255, 255, 0.042)",
      "rgba(255, 255, 255, 0.12)",
      1.4
    );

    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(px + 28, partY + 42, 6.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = makeFont(700, 24, fontFamily);
    ctx.fillStyle = "#cbd5e1";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(ps.part, px + 46, partY + 43);

    ctx.font = makeFont(800, 30, fontFamily);
    ctx.fillStyle = "#f8fafc";
    ctx.textAlign = "right";
    ctx.fillText(`${ps.correct}/${ps.total}`, px + chipW - 24, partY + 43);

    const barX = px + 24;
    const barY = partY + 78;
    const barW = chipW - 48;
    const barH = 8;
    fillAndStrokeRoundedRect(
      ctx,
      barX,
      barY,
      barW,
      barH,
      4,
      "rgba(255, 255, 255, 0.09)"
    );
    if (ratio > 0) {
      fillAndStrokeRoundedRect(
        ctx,
        barX,
        barY,
        Math.max(barH, barW * ratio),
        barH,
        4,
        accent
      );
    }
  });

  // 6. Prominent 🔥 한 줄 팩폭 Callout Card
  drawRoastCard(ctx, padX, 1138, contentW, 436, d.roastComment, true, fontFamily);

  // 7. Bottom subtle footer CTA pill (above Instagram Story bottom safe zone)
  drawFooter(ctx, W, 1664, 22, fontFamily, true);
}

function triggerCanvasDownload(
  canvas: HTMLCanvasElement,
  filename: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const triggerAnchor = (href: string, revokeAfter: boolean) => {
      const link = document.createElement("a");
      link.download = filename;
      link.href = href;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (revokeAfter) {
        window.setTimeout(() => URL.revokeObjectURL(href), 1500);
      }
      resolve();
    };

    if (typeof canvas.toBlob === "function") {
      try {
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            triggerAnchor(url, true);
            return;
          }
          try {
            const dataUrl = canvas.toDataURL("image/png");
            triggerAnchor(dataUrl, false);
          } catch (err) {
            reject(err);
          }
        }, "image/png");
        return;
      } catch {
        // Fall through to toDataURL fallback
      }
    }

    try {
      const dataUrl = canvas.toDataURL("image/png");
      triggerAnchor(dataUrl, false);
    } catch (err) {
      reject(err);
    }
  });
}

export async function downloadToeicShareCard(
  d: DiagnosisResult,
  format: ShareCardFormat
): Promise<void> {
  if (typeof document === "undefined") return;

  if (document.fonts && typeof document.fonts.ready?.then === "function") {
    try {
      await document.fonts.ready;
    } catch {
      // Proceed with fallback fonts if font loading fails
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = format === "story" ? 1920 : 1080;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2D canvas context is unavailable.");
  }

  const fontFamily = resolveFontStack();
  if (format === "story") {
    renderStoryCard(ctx, d, fontFamily);
  } else {
    renderSquareCard(ctx, d, fontFamily);
  }

  const filename = `toeic-diagnosis-${d.finalScore}-${format}.png`;
  await triggerCanvasDownload(canvas, filename);
}
