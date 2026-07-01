"use client";

import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getSafeWordingWarnings } from "@/lib/evidence";
import { evidenceStatuses, evidenceVisibilityLevels } from "@/lib/constants";
import { evidenceSchema, type EvidenceInput } from "@/lib/validation/evidence";

export function EvidenceForm({
  signalId,
  initialValues,
}: {
  signalId: string;
  initialValues: Partial<EvidenceInput>;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<EvidenceInput>({
    resolver: zodResolver(evidenceSchema),
    defaultValues: {
      clause_id: initialValues.clause_id ?? null,
      policy_source_id: initialValues.policy_source_id ?? "",
      document_version_id: initialValues.document_version_id ?? null,
      clause_excerpt: initialValues.clause_excerpt ?? "",
      source_url: initialValues.source_url ?? "",
      document_title: initialValues.document_title ?? "",
      review_date:
        initialValues.review_date ?? new Date().toISOString().slice(0, 10),
      explanation: initialValues.explanation ?? "",
      why_it_matters: initialValues.why_it_matters ?? "",
      visibility: initialValues.visibility ?? "public",
      status: initialValues.status ?? "draft",
    },
  });
  const explanation = useWatch({
    control: form.control,
    name: "explanation",
  });
  const clauseExcerpt = useWatch({
    control: form.control,
    name: "clause_excerpt",
  });
  const whyItMatters = useWatch({
    control: form.control,
    name: "why_it_matters",
  });

  const warnings = useMemo(
    () =>
      getSafeWordingWarnings({
        explanation,
        whyItMatters,
      }),
    [explanation, whyItMatters],
  );

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    const response = await fetch(`/api/signals/${signalId}/evidence`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const payload = (await response.json().catch(() => null)) as
      | { error?: string; evidenceId?: string }
      | null;

    if (!response.ok || !payload?.evidenceId) {
      setServerError(payload?.error ?? "Unable to create evidence.");
      return;
    }

    startTransition(() => {
      router.replace(
        `/admin/signals/${signalId}/evidence/preview?evidenceId=${payload.evidenceId}`,
      );
      router.refresh();
    });
  });

  return (
    <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <form className="space-y-5" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="clause_excerpt">Clause excerpt</Label>
          <Textarea
            id="clause_excerpt"
            rows={8}
            {...form.register("clause_excerpt")}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="source_url">Source URL</Label>
            <Input id="source_url" {...form.register("source_url")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="document_title">Document title</Label>
            <Input id="document_title" {...form.register("document_title")} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="explanation">Explanation</Label>
          <Textarea id="explanation" rows={5} {...form.register("explanation")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="why_it_matters">Why it matters</Label>
          <Textarea
            id="why_it_matters"
            rows={5}
            {...form.register("why_it_matters")}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="review_date">Review date</Label>
            <Input id="review_date" type="date" {...form.register("review_date")} />
          </div>
          <div className="space-y-2">
            <Label>Visibility</Label>
            <Select
              defaultValue={form.getValues("visibility")}
              onValueChange={(value) =>
                form.setValue("visibility", value as EvidenceInput["visibility"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {evidenceVisibilityLevels.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              defaultValue={form.getValues("status")}
              onValueChange={(value) =>
                form.setValue("status", value as EvidenceInput["status"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {evidenceStatuses.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          Save evidence draft
        </Button>
      </form>
      <div className="space-y-4 rounded-[1.5rem] border border-border/70 bg-zinc-50 p-5">
        <div>
          <h3 className="text-lg font-semibold">Preview</h3>
          <p className="text-sm text-muted-foreground">
            Review wording and source attribution before publishing.
          </p>
        </div>
        {warnings.length ? (
          <div className="space-y-2 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
            {warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        ) : null}
        <div className="space-y-3 rounded-2xl border border-border/70 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Clause excerpt
          </p>
          <p className="text-sm leading-6">{clauseExcerpt}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Explanation
          </p>
          <p className="text-sm leading-6">{explanation}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Why it matters
          </p>
          <p className="text-sm leading-6">{whyItMatters}</p>
        </div>
      </div>
    </div>
  );
}
