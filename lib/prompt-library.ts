import { LIBRARY_PROMPTS } from "@/content/prompts";

export const CATEGORIES = [
  "릴스·카드뉴스",
  "학업·공부",
  "일상·자기관리",
  "문서·오피스 (docx·pdf·pptx·xlsx)",
  "웹·디자인 (frontend·canvas)",
  "개발·자동화 (mcp·webapp-testing)",
  "글쓰기·리서치 (internal-comms)",
] as const;
export type Category = (typeof CATEGORIES)[number];
export type LibraryPrompt = {
  id: string;
  title: string;
  description: string;
  body: string;
  steps: string[];
  category: Category;
  kind: "prompt" | "gem" | "skill";
  skillName?: string;
  repoUrl?: string;
  skillNote?: string;
  source?: { kind: "릴스" | "카드뉴스"; number: number; url: string };
  thumbnail: {
    variant: "orbit" | "wave" | "sphere" | "portal" | "agent" | "curves" | "pills" | "axis";
    src?: string;
    alt?: string;
  };
  copyCount: number | null;
};

// Replace this adapter when moving content to a sheet; screens keep the same interface.
export interface PromptRepository {
  list(): Promise<LibraryPrompt[]>;
  find(id: string): Promise<LibraryPrompt | undefined>;
}
const repository: PromptRepository = {
  async list() { return LIBRARY_PROMPTS; },
  async find(id) { return LIBRARY_PROMPTS.find((prompt) => prompt.id === id); },
};
export const listPrompts = () => repository.list();
export const getPrompt = (id: string) => repository.find(id);
