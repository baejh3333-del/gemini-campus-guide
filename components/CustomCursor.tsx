"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Point = [number, number];

// 8개의 앵커 포인트 × 3(Anchor, OutControl, NextInControl) = 24개 제어점
type ShapePoints = Point[];

// 1. 기본 (Default): 24 × 28 px, 기준점 화살표 끝 (1, 1) -> 로컬 (0, 0)
const ARROW_POINTS: ShapePoints = [
  // Seg 0: P0(화살표 끝) -> P1(상단 직선 중간)
  [0, 0],
  [2.1, 1.15],
  [7.5, 4.1],
  // Seg 1: P1 -> P2(오른쪽 날개 끝)
  [11.2, 6.1],
  [15.2, 8.3],
  [21.2, 11.6],
  // Seg 2: P2 -> P3(안쪽 상단 곡선)
  [22.8, 12.8],
  [22.6, 13.9],
  [18.4, 13.8],
  // Seg 3: P3 -> P4(안쪽 오목한 중심점)
  [15.0, 14.0],
  [12.2, 14.2],
  [10.7, 14.5],
  // Seg 4: P4 -> P5(안쪽 하단 곡선)
  [9.7, 15.6],
  [8.9, 16.9],
  [8.4, 19.1],
  // Seg 5: P5 -> P6(아래쪽 날개 끝)
  [7.9, 21.2],
  [7.4, 23.5],
  [6.9, 25.6],
  // Seg 6: P6 -> P7(좌측 직선 중간)
  [6.2, 26.8],
  [5.3, 25.9],
  [4.2, 18.2],
  // Seg 7: P7 -> P0(화살표 끝 복귀)
  [3.1, 13.4],
  [1.8, 7.8],
  [0.45, 2.1],
];

// 2. 버튼 위에 있을 때 (Hover): 24 × 24 px 원형, 기준점 중앙 (12, 12) -> 로컬 (0, 0)
function createCirclePoints(r: number): ShapePoints {
  const k = (4 / 3) * Math.tan(Math.PI / 16) * r;
  const anchors: Point[] = [];
  const ins: Point[] = [];
  const outs: Point[] = [];

  for (let i = 0; i < 8; i++) {
    const theta = -0.75 * Math.PI + i * (Math.PI / 4);
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const ax = r * cos;
    const ay = r * sin;
    const tx = -sin;
    const ty = cos;

    anchors.push([ax, ay]);
    ins.push([ax - k * tx, ay - k * ty]);
    outs.push([ax + k * tx, ay + k * ty]);
  }

  const pts: ShapePoints = [];
  for (let i = 0; i < 8; i++) {
    const next = (i + 1) % 8;
    pts.push(anchors[i], outs[i], ins[next]);
  }
  return pts;
}

// 3. 휠 스크롤할 때 (Scroll): 18 × 36 px 캡슐(Pill), 기준점 중앙 (9, 18) -> 로컬 (0, 0)
function createPillPoints(rx: number, halfStraight: number): ShapePoints {
  const k = 0.55228475 * rx;
  const s = halfStraight;
  const topY = -(s + rx);
  const botY = s + rx;

  const anchors: Point[] = [
    [-rx, -s],
    [0, topY],
    [rx, -s],
    [rx, 0],
    [rx, s],
    [0, botY],
    [-rx, s],
    [-rx, 0],
  ];

  const ins: Point[] = [
    [-rx, -s * 0.66],
    [-k, topY],
    [rx, -s - k],
    [rx, -s * 0.33],
    [rx, s * 0.66],
    [k, botY],
    [-rx, s + k],
    [-rx, s * 0.33],
  ];

  const outs: Point[] = [
    [-rx, -s - k],
    [k, topY],
    [rx, -s * 0.66],
    [rx, s * 0.33],
    [rx, s + k],
    [-k, botY],
    [-rx, s * 0.66],
    [-rx, -s * 0.33],
  ];

  const pts: ShapePoints = [];
  for (let i = 0; i < 8; i++) {
    const next = (i + 1) % 8;
    pts.push(anchors[i], outs[i], ins[next]);
  }
  return pts;
}

const CIRCLE_POINTS: ShapePoints = createCirclePoints(12); // 24 × 24 px
const SCROLL_POINTS: ShapePoints = createPillPoints(9, 9); // 18 × 36 px

