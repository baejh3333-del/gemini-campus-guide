"use client";
import { useState } from "react";
import { SkillGuideModal } from "./SkillGuideModal";

const COPY_SUCCESS_MESSAGE = "복사했어요. 원하는 곳에 붙여넣으세요.";

export function LibraryCopy({
  body,
  kind,
  skillName,
  fullTextId,
}: {
  body: string;
  kind?: "prompt" | "gem" | "skill";
  skillName?: string;
  fullTextId?: string;
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
          : COPY_SUCCESS_MESSAGE
      );
      setDone(true);
      setTimeout(() => setDone(false), 3600);
    } catch {
      const fullText = fullTextId ? document.getElementById(fullTextId) : null;
      if (fullText instanceof HTMLDetailsElement) {
        fullText.open = true;
        setMessage("자동 복사가 되지 않아 전문을 펼쳤어요. 본문을 길게 누르거나 선택해 복사해 주세요.");
      } else {
        setMessage("자동 복사가 되지 않았어요. 위 본문을 길게 누르거나 선택해 복사해 주세요.");
      }
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
      {kind === "skill" ? (
        <div className="skill-action-bar">
          <div className="skill-action-info">
            <p>내용을 복사하거나, 파일을 내려받아 Gemini의 스킬 메뉴에 업로드하세요.</p>
          </div>
          <div className="skill-action-btns">
            <button type="button" className="skill-dl-btn" onClick={downloadSkillFile}>
              다운로드 <span aria-hidden="true">↓</span>
            </button>
            <button type="button" onClick={() => copy()} className={done ? "is-done" : undefined}>
              {done ? "복사됨" : "복사"} <span aria-hidden="true">{done ? "✓" : "⧉"}</span>
            </button>
            <button type="button" className="skill-guide-trigger-btn" onClick={() => setGuideOpen(true)}>
              사용법
            </button>
          </div>
        </div>
      ) : (
        <div className="library-primary-cta">
          <button type="button" onClick={() => copy(false)} className={done ? "is-done" : undefined}>
            {done ? "복사됨" : "프롬프트 복사하기"}{" "}
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
      )}
      <div className="library-copy-feedback">
        <p role="status">{message}</p>
        {kind === "skill" && message === COPY_SUCCESS_MESSAGE && (
          <a
            className="open-gemini-btn"
            href="https://gemini.google.com/app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Gemini 바로가기 <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>

      <SkillGuideModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        skillName={skillName}
        skillBody={body}
      />
    </div>
  );
}
