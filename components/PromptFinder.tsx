"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Entry = { id: string; title: string; description: string; category: string };
type Message = { role: "user" | "assistant"; text: string; results?: Entry[] };
const welcome: Message = { role: "assistant", text: "어떤 작업에 쓸 프롬프트를 찾으세요? 목적과 원하는 결과물을 알려주세요. 저장소에 등록된 프롬프트만 찾아드려요. 막막하다면 ‘질문하면서 찾아줘’라고 말해 주세요. 용도부터 함께 정리해 드릴게요." };


export default function PromptFinder() {
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const dialog = useRef<HTMLDialogElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) { dialog.current?.showModal(); field.current?.focus(); }
    else { dialog.current?.close(); }
  }, [open]);
  useEffect(() => { if (open) end.current?.scrollIntoView({ block: "nearest" }); }, [messages, open]);
  function close() { setOpen(false); launcher.current?.focus(); }
  async function send(text: string) {
    const query = text.trim().slice(0, 500);
    if (!query || pending.current) return;
    pending.current = true;
    setBusy(true);
    const history: Message[] = [...messages.slice(-10), { role: "user", text: query }];
    setMessages(history);
    setInput("");
    try {
      const response = await fetch("/api/prompt-finder", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.map(({role, text}) => ({role, text})) }),
        signal: AbortSignal.timeout(35000),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "응답을 받지 못했어요.");
      setMessages(previous => [...previous, { role: "assistant", text: result.text, results: result.results }]);
    } catch (error) {
      setMessages(previous => [...previous, { role: "assistant", text: error instanceof Error ? error.message : "연결이 원활하지 않아요. 다시 시도해 주세요." }]);
      setInput(query);
    } finally { pending.current = false; setBusy(false); }
  }

  return <>
    <button ref={launcher} className="finder-launcher" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open} aria-controls="prompt-finder">✦ 프롬프트 찾기</button>
    <dialog ref={dialog} id="prompt-finder" className="finder-dialog" aria-labelledby="finder-title" onCancel={close} onClick={e => { if(e.target === e.currentTarget) close(); }}>
      <div className="finder-shell">
        <header className="finder-header"><div><h2 id="finder-title">✦ 프롬프트 찾기 도우미</h2><p>저장소 전용 · OpenAI</p></div><button onClick={close} aria-label="대화창 닫기">✕</button></header>
        <div className="finder-messages" role="log" aria-live="polite" aria-relevant="additions">
          {messages.map((m,i) => <div key={i} className={`finder-message is-${m.role}`}><span className="finder-speaker">{m.role === "user" ? "나" : "도우미"}</span><p>{m.text}</p>{m.results?.map(p => <Link key={p.id} href={`/prompts/${encodeURIComponent(p.id)}`} onClick={close} className="finder-result"><strong>{p.title} ↗</strong><span>{p.description}</span></Link>)}</div>)}{busy && <p role="status">맞는 프롬프트를 찾고 있어요…</p>}<div ref={end} />
        </div>
        <div className="finder-suggestions">{["질문하면서 찾아줘", "발표 슬라이드", "시험 예상문제"].map(t => <button disabled={busy} key={t} onClick={() => send(t)}>{t}</button>)}<button disabled={busy} onClick={() => setMessages([welcome])}>대화 초기화</button></div>
        <form className="finder-form" onSubmit={e => { e.preventDefault(); send(input); }}><label className="sr-only" htmlFor="finder-input">찾고 싶은 프롬프트 설명</label><input ref={field} id="finder-input" value={input} onChange={e => setInput(e.target.value)} placeholder="어떤 작업을 하고 싶으세요?" maxLength={500} autoComplete="off" /><button type="submit" disabled={busy || !input.trim()}>찾기</button></form>
      </div>
    </dialog>
  </>;
}
