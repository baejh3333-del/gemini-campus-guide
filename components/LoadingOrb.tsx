"use client";

import { useLayoutEffect, useRef } from "react";

export function LoadingOrb() {
  const stage = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const target = document.querySelector(".hero-typing-title");
    if (!target || !stage.current) return;
    const rect = target.getBoundingClientRect();
    stage.current.style.setProperty("--orb-target-x", `${rect.left + rect.width / 2}px`);
    stage.current.style.setProperty("--orb-target-y", `${rect.top + rect.height / 2}px`);
  }, []);
  return <div ref={stage} className="loading-orb-stage" role="status" aria-label="프롬프트 준비 중"><span className="loading-orb" aria-hidden="true" /></div>;
}
