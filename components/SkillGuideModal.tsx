"use client";

import { useEffect, useState } from "react";

export function SkillGuideModal({
  open,
  onClose,
  skillName,
  skillBody,
}: {
  open: boolean;
  onClose: () => void;
  skillName?: string;
  skillBody?: string;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function downloadSampleSkill() {
    const content =
      skillBody ||
      `---\nname: ${skillName || "custom-skill"}\ndescription: Custom Gemini Skill\n---\n\n# Instructions\n`;
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "SKILL.md";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      className="skill-guide-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="skill-guide-title"
      onClick={onClose}
    >
      <div className="skill-guide-modal" onClick={(e) => e.stopPropagation()}>
        <div className="skill-guide-header">
          <div>
            <span className="skill-guide-badge">GEMINI SKILL UPLOAD GUIDE</span>
            <h3 id="skill-guide-title">Gemini에서 Skill(기능) 파일 추가하는 방법</h3>
            <p>
              요즘 GitHub에서 가장 많이 쓰이는 <code>SKILL.md</code> 파일 첨부 기능을 30초 만에 등록해 보세요!
            </p>
          </div>
          <button
            type="button"
            className="skill-guide-close"
            onClick={onClose}
            aria-label="가이드라인 창 닫기"
          >
            ✕
          </button>
        </div>

        {/* Visual Replica of the Gemini "기능 업로드 (Skill Upload)" UI */}
        <div className="skill-ui-mockup" aria-label="Gemini 기능 업로드 화면 예시">
          <div className="mockup-top-bar">
            <span className="mockup-tab">탐색</span>
            <span className="mockup-tab">커넥터</span>
            <span className="mockup-tab is-active">스킬</span>
            <span className="mockup-create-btn">만들기 ▾</span>
          </div>

          <div className="mockup-dialog-box">
            <div className="mockup-dialog-title">기능 업로드</div>
            <div className="mockup-dropzone">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 16V4m0 0-4 4m4-4 4 4" />
                <path d="M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" />
              </svg>
              <p>
                <span className="mockup-highlight">파일</span> 또는 <span className="mockup-underline">폴더</span>를 드래그하거나 선택하세요.
              </p>
              <small>(PDF, CSV, PY, TXT, MD 파일)</small>
            </div>
            <div className="mockup-reqs">
              <strong>파일이 다음 요구사항을 충족하는지 확인하세요.</strong>
              <ul>
                <li>
                  <code>SKILL.md</code>에서 기능 이름에 케밥 케이스(예: <code>{skillName || "frontend-design"}</code>)를 사용합니다
                </li>
                <li>
                  최상위 폴더에 <code>SKILL.md</code> 파일을 포함합니다
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <ol className="skill-guide-steps">
          <li>
            <span className="step-num">01</span>
            <div>
              <strong>SKILL.md 파일 다운로드 (또는 텍스트 복사)</strong>
              <p>
                각 스킬 페이지의 <strong>‘SKILL.md 파일 다운로드’</strong> 버튼을 누르면 케밥 케이스(<code>name: {skillName || "frontend-design"}</code>) 규격이 맞춰진 <code>SKILL.md</code> 파일이 바로 저장됩니다.
              </p>
            </div>
          </li>
          <li>
            <span className="step-num">02</span>
            <div>
              <strong>Gemini 좌측 메뉴 → [스킬] → [만들기] 클릭</strong>
              <p>
                Gemini 웹 화면에서 상단 또는 좌측의 <strong>[스킬(Skills)]</strong> 탭으로 이동한 뒤 우측의 <strong>[만들기] → [기능 업로드]</strong>를 누릅니다.
              </p>
            </div>
          </li>
          <li>
            <span className="step-num">03</span>
            <div>
              <strong>SKILL.md 파일 드래그 & 업로드 완료!</strong>
              <p>
                위 화면처럼 <strong>기능 업로드</strong> 창이 뜨면 다운로드한 <code>SKILL.md</code> 파일(또는 폴더)을 그대로 드래그해서 넣으세요. 물론 일반 프롬프트처럼 텍스트를 복사해 대화창에 바로 붙여넣어도 작동합니다!
              </p>
            </div>
          </li>
        </ol>

        <div className="skill-guide-footer">
          {skillBody && (
            <button type="button" className="skill-download-cta" onClick={downloadSampleSkill}>
              이 스킬 SKILL.md 파일 다운로드 ↓
            </button>
          )}
          <a
            href="https://gemini.google.com/app"
            target="_blank"
            rel="noopener noreferrer"
            className="skill-open-gemini-cta"
          >
            Gemini 열어서 스킬 등록해보기 ↗
          </a>
          <button type="button" className="skill-close-cta" onClick={onClose}>
            확인했어요
          </button>
        </div>
      </div>
    </div>
  );
}
