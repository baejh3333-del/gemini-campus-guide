import { KAKAO_PROMPT } from "./kakao";
import { INSTAGRAM_PROMPT } from "./instagram";
import { REPORT_PROMPT } from "./report";
import { EXAM_PROMPT } from "./exam";
import { PRESENTATION_PROMPT } from "./presentation";
import { TEAM_PROMPT } from "./team";
import { COVER_PROMPT } from "./cover";
import { GRADER_PROMPT } from "./grader";
import { TUTOR_PROMPT } from "./tutor";
import { REHEARSAL_PROMPT } from "./rehearsal";

export const ORIGINAL_PROMPTS = {
  "kakao-chat-tone": KAKAO_PROMPT,
  "instagram-feed-first-impression": INSTAGRAM_PROMPT,
  report: REPORT_PROMPT,
  exam: EXAM_PROMPT,
  presentation: PRESENTATION_PROMPT,
  team: TEAM_PROMPT,
  cover: COVER_PROMPT,
  "gem-grader": GRADER_PROMPT,
  "gem-tutor": TUTOR_PROMPT,
  "gem-rehearsal": REHEARSAL_PROMPT,
};
