"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createPlatformAction,
  type PlatformActionState,
  updatePlatformAction,
} from "@/features/platforms/actions/platform.actions";
import {
  platformCategories,
  platformStatuses,
  redFlagLevels,
  type Platform,
} from "@/types/polibrawl";

type PlatformFormProps = {
  mode: "create" | "edit";
  initialValues?: Platform;
};

const initialPlatformActionState: PlatformActionState = {
  message: null,
  fieldErrors: {},
};

function formatDateTimeLocal(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const normalized = new Date(date.getTime() - offset * 60_000);
  return normalized.toISOString().slice(0, 16);
}

function FieldError({
  state,
  name,
}: {
  state: PlatformActionState;
  name: string;
}) {
  const message = state.fieldErrors[name]?.[0];

  if (!message) {
    return null;
  }

  return <p className="text-sm text-destructive">{message}</p>;
}

export function PlatformForm({ mode, initialValues }: PlatformFormProps) {
  const action =
    mode === "create"
      ? createPlatformAction
      : updatePlatformAction.bind(null, initialValues?.id ?? "");

  const [state, formAction, isPending] = useActionState(
    action,
    initialPlatformActionState,
  );

  return (
    <form action={formAction} className="grid gap-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            defaultValue={initialValues?.name ?? ""}
            required
          />
          <FieldError state={state} name="name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            name="slug"
            defaultValue={initialValues?.slug ?? ""}
            required
          />
          <p className="text-xs text-muted-foreground">
            Use lowercase kebab-case, for example `paypal`.
          </p>
          <FieldError state={state} name="slug" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="website_url">Website URL</Label>
          <Input
            id="website_url"
            name="website_url"
            defaultValue={initialValues?.website_url ?? ""}
            required
            type="url"
          />
          <FieldError state={state} name="website_url" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_reviewed_at">Last Reviewed At</Label>
          <Input
            id="last_reviewed_at"
            name="last_reviewed_at"
            defaultValue={formatDateTimeLocal(initialValues?.last_reviewed_at)}
            type="datetime-local"
          />
          <FieldError state={state} name="last_reviewed_at" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            name="category"
            defaultValue={initialValues?.category ?? "payment"}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
          >
            {platformCategories.map((category) => (
              <option key={category} value={category}>
                {category.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <FieldError state={state} name="category" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={initialValues?.status ?? "draft"}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
          >
            {platformStatuses.map((status) => (
              <option key={status} value={status}>
                {status.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <FieldError state={state} name="status" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="main_level">Main Level</Label>
          <select
            id="main_level"
            name="main_level"
            defaultValue={initialValues?.main_level ?? ""}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
          >
            <option value="">Not set</option>
            {redFlagLevels.map((level) => (
              <option key={level} value={level}>
                {level.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <FieldError state={state} name="main_level" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="summary">Summary</Label>
        <Textarea
          id="summary"
          name="summary"
          defaultValue={initialValues?.summary ?? ""}
          rows={5}
        />
        <FieldError state={state} name="summary" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="internal_notes">Internal Notes</Label>
        <Textarea
          id="internal_notes"
          name="internal_notes"
          defaultValue={initialValues?.internal_notes ?? ""}
          rows={8}
        />
        <FieldError state={state} name="internal_notes" />
      </div>

      {state.message ? (
        <p className="text-sm text-destructive">{state.message}</p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {mode === "create"
            ? isPending
              ? "Creating..."
              : "Create Platform"
            : isPending
              ? "Saving..."
              : "Save Changes"}
        </Button>
        <Button type="button" variant="outline" onClick={() => history.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
