"use client";
import { useRef, useState } from "react";
import type { Category } from "@/lib/prompt-library";
type Draft = { title: string; description: string; body: string; category: Category };
type Message = { role: "user" | "assistant"; text: string };
export default function PromptDraftAssistant({ onApply }: { onApply: (draft: Draft) => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState(false);
  const pending = useRef(false);
  async function send() {
    if (!input.trim() || pending.current) return;
    pending.current = true; setBusy(true); setError("");
    const next: Message[] = [...messages.slice(-8), { role: "user", text: input.trim() }];
    try {
      const r = await fetch("/api/prompt-draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next, currentDraft: draft }), signal: AbortSignal.timeout(35000) });
      const result = await r.json();
      if (!r.ok) throw new Error(result.error || "초안을 만들지 못했어요.");
      setMessages([...next, { role: "assistant", text: result.text }]);
      setDraft(result.draft); setApplied(false); setInput("");
    } catch (e) { setError(e instanceof Error ? e.message : "다시 시도해 주세요."); }
    finally { pending.current = false; setBusy(false); }
  }
  return <details className="draft-assistant" open><summary>✦ AI와 함께 내 프롬프트 만들기</summary><p>아이디어 한 줄이면 충분해요. AI가 구성·조건·출력 형식까지 채워 바로 초안을 만들어요. 초안을 보고 원하는 부분만 수정해 주세요.</p>
    <div className="draft-conversation" role="log" aria-live="polite">{messages.map((m,i) => <p key={i}><strong>{m.role === "user" ? "나" : "AI"}</strong> · {m.text}</p>)}</div>
    <label htmlFor="draft-request">아이디어 한 줄 또는 수정하고 싶은 점</label><textarea id="draft-request" value={input} maxLength={1500} onChange={e => setInput(e.target.value)} placeholder="예: 교수님께 정중하게 성적 확인을 요청하는 이메일용 프롬프트를 만들어줘" rows={3} />
    <button type="button" disabled={busy || !input.trim()} onClick={send}>{busy ? "초안을 준비하고 있어요…" : "AI가 초안 만들기"}</button>
    {error && <p role="alert">{error}</p>}
    {draft && <div className="draft-preview"><h4>{draft.title}</h4><p>{draft.description}</p><pre>{draft.body}</pre><button type="button" disabled={busy} onClick={() => { onApply(draft); setApplied(true); }}>이 초안을 작성 폼에 적용</button>{applied && <p role="status">작성 폼에 적용했어요. 내용을 확인하고 공유 버튼을 눌러 주세요.</p>}<p>적용하면 작성 중인 제목·설명·본문·카테고리가 이 초안으로 바뀝니다. 공유는 직접 결정해 주세요.</p></div>}
  </details>;
}
