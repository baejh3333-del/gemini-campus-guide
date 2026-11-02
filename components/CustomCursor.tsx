"use client";

import { useEffect, useRef } from "react";

type Point = [number, number];

// 4개의 3차 베지어 곡선(총 12개 제어점: [P0, C0_out, C1_in, P1, C1_out, C2_in, P2, C2_out, C3_in, P3, C3_out, C0_in])
type ShapePoints = [
  Point, Point, Point,
  Point, Point, Point,
  Point, Point, Point,
  Point, Point, Point,
];

// 1. 기본 상태: 스케치와 동일한 유선형 화살표 (좌상단 꼭짓점 기준)
const ARROW_POINTS: ShapePoints = [
  [-2, -2],   // P0: 화살표 끝점 (마우스 핫스팟)
  [7, 1],     // C0_out
  [18, 5],    // C1_in
  [25, 9],    // P1: 오른쪽 날개 끝
  [27, 10],   // C1_out
  [15, 9],    // C2_in
  [10, 12],   // P2: 안쪽 오목한 중심점
  [7, 14],    // C2_out
  [9, 23],    // C3_in
  [7, 26],    // P3: 아래쪽 날개 끝
  [5, 27],    // C3_out
  [1, 8],     // C0_in
];

// 타원/원 생성 헬퍼 (45도 회전된 4점 베지어 근사 — 화살표의 4개 꼭짓점과 1:1 대응)
function createEllipsePoints(rx: number, ry: number): ShapePoints {
  const c = Math.SQRT1_2; // cos(45°) ≈ 0.70710678
  const k = 0.55228475 * c; // 베지어 원 근사 상수 * cos(45°) ≈ 0.39052429

  const cx = rx * c;
  const cy = ry * c;
  const dx = rx * k;
  const dy = ry * k;

  return [
    [-cx, -cy],             // P0 (좌상단)
    [-cx + dx, -cy - dy],   // C0_out
    [cx - dx, -cy - dy],    // C1_in
    [cx, -cy],              // P1 (우상단)
    [cx + dx, -cy + dy],    // C1_out
    [cx + dx, cy - dy],     // C2_in
    [cx, cy],               // P2 (우하단)
    [cx - dx, cy + dy],     // C2_out
    [-cx + dx, cy + dy],    // C3_in
    [-cx, cy],              // P3 (좌하단)
    [-cx - dx, cy - dy],    // C3_out
    [-cx - dx, -cy + dy],   // C0_in
  ];
}

// 2. 버튼 위에 있을 때: 동그란 원형
const CIRCLE_POINTS: ShapePoints = createEllipsePoints(16, 16);

// 3. 휠 스크롤할 때: 위아래로 길쭉한 타원형
const SCROLL_POINTS: ShapePoints = createEllipsePoints(10, 23);

function pointsToSvgPath(pts: ShapePoints): string {
  const f = (n: number) => n.toFixed(2);
  return [
    `M ${f(pts[0][0])} ${f(pts[0][1])}`,
    `C ${f(pts[1][0])} ${f(pts[1][1])}, ${f(pts[2][0])} ${f(pts[2][1])}, ${f(pts[3][0])} ${f(pts[3][1])}`,
    `C ${f(pts[4][0])} ${f(pts[4][1])}, ${f(pts[5][0])} ${f(pts[5][1])}, ${f(pts[6][0])} ${f(pts[6][1])}`,
    `C ${f(pts[7][0])} ${f(pts[7][1])}, ${f(pts[8][0])} ${f(pts[8][1])}, ${f(pts[9][0])} ${f(pts[9][1])}`,
    `C ${f(pts[10][0])} ${f(pts[10][1])}, ${f(pts[11][0])} ${f(pts[11][1])}, ${f(pts[0][0])} ${f(pts[0][1])}`,
    "Z",
  ].join(" ");
}

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], summary, input, textarea, select, label[for], [data-cursor="button"]';

export default function CustomCursor() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    // 터치 기기(모바일/태블릿)에서는 커스텀 마우스 커서를 비활성화
    const mq = window.matchMedia("(pointer: fine)");
    if (!mq.matches) return;

    const wrapper = wrapperRef.current;
    const pathEl = pathRef.current;
    if (!wrapper || !pathEl) return;

    let mouseX = -100;
    let mouseY = -100;
    let renderX = -100;
    let renderY = -100;
    let hasMoved = false;
    let isVisible = false;
    let isHoveringButton = false;
    let isScrolling = false;
    let isPressed = false;
    let currentScale = 1;
    let scrollTimer: ReturnType<typeof setTimeout> | null = null;
    let rafId = 0;

    const currentPoints: ShapePoints = ARROW_POINTS.map(
      ([x, y]) => [x, y] as Point
    ) as ShapePoints;

    const updateInteractiveState = (target: EventTarget | null) => {
      if (!(target instanceof Element)) {
        isHoveringButton = false;
        return;
      }
      isHoveringButton = Boolean(target.closest(INTERACTIVE_SELECTOR));
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!hasMoved) {
        renderX = mouseX;
        renderY = mouseY;
        hasMoved = true;
      }
      if (!isVisible) {
        isVisible = true;
        wrapper.style.opacity = "1";
      }
      updateInteractiveState(e.target);
    };

    const onMouseOver = (e: MouseEvent) => {
      updateInteractiveState(e.target);
    };

    const onWheel = () => {
      isScrolling = true;
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        isScrolling = false;
      }, 220);
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

    const animate = () => {
      // 위치 보간 (부드럽고 즉각적인 반응)
      renderX += (mouseX - renderX) * 0.38;
      renderY += (mouseY - renderY) * 0.38;

      // 우선순위: 휠 스크롤 중 > 버튼 호버 중 > 기본 화살표
      const targetPoints = isScrolling
        ? SCROLL_POINTS
        : isHoveringButton
          ? CIRCLE_POINTS
          : ARROW_POINTS;

      // 제어점 보간으로 도형 간 부드러운 모핑
      const morphSpeed = 0.22;
      for (let i = 0; i < 12; i++) {
        currentPoints[i][0] += (targetPoints[i][0] - currentPoints[i][0]) * morphSpeed;
        currentPoints[i][1] += (targetPoints[i][1] - currentPoints[i][1]) * morphSpeed;
      }

      const targetScale = isPressed ? 0.86 : 1;
      currentScale += (targetScale - currentScale) * 0.25;

      wrapper.style.transform = `translate3d(${renderX.toFixed(2)}px, ${renderY.toFixed(2)}px, 0) scale(${currentScale.toFixed(3)})`;
      pathEl.setAttribute("d", pointsToSvgPath(currentPoints));

      // 상태에 따른 채우기 투명도 조절
      pathEl.style.fill = isScrolling
        ? "rgba(56, 189, 248, 0.16)"
        : isHoveringButton
          ? "rgba(56, 189, 248, 0.14)"
          : "rgba(56, 189, 248, 0.08)";

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
      if (scrollTimer) clearTimeout(scrollTimer);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseover", onMouseOver);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
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
        transition: "opacity 0.18s ease",
        willChange: "transform",
      }}
    >
      <svg
        width="80"
        height="80"
        viewBox="-40 -40 80 80"
        style={{
          position: "absolute",
          top: -40,
          left: -40,
          overflow: "visible",
          filter: "drop-shadow(0 0 6px rgba(56, 189, 248, 0.45))",
        }}
      >
        <path
          ref={pathRef}
          d={pointsToSvgPath(ARROW_POINTS)}
          fill="rgba(56, 189, 248, 0.08)"
          stroke="#29b6f6"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
