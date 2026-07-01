"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { signalCategories, signalConfidenceLevels, signalLevels } from "@/lib/constants";
import {
  signalApprovalSchema,
  type SignalApprovalInput,
} from "@/lib/validation/evidence";

export function SignalApprovalForm({
  candidateId,
  initialValues,
}: {
  candidateId: string;
  initialValues: Partial<SignalApprovalInput>;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<SignalApprovalInput>({
    resolver: zodResolver(signalApprovalSchema),
    defaultValues: {
      name: initialValues.name ?? "",
      category: initialValues.category ?? "money_control",
      level: initialValues.level ?? "unknown",
      confidence: initialValues.confidence ?? "medium",
      explanation: initialValues.explanation ?? "",
      internal_reason: initialValues.internal_reason ?? "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);

    const response = await fetch(`/api/signal-candidates/${candidateId}/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const payload = (await response.json().catch(() => null)) as
      | { error?: string; signalId?: string }
      | null;

    if (!response.ok || !payload?.signalId) {
      setServerError(payload?.error ?? "Unable to approve signal.");
      return;
    }

    startTransition(() => {
      router.replace(`/admin/signals/${payload.signalId}?candidate=${candidateId}`);
      router.refresh();
    });
  });

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Signal name</Label>
          <Input id="name" {...form.register("name")} />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            defaultValue={form.getValues("category")}
            onValueChange={(value) =>
              form.setValue("category", value as SignalApprovalInput["category"])
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {signalCategories.map((value) => (
                <SelectItem key={value} value={value}>
                  {value.replaceAll("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Level</Label>
          <Select
            defaultValue={form.getValues("level")}
            onValueChange={(value) =>
              form.setValue("level", value as SignalApprovalInput["level"])
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {signalLevels.map((value) => (
                <SelectItem key={value} value={value}>
                  {value.replaceAll("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Confidence</Label>
          <Select
            defaultValue={form.getValues("confidence")}
            onValueChange={(value) =>
              form.setValue(
                "confidence",
                value as SignalApprovalInput["confidence"],
              )
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {signalConfidenceLevels.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="explanation">Explanation</Label>
        <Textarea id="explanation" rows={5} {...form.register("explanation")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="internal_reason">Internal notes</Label>
        <Textarea id="internal_reason" rows={5} {...form.register("internal_reason")} />
      </div>
      {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}
      <Button type="submit" disabled={form.formState.isSubmitting}>
        Approve signal
      </Button>
    </form>
  );
}
