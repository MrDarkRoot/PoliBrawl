"use client";

import { useState, useTransition } from "react";
import { ClipboardCheck, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

export function DecisionCopyButton({
  text,
  label,
  copiedLabel,
}: {
  text: string;
  label: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        });
      }}
    >
      {copied ? (
        <ClipboardCheck className="mr-2 h-4 w-4" aria-hidden="true" />
      ) : (
        <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
      )}
      {copied ? copiedLabel : label}
    </Button>
  );
}
