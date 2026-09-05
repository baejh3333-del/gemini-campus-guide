// GA4 이벤트. 캠페인 KPI 와 1:1 대응한다.
//   방문 2,500  -> page_view (GA 자동)
//   사인업 760  -> signup_click / signup_confirmed
//   프롬프트 학습 30% -> step_complete { step: "prompt" }
//   완주        -> quiz_pass / entry_submit
//   이탈 분석   -> step_start (스텝별 드롭오프)

type Params = Record<string, string | number | boolean>;

declare global {
  interface Window {
    gtag?: (command: string, event: string, params?: Params) => void;
  }
}

export type EventName =
  | "step_start"
  | "step_complete"
  | "prompt_copy"
  | "gemini_open"
  | "signup_click"
  | "signup_confirmed"
  | "quiz_submit"
  | "quiz_pass"
  | "progress_reset"
  | "task_pick"
  | "entry_submit"
  | "cert_share"
  | "tool_card_view";

export function track(name: EventName, params: Params = {}): void {
  if (typeof window === "undefined") return;
  try {
    window.gtag?.("event", name, params);
  } catch {
    // 계측 실패가 학습을 막아서는 안 된다.
  }
}
