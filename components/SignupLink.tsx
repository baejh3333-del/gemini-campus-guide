"use client";

import type { ComponentProps } from "react";
import { track } from "@/lib/analytics";

type SignupLinkProps = Omit<ComponentProps<"a">, "href" | "onClick"> & {
  source: "header" | "capsule_result" | "prompt_detail";
};

export function SignupLink({ source, children, ...props }: SignupLinkProps) {
  return (
    <a
      {...props}
      href={process.env.NEXT_PUBLIC_SIGNUP_URL || "https://goo.gle/kangwonchuncheon"}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track("signup_click", { source })}
    >
      {children}
    </a>
  );
}
