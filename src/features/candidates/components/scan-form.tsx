"use client";

import { useActionState } from "react";

import {
  scanSourceSnapshotAction,
  type ScanActionState,
} from "@/features/candidates/actions/scanner.actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { ScanSnapshotResult } from "@/types/polibrawl";

const initialState: ScanActionState = {
  message: null,
  result: null,
  error: null,
};

function ScanSummary({ result }: { result: ScanSnapshotResult }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: "Matches Found", value: result.totalMatchesFound },
          { label: "Matches Inserted", value: result.matchesInserted },
          { label: "Duplicates Skipped", value: result.duplicatesSkipped },
          { label: "Candidates Created", value: result.candidatesCreated },
          { label: "Categories Found", value: result.categoriesFound.length },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-border/60 bg-muted/30 p-3"
          >
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {result.categoriesFound.length > 0 && (
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">
            Categories with matches
          </p>
          <div className="flex flex-wrap gap-2">
            {result.categoriesFound.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs font-medium text-white"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      )}

      {result.warnings.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm font-medium text-amber-800">Warnings</p>
          <ul className="mt-1 space-y-1 text-sm text-amber-700">
            {result.warnings.map((w, i) => (
              <li key={i}>• {w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function ScanForm({
  sourceSnapshotId,
}: {
  sourceSnapshotId: string;
}) {
  const [state, formAction, isPending] = useActionState(
    scanSourceSnapshotAction,
    initialState,
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Run Keyword Scanner</CardTitle>
          <CardDescription>
            Scans the snapshot&apos;s extracted text against the red‑flag
            taxonomy. Deduplicates on rerun. Admin‑only — nothing is published.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <input
              type="hidden"
              name="sourceSnapshotId"
              value={sourceSnapshotId}
            />

            <div className="flex items-center gap-3">
              <Checkbox
                id="createCandidates"
                name="createCandidates"
                defaultChecked
                value="true"
              />
              <Label htmlFor="createCandidates" className="cursor-pointer">
                Create bounded red-flag candidates (one per category)
              </Label>
            </div>

            {state.error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.error}
              </p>
            )}

            <Button type="submit" disabled={isPending} className="min-w-36">
              {isPending ? "Scanning…" : "Run Keyword Scanner"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {state.message && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800">{state.message}</p>
        </div>
      )}

      {state.result && <ScanSummary result={state.result} />}
    </div>
  );
}
