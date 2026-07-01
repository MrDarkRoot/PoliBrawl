"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { documentTypes, sourceStatuses, sourceTiers } from "@/lib/constants";
import { sourceSchema, type SourceInput } from "@/lib/validation/source";

export function SourceForm({
  mode,
  platformOptions,
  initialValues,
}: {
  mode: "create" | "edit";
  platformOptions: Array<{ id: string; name: string }>;
  initialValues?: Partial<SourceInput> & { id?: string };
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<SourceInput>({
    resolver: zodResolver(sourceSchema),
    defaultValues: {
      platform_id: initialValues?.platform_id ?? platformOptions[0]?.id ?? "",
      title: initialValues?.title ?? "",
      url: initialValues?.url ?? "",
      final_url: initialValues?.final_url ?? "",
      document_type: initialValues?.document_type ?? "terms_of_service",
      source_tier: initialValues?.source_tier ?? "tier_1_core",
      use_for_scoring: initialValues?.use_for_scoring ?? false,
      monitor_enabled: initialValues?.monitor_enabled ?? false,
      status: initialValues?.status ?? "active",
      last_reviewed_at: initialValues?.last_reviewed_at ?? null,
    },
  });
  const monitorEnabled = useWatch({
    control: form.control,
    name: "monitor_enabled",
  });
  const useForScoring = useWatch({
    control: form.control,
    name: "use_for_scoring",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    const endpoint =
      mode === "create" ? "/api/sources" : `/api/sources/${initialValues?.id}`;
    const method = mode === "create" ? "POST" : "PATCH";

    const response = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const payload = (await response.json().catch(() => null)) as
      | { error?: string; id?: string }
      | null;

    if (!response.ok) {
      setServerError(payload?.error ?? "Request failed.");
      return;
    }

    startTransition(() => {
      router.replace(`/admin/sources/${payload?.id ?? initialValues?.id}`);
      router.refresh();
    });
  });

  return (
    <form className="grid gap-6" onSubmit={onSubmit}>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Platform</Label>
          <Select
            defaultValue={form.getValues("platform_id")}
            onValueChange={(value) =>
              form.setValue("platform_id", value ?? "", { shouldValidate: true })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {platformOptions.map((platform) => (
                <SelectItem key={platform.id} value={platform.id}>
                  {platform.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" {...form.register("title")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="url">URL</Label>
        <Input id="url" {...form.register("url")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="final_url">Final URL</Label>
        <Input id="final_url" {...form.register("final_url")} />
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Document type</Label>
          <Select
            defaultValue={form.getValues("document_type")}
            onValueChange={(value) =>
              form.setValue(
                "document_type",
                (value ?? "terms_of_service") as SourceInput["document_type"],
                {
                  shouldValidate: true,
                },
              )
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {documentTypes.map((value) => (
                <SelectItem key={value} value={value}>
                  {value.replaceAll("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Source tier</Label>
          <Select
            defaultValue={form.getValues("source_tier")}
            onValueChange={(value) =>
              form.setValue(
                "source_tier",
                (value ?? "tier_1_core") as SourceInput["source_tier"],
                {
                  shouldValidate: true,
                },
              )
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sourceTiers.map((value) => (
                <SelectItem key={value} value={value}>
                  {value.replaceAll("_", " ")}
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
              form.setValue(
                "status",
                (value ?? "active") as SourceInput["status"],
                {
                  shouldValidate: true,
                },
              )
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sourceStatuses.map((value) => (
                <SelectItem key={value} value={value}>
                  {value.replaceAll("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex items-center gap-3 rounded-2xl border border-border/70 p-4">
          <Checkbox
            checked={monitorEnabled}
            onCheckedChange={(checked) =>
              form.setValue("monitor_enabled", checked === true)
            }
          />
          <div>
            <p className="text-sm font-medium">Monitor source</p>
            <p className="text-sm text-muted-foreground">
              Detect future hash changes for this source.
            </p>
          </div>
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-border/70 p-4">
          <Checkbox
            checked={useForScoring}
            onCheckedChange={(checked) =>
              form.setValue("use_for_scoring", checked === true)
            }
          />
          <div>
            <p className="text-sm font-medium">Use for scoring</p>
            <p className="text-sm text-muted-foreground">
              Mark this source as editorially scoreable.
            </p>
          </div>
        </label>
      </div>
      {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {mode === "create" ? "Create source" : "Save source"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
