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
import { platformCategories, platformStatuses } from "@/lib/constants";
import type { Platform } from "@/types/domain";
import { type PlatformInput, platformSchema } from "@/lib/validation/platform";

type PlatformFormProps = {
  mode: "create" | "edit";
  initialValues?: Partial<Platform>;
};

export function PlatformForm({ mode, initialValues }: PlatformFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<PlatformInput>({
    resolver: zodResolver(platformSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      slug: initialValues?.slug ?? "",
      website_url: initialValues?.website_url ?? "",
      category: initialValues?.category ?? "payment",
      country: initialValues?.country ?? "",
      status: initialValues?.status ?? "draft",
      summary: initialValues?.summary ?? "",
      internal_notes: initialValues?.internal_notes ?? "",
      last_reviewed_at: initialValues?.last_reviewed_at ?? null,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);

    const endpoint =
      mode === "create"
        ? "/api/platforms"
        : `/api/platforms/${initialValues?.id ?? ""}`;
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
      router.replace(
        mode === "create"
          ? `/admin/platforms/${payload?.id}`
          : `/admin/platforms/${initialValues?.id}`,
      );
      router.refresh();
    });
  });

  return (
    <form className="grid gap-6" onSubmit={onSubmit}>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Platform name</Label>
          <Input id="name" {...form.register("name")} />
          {form.formState.errors.name ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.name.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" {...form.register("slug")} />
          {form.formState.errors.slug ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.slug.message}
            </p>
          ) : null}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="website_url">Website URL</Label>
        <Input id="website_url" {...form.register("website_url")} />
        {form.formState.errors.website_url ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.website_url.message}
          </p>
        ) : null}
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            defaultValue={form.getValues("category")}
            onValueChange={(value) =>
              form.setValue("category", value as PlatformInput["category"], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {platformCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category.replaceAll("_", " ")}
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
              form.setValue("status", value as PlatformInput["status"], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {platformStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.replaceAll("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input id="country" {...form.register("country")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="summary">Summary</Label>
        <Textarea id="summary" rows={4} {...form.register("summary")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="internal_notes">Internal notes</Label>
        <Textarea
          id="internal_notes"
          rows={8}
          {...form.register("internal_notes")}
        />
      </div>
      {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {mode === "create"
            ? form.formState.isSubmitting
              ? "Creating..."
              : "Create platform"
            : form.formState.isSubmitting
              ? "Saving..."
              : "Save changes"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
