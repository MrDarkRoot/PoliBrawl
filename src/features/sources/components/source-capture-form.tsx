"use client";

import { useActionState } from "react";

import {
  captureSourceByFetchAction,
  captureSourceByPasteAction,
  type SourceActionState,
} from "@/features/sources/actions/source.actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SourceListItem } from "@/types/polibrawl";

const initialSourceActionState: SourceActionState = {
  message: null,
  fieldErrors: {},
};

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

function ActionMessage({ state }: { state: SourceActionState }) {
  if (!state.message) {
    return null;
  }

  return <p className="text-sm text-destructive">{state.message}</p>;
}

export function SourceCaptureForm({ source }: { source: SourceListItem }) {
  const [fetchState, fetchAction, isFetchPending] = useActionState(
    captureSourceByFetchAction,
    initialSourceActionState,
  );
  const [pasteState, pasteAction, isPastePending] = useActionState(
    captureSourceByPasteAction,
    initialSourceActionState,
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Fetch URL</CardTitle>
          <CardDescription>
            Safe public URL capture only. Internal, private, and metadata addresses are
            blocked before fetch.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={fetchAction} className="space-y-4">
            <input type="hidden" name="source_id" value={source.id} />
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                name="url"
                defaultValue={source.url ?? ""}
                placeholder="https://example.com/policy"
                required
                type="url"
              />
              <FieldError state={fetchState} name="url" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fetch-title">Override Title</Label>
              <Input
                id="fetch-title"
                name="title"
                defaultValue={source.title}
                placeholder="Optional snapshot title"
              />
              <FieldError state={fetchState} name="title" />
            </div>
            <ActionMessage state={fetchState} />
            <Button type="submit" disabled={isFetchPending}>
              {isFetchPending ? "Fetching..." : "Fetch Source"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Paste Text</CardTitle>
          <CardDescription>
            Use this when fetch is not practical. Pasted content stays private and is
            stored as an admin-only snapshot.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={pasteAction} className="space-y-4">
            <input type="hidden" name="source_id" value={source.id} />
            <div className="space-y-2">
              <Label htmlFor="pasted_text">Pasted Text</Label>
              <Textarea
                id="pasted_text"
                name="pasted_text"
                rows={14}
                placeholder="Paste the policy or help-center text here."
                required
              />
              <FieldError state={pasteState} name="pasted_text" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="paste-title">Snapshot Title</Label>
                <Input
                  id="paste-title"
                  name="title"
                  defaultValue={source.title}
                  placeholder="Optional snapshot title"
                />
                <FieldError state={pasteState} name="title" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="original_url">Original URL</Label>
                <Input
                  id="original_url"
                  name="original_url"
                  defaultValue={source.url ?? ""}
                  placeholder="https://example.com/policy"
                  type="url"
                />
                <FieldError state={pasteState} name="original_url" />
              </div>
            </div>
            <ActionMessage state={pasteState} />
            <Button type="submit" disabled={isPastePending}>
              {isPastePending ? "Saving..." : "Save Pasted Snapshot"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
