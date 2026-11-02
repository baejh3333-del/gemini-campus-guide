import { Suspense } from "react";
import { PromptLibrary } from "@/components/PromptLibrary";
import { listPrompts } from "@/lib/prompt-library";

export default async function Home() {
  const prompts = await listPrompts();
  return <Suspense fallback={<main className="library-page"><p>프롬프트를 불러오고 있어요.</p></main>}><PromptLibrary prompts={prompts} /></Suspense>;
}
