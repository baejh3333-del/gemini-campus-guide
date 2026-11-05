import { Suspense } from "react";
import { PromptLibrary } from "@/components/PromptLibrary";
import { listPrompts } from "@/lib/prompt-library";
import Loading from "./loading";

export default async function Home() {
  const prompts = await listPrompts();
  return <Suspense fallback={<Loading />}><PromptLibrary prompts={prompts} /></Suspense>;
}
