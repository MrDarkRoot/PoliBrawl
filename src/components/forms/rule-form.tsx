"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { signalCategories, signalLevels } from "@/lib/constants";
import { ruleSchema, type RuleInput } from "@/lib/validation/rule";

type RuleFormValues = Omit<RuleInput, "keywords" | "regex_patterns"> & {
  keywordsText: string;
  regexPatternsText: string;
};

function parseList(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function RuleForm({
  mode,
  initialValues,
}: {
  mode: "create" | "edit";
  initialValues?: Partial<RuleInput> & { id?: string };
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<RuleFormValues>({
    defaultValues: {
      rule_name: initialValues?.rule_name ?? "",
      category: initialValues?.category ?? "money_control",
      signal_name: initialValues?.signal_name ?? "",
      keywordsText: Array.isArray(initialValues?.keywords)
        ? initialValues.keywords.join("\n")
        : "",
      regexPatternsText: Array.isArray(initialValues?.regex_patterns)
        ? initialValues.regex_patterns.join("\n")
        : "",
      suggested_level: initialValues?.suggested_level ?? "unknown",
      confidence_weight: initialValues?.confidence_weight ?? 0.5,
      false_positive_notes: initialValues?.false_positive_notes ?? "",
      enabled: initialValues?.enabled ?? true,
    },
  });
  const enabled = useWatch({
    control: form.control,
    name: "enabled",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);

    const payload = ruleSchema.safeParse({
      ...values,
      keywords: parseList(values.keywordsText),
      regex_patterns: parseList(values.regexPatternsText),
      false_positive_notes: values.false_positive_notes || null,
    });

    if (!payload.success) {
      setServerError(payload.error.issues[0]?.message ?? "Invalid rule.");
      return;
    }

    const endpoint = mode === "create" ? "/api/rules" : `/api/rules/${initialValues?.id}`;
    const response = await fetch(endpoint, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload.data),
    });

    const result = (await response.json().catch(() => null)) as
      | { error?: string; id?: string }
      | null;

    if (!response.ok) {
      setServerError(result?.error ?? "Request failed.");
      return;
    }

    startTransition(() => {
      router.replace(`/admin/rules/${result?.id ?? initialValues?.id}/edit`);
      router.refresh();
    });
  });

  return (
    <form className="grid gap-6" onSubmit={onSubmit}>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="rule_name">Rule name</Label>
          <Input id="rule_name" {...form.register("rule_name")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signal_name">Signal name</Label>
          <Input id="signal_name" {...form.register("signal_name")} />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            defaultValue={form.getValues("category")}
            onValueChange={(value) =>
              form.setValue("category", value as RuleFormValues["category"])
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
        <div className="space-y-2">
          <Label>Suggested level</Label>
          <Select
            defaultValue={form.getValues("suggested_level")}
            onValueChange={(value) =>
              form.setValue(
                "suggested_level",
                value as RuleFormValues["suggested_level"],
              )
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
          <Label htmlFor="confidence_weight">Confidence weight</Label>
          <Input
            id="confidence_weight"
            type="number"
            step="0.01"
            min="0"
            max="1"
            {...form.register("confidence_weight", { valueAsNumber: true })}
          />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="keywordsText">Keywords</Label>
          <Textarea id="keywordsText" rows={8} {...form.register("keywordsText")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="regexPatternsText">Regex patterns</Label>
          <Textarea
            id="regexPatternsText"
            rows={8}
            {...form.register("regexPatternsText")}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="false_positive_notes">False positive notes</Label>
        <Textarea
          id="false_positive_notes"
          rows={5}
          {...form.register("false_positive_notes")}
        />
      </div>
      <label className="flex items-center gap-3 rounded-2xl border border-border/70 p-4">
        <Checkbox
          checked={enabled}
          onCheckedChange={(checked) => form.setValue("enabled", checked === true)}
        />
        <div>
          <p className="text-sm font-medium">Rule enabled</p>
          <p className="text-sm text-muted-foreground">
            Disabled rules do not generate signal candidates.
          </p>
        </div>
      </label>
      {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {mode === "create" ? "Create rule" : "Save rule"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