function pointsToSvgPath(pts: ShapePoints): string {
  const f = (n: number) => n.toFixed(2);
  const cmds: string[] = [`M ${f(pts[0][0])} ${f(pts[0][1])}`];
  for (let i = 0; i < 8; i++) {
    const base = i * 3;
    const nextAnchor = ((i + 1) % 8) * 3;
    const c1 = pts[base + 1];
    const c2 = pts[base + 2];
    const p2 = pts[nextAnchor];
    cmds.push(
      `C ${f(c1[0])} ${f(c1[1])}, ${f(c2[0])} ${f(c2[1])}, ${f(p2[0])} ${f(p2[1])}`
    );
  }
  cmds.push("Z");
  return cmds.join(" ");
}

type RGB = [number, number, number];

// 테두리(Stroke) 전용 컬러 팔레트 (은은하고 세련된 웹사이트 톤앤매너)
const STROKE_PALETTES: {
  default: [RGB, RGB, RGB];
  hover: [RGB, RGB, RGB];
  scroll: [RGB, RGB, RGB];
} = {
  // Default: 아이스 블루 -> 제미나이 스카이 블루 -> 소프트 블루
  default: [
    [194, 231, 255], // #c2e7ff
    [138, 180, 248], // #8ab4f8
    [66, 133, 244],  // #4285f4
  ],
  // Hover: 스카이 블루 -> 소프트 앰버 포인트 -> 민트 스카이
  hover: [
    [138, 180, 248], // #8ab4f8
    [246, 196, 118], // 은은한 샴페인 앰버
    [142, 218, 188], // 은은한 민트
  ],
  // Scroll: 브라이트 블루 -> 웜 코랄 앰버 -> 소프트 그린
  scroll: [
    [138, 180, 248], // #8ab4f8
    [244, 162, 108], // 은은한 웜 앰버
    [126, 214, 168], // 소프트 그린
  ],
};

function mixRgb(a: RGB, b: RGB, c: RGB, wa: number, wb: number, wc: number): string {
  const r = Math.round(a[0] * wa + b[0] * wb + c[0] * wc);
  const g = Math.round(a[1] * wa + b[1] * wb + c[1] * wc);
  const bl = Math.round(a[2] * wa + b[2] * wb + c[2] * wc);
  return `rgb(${r}, ${g}, ${bl})`;
}

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], summary, input, textarea, select, label[for], [data-cursor="button"]';

