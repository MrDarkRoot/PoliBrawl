"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createSourceAction,
  type SourceActionState,
  updateSourceAction,
} from "@/features/sources/actions/source.actions";
import {
  sourcePriorities,
  sourceStatuses,
  sourceTypes,
  type Source,
} from "@/types/polibrawl";

type PlatformOption = {
  id: string;
  name: string;
};

type SourceFormProps = {
  mode: "create" | "edit";
  platformOptions: PlatformOption[];
  initialValues?: Source;
};

const initialSourceActionState: SourceActionState = {
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
  state: SourceActionState;
  name: string;
}) {
  const message = state.fieldErrors[name]?.[0];

  if (!message) {
    return null;
  }

  return <p className="text-sm text-destructive">{message}</p>;
}

export function SourceForm({
  mode,
  platformOptions,
  initialValues,
}: SourceFormProps) {
  const action =
    mode === "create"
      ? createSourceAction
      : updateSourceAction.bind(null, initialValues?.id ?? "");

  const [state, formAction, isPending] = useActionState(
    action,
    initialSourceActionState,
  );

  return (
    <form action={formAction} className="grid gap-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="platform_id">Platform</Label>
          <select
            id="platform_id"
            name="platform_id"
            defaultValue={initialValues?.platform_id ?? platformOptions[0]?.id ?? ""}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
            required
          >
            {platformOptions.map((platform) => (
              <option key={platform.id} value={platform.id}>
                {platform.name}
              </option>
            ))}
          </select>
          <FieldError state={state} name="platform_id" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            defaultValue={initialValues?.title ?? ""}
            required
          />
          <FieldError state={state} name="title" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="url">Source URL</Label>
          <Input
            id="url"
            name="url"
            defaultValue={initialValues?.url ?? ""}
            type="url"
            placeholder="https://example.com/policy"
          />
          <p className="text-xs text-muted-foreground">
            Leave blank only if this source will be captured by paste.
          </p>
          <FieldError state={state} name="url" />
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
          <Label htmlFor="source_type">Source Type</Label>
          <select
            id="source_type"
            name="source_type"
            defaultValue={initialValues?.source_type ?? "terms"}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
          >
            {sourceTypes.map((sourceType) => (
              <option key={sourceType} value={sourceType}>
                {sourceType.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <FieldError state={state} name="source_type" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <select
            id="priority"
            name="priority"
            defaultValue={initialValues?.priority ?? "supporting"}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
          >
            {sourcePriorities.map((priority) => (
              <option key={priority} value={priority}>
                {priority.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <FieldError state={state} name="priority" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={initialValues?.status ?? "draft"}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
          >
            {sourceStatuses.map((status) => (
              <option key={status} value={status}>
                {status.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <FieldError state={state} name="status" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={initialValues?.notes ?? ""}
          rows={8}
        />
        <FieldError state={state} name="notes" />
      </div>

      {state.message ? (
        <p className="text-sm text-destructive">{state.message}</p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {mode === "create"
            ? isPending
              ? "Creating..."
              : "Create Source"
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
