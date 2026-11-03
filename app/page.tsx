import { Suspense } from "react";
import { PromptLibrary } from "@/components/PromptLibrary";
import { listPrompts } from "@/lib/prompt-library";
import { LoadingOrb } from "@/components/LoadingOrb";

export default async function Home() {
  const prompts = await listPrompts();
  return <Suspense fallback={<LoadingOrb />}><PromptLibrary prompts={prompts} /></Suspense>;
}