export default function CustomCursor() {
  const [surface, setSurface] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const sync = () => setSurface(document.querySelector<HTMLDialogElement>("dialog[open]") ?? document.body);
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["open"] });
    return () => observer.disconnect();
  }, []);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const shapeGroupRef = useRef<SVGGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const pulseRingRef = useRef<SVGCircleElement>(null);
  const stop0Ref = useRef<SVGStopElement>(null);
  const stop1Ref = useRef<SVGStopElement>(null);
  const stop2Ref = useRef<SVGStopElement>(null);
  const gradRef = useRef<SVGLinearGradientElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    if (!mq.matches) return;

    const wrapper = wrapperRef.current;
    const shapeGroup = shapeGroupRef.current;
    const pathEl = pathRef.current;
    const pulseRingEl = pulseRingRef.current;
    const s0 = stop0Ref.current;
    const s1 = stop1Ref.current;
    const s2 = stop2Ref.current;
    const gradEl = gradRef.current;
    if (!wrapper || !shapeGroup || !pathEl || !s0 || !s1 || !s2 || !gradEl) {
      return;
    }

    let isVisible = false;
    let isHoveringButton = false;
    let isScrolling = false;
    let isPressed = false;

    // 2차 스프링 물리 상태값 (도형 모핑 & 스크롤 탄성 모션)
    let hoverPos = 0;
    let hoverVel = 0;
    let scrollPos = 0;
    let scrollVel = 0;

    // 휠 스크롤 다이나믹 스트레치 & 스쿼시 스프링
    let stretchPos = 0;
    let stretchVel = 0;
    let stretchTarget = 0;

    // 휠 방향 모멘텀 오프셋
    let shiftYPos = 0;
    let shiftYVel = 0;
    let shiftYTarget = 0;

    let pressScalePos = 1;
    let pressScaleVel = 0;

    // 스크롤 시작/정지 시 퍼지는 리플 링 애니메이션
    let pulseProgress = 1;
    let gradFlowAngle = 135;

    let scrollStopTimer: ReturnType<typeof setTimeout> | null = null;
    let stretchDecayTimer: ReturnType<typeof setTimeout> | null = null;
    let lastTime = performance.now();
    let rafId = 0;

    const currentPoints: ShapePoints = ARROW_POINTS.map(
      ([x, y]) => [x, y] as Point
    );

    const updateInteractiveState = (target: EventTarget | null) => {
      if (!(target instanceof Element)) {
        isHoveringButton = false;
        return;
      }
      isHoveringButton = Boolean(target.closest(INTERACTIVE_SELECTOR));
    };

    const onMouseMove = (e: MouseEvent) => {
      // Keep pointer position immediate; animate only the decorative shape.
      wrapper.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      if (!isVisible) {
        isVisible = true;
        wrapper.style.opacity = "1";
      }
      updateInteractiveState(e.target);
    };

    const onMouseOver = (e: MouseEvent) => {
      updateInteractiveState(e.target);
    };

    const onWheel = (e: WheelEvent) => {
      const wasScrolling = isScrolling;
      isScrolling = true;

      // 휠 속도에 비례한 역동적 스트레치 + 방향성 모멘텀
      const delta = Math.max(-120, Math.min(120, e.deltaY));
      const intensity = Math.min(1, Math.abs(delta) / 75);
      const dir = delta >= 0 ? 1 : -1;

      stretchTarget = 0.14 + intensity * 0.24;
      stretchVel += intensity * 2.6;
      shiftYTarget = dir * (2.5 + intensity * 5.0);
      gradFlowAngle += delta * 0.45;

      if (!wasScrolling) {
        scrollVel += 3.2;
        pulseProgress = 0;
      }

      if (stretchDecayTimer) clearTimeout(stretchDecayTimer);
      stretchDecayTimer = setTimeout(() => {
        // 휠 입력이 멈추는 순간: 늘어난 캡슐이 통! 하고 탄성 스쿼시(반동) 발생
        stretchTarget = 0;
        shiftYTarget = 0;
        stretchVel -= 3.8;
      }, 65);

      if (scrollStopTimer) clearTimeout(scrollStopTimer);
      scrollStopTimer = setTimeout(() => {
        isScrolling = false;
        pulseProgress = 0;
      }, 210);
    };

    const onMouseDown = () => {
      isPressed = true;
    };

    const onMouseUp = () => {
      isPressed = false;
    };

    const onMouseLeave = () => {
      isVisible = false;
      wrapper.style.opacity = "0";
    };

    const animate = (now: number) => {
      const dt = Math.min(0.032, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      // 2. 2차 스프링 물리 계산
      const scrollTarget = isScrolling ? 1 : 0;
      const scrollStiffness = isScrolling ? 260 : 195;
      const scrollDamping = isScrolling ? 18 : 13.5;
      scrollVel += ((scrollTarget - scrollPos) * scrollStiffness - scrollVel * scrollDamping) * dt;
      scrollPos += scrollVel * dt;

      const hoverTarget = !isScrolling && isHoveringButton ? 1 : 0;
      const hoverStiffness = 220;
      const hoverDamping = 16;
      hoverVel += ((hoverTarget - hoverPos) * hoverStiffness - hoverVel * hoverDamping) * dt;
      hoverPos += hoverVel * dt;

      const stretchStiffness = 310;
      const stretchDamping = 14;
      stretchVel += ((stretchTarget - stretchPos) * stretchStiffness - stretchVel * stretchDamping) * dt;
      stretchPos += stretchVel * dt;

      const shiftStiffness = 240;
      const shiftDamping = 15;
      shiftYVel += ((shiftYTarget - shiftYPos) * shiftStiffness - shiftYVel * shiftDamping) * dt;
      shiftYPos += shiftYVel * dt;

      const pressTarget = isPressed ? 0.86 : 1;
      pressScaleVel += ((pressTarget - pressScalePos) * 320 - pressScaleVel * 18) * dt;
      pressScalePos += pressScaleVel * dt;

      // 3. 세 가지 도형 가중치 블렌딩
      const wScroll = scrollPos;
      const wHover = hoverPos * (1 - Math.max(0, Math.min(1, scrollPos)));
      const wDefault = 1 - wScroll - wHover;

      for (let i = 0; i < 24; i++) {
        currentPoints[i][0] =
          ARROW_POINTS[i][0] * wDefault +
          CIRCLE_POINTS[i][0] * wHover +
          SCROLL_POINTS[i][0] * wScroll;
        currentPoints[i][1] =
          ARROW_POINTS[i][1] * wDefault +
          CIRCLE_POINTS[i][1] * wHover +
          SCROLL_POINTS[i][1] * wScroll;
      }

      // 4. 부피 보존형 탄성 스케일 (Squash & Stretch)
      const sy = Math.max(0.72, 1 + stretchPos);
      const sx = 1 / Math.sqrt(sy);
      const dynamicTilt = scrollVel * 1.6;

      shapeGroup.style.transform = `scale(${(sx * pressScalePos).toFixed(3)}, ${(sy * pressScalePos).toFixed(3)}) translateY(${shiftYPos.toFixed(2)}px) rotate(${dynamicTilt.toFixed(2)}deg)`;
      pathEl.setAttribute("d", pointsToSvgPath(currentPoints));

      // 5. 테두리(Stroke) 그라데이션 컬러 보간
      const cwScroll = Math.max(0, Math.min(1, wScroll));
      const cwHover = Math.max(0, Math.min(1 - cwScroll, wHover));
      const cwDefault = Math.max(0, 1 - cwScroll - cwHover);

      s0.setAttribute(
        "stop-color",
        mixRgb(STROKE_PALETTES.default[0], STROKE_PALETTES.hover[0], STROKE_PALETTES.scroll[0], cwDefault, cwHover, cwScroll)
      );
      s1.setAttribute(
        "stop-color",
        mixRgb(STROKE_PALETTES.default[1], STROKE_PALETTES.hover[1], STROKE_PALETTES.scroll[1], cwDefault, cwHover, cwScroll)
      );
      s2.setAttribute(
        "stop-color",
        mixRgb(STROKE_PALETTES.default[2], STROKE_PALETTES.hover[2], STROKE_PALETTES.scroll[2], cwDefault, cwHover, cwScroll)
      );

      gradFlowAngle += (135 - gradFlowAngle) * (1 - Math.exp(-8 * dt));
      const rad = (gradFlowAngle * Math.PI) / 180;
      const gx = Math.cos(rad) * 50;
      const gy = Math.sin(rad) * 50;
      gradEl.setAttribute("x1", `${(50 - gx).toFixed(1)}%`);
      gradEl.setAttribute("y1", `${(50 - gy).toFixed(1)}%`);
      gradEl.setAttribute("x2", `${(50 + gx).toFixed(1)}%`);
      gradEl.setAttribute("y2", `${(50 + gy).toFixed(1)}%`);

      // 6. 스크롤 시작/정지 시 퍼져나가는 모션그래픽 리플 링
      if (pulseRingEl) {
        if (pulseProgress < 1) {
          pulseProgress = Math.min(1, pulseProgress + dt * 2.4);
          const easeOut = 1 - Math.pow(1 - pulseProgress, 3);
          const ringRadius = 10 + easeOut * 16;
          const ringOpacity = (1 - easeOut) * 0.38;
          pulseRingEl.setAttribute("r", ringRadius.toFixed(2));
          pulseRingEl.style.opacity = ringOpacity.toFixed(3);
        } else {
          pulseRingEl.style.opacity = "0";
        }
      }

      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mouseover", onMouseOver, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("mousedown", onMouseDown, { passive: true });
    window.addEventListener("mouseup", onMouseUp, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      if (scrollStopTimer) clearTimeout(scrollStopTimer);
      if (stretchDecayTimer) clearTimeout(stretchDecayTimer);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseover", onMouseOver);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [surface]);

  const cursor = (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      className="custom-cursor-root"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: 0,
        height: 0,
        pointerEvents: "none",
        zIndex: 99999,
        opacity: 0,
        transition: "opacity 0.2s ease",
        willChange: "transform",
      }}
    >
      <svg
        width="100"
        height="100"
        viewBox="-50 -50 100 100"
        style={{
          position: "absolute",
          top: -50,
          left: -50,
          overflow: "visible",
          filter: "drop-shadow(0 0 6px rgba(138, 180, 248, 0.35))",
        }}
      >
        <defs>
          <linearGradient
            ref={gradRef}
            id="gsa-cursor-stroke-gradient"
            x1="15%"
            y1="15%"
            x2="85%"
            y2="85%"
          >
            <stop ref={stop0Ref} offset="0%" stopColor="rgb(194, 231, 255)" />
            <stop ref={stop1Ref} offset="52%" stopColor="rgb(138, 180, 248)" />
            <stop ref={stop2Ref} offset="100%" stopColor="rgb(66, 133, 244)" />
          </linearGradient>
        </defs>

        {/* 스크롤 전환 시 퍼져나가는 탄성 파동 링 */}
        <circle
          ref={pulseRingRef}
          cx="0"
          cy="0"
          r="12"
          fill="none"
          stroke="rgba(138, 180, 248, 0.55)"
          strokeWidth="1.1"
          style={{ opacity: 0, pointerEvents: "none" }}
        />

        <g ref={shapeGroupRef} style={{ transformOrigin: "0px 0px" }}>
          <path
            ref={pathRef}
            d={pointsToSvgPath(ARROW_POINTS)}
            fill="none"
            stroke="url(#gsa-cursor-stroke-gradient)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    </div>
  );
  return surface ? createPortal(cursor, surface) : null;
}
