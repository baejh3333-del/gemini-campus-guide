import { notFound } from "next/navigation";
import { STEPS, stepById } from "@/content/steps";
import { StepRunner } from "@/components/StepRunner";

export function generateStaticParams() {
  return STEPS.map((s) => ({ step: s.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step } = await params;
  const s = stepById(step);
  return { title: s ? `STEP ${s.n}. ${s.title} | 15분 제미나이` : "학습" };
}

export default async function StepPage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step } = await params;
  const s = stepById(step);
  if (!s) notFound();
  return <StepRunner step={s} />;
}
