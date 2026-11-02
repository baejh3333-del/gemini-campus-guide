"use client";
import { useState } from "react";
import { SkillGuideModal } from "./SkillGuideModal";

export function LibraryCopy({
  body,
  kind,
  skillName,
}: {
  body: string;
  kind?: "prompt" | "gem" | "skill";
  skillName?: string;
}) {
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  async function copy(openedGemini = false) {
    try {
      await navigator.clipboard.writeText(body);
      setMessage(
        openedGemini
          ? "프롬프트를 자동 복사하고 Gemini를 열었어요! 열린 창에서 붙여넣기(Ctrl+V)만 누르세요."
          : "복사했어요. 바로 옆의 '자동 복사 후 Gemini 열기'를 눌러 붙여넣거나 SKILL.md 파일로 업로드해 보세요."
      );
      setDone(true);
      setTimeout(() => setDone(false), 3600);
    } catch {
      setMessage("자동 복사가 되지 않았어요. 위 본문을 길게 누르거나 선택해 복사해 주세요.");
    }
  }

  function downloadSkillFile() {
    const blob = new Blob([body], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "SKILL.md";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setMessage("SKILL.md 파일을 다운로드했어요! Gemini [스킬] → [기능 업로드]에 드래그해서 넣어보세요.");
  }

  return (
    <div className="library-copy-actions" data-copied={done ? "true" : undefined}>
      {kind === "skill" && (
        <div className="skill-action-bar">
          <div className="skill-action-info">
            <span className="skill-chip-badge">SKILL.md 파일 첨부 지원</span>
            <p>텍스트로 복사해 바로 써도 되고, 파일로 받아 Gemini [스킬]에 업로드해 쓸 수도 있어요!</p>
          </div>
          <div className="skill-action-btns">
            <button type="button" className="skill-dl-btn" onClick={downloadSkillFile}>
              SKILL.md 다운로드 ↓
            </button>
            <button type="button" className="skill-guide-trigger-btn" onClick={() => setGuideOpen(true)}>
              ❓ Gemini Skill 추가 가이드라인
            </button>
          </div>
        </div>
      )}

      <div className="library-primary-cta">
        <button type="button" onClick={() => copy(false)} className={done ? "is-done" : undefined}>
          {done ? "복사됨" : kind === "skill" ? "SKILL.md 텍스트 복사하기" : "프롬프트 복사하기"}{" "}
          <span aria-hidden="true">{done ? "✓" : "⧉"}</span>
        </button>
        <a
          className={`open-gemini-btn ${done ? "is-ready" : ""}`}
          href={
            body.length > 2000
              ? "https://gemini.google.com/app"
              : `https://gemini.google.com/app?q=${encodeURIComponent(body)}`
          }
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => copy(true)}
        >
          자동 복사 후 Gemini 열기 <span aria-hidden="true">↗</span>
        </a>
      </div>
      <p role="status">{message}</p>

      <SkillGuideModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        skillName={skillName}
        skillBody={body}
      />
    </div>
  );
}
