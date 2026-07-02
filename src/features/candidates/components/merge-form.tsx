"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { processReviewAction, type ReviewActionState } from "@/features/candidates/actions/review.actions";
import { Textarea } from "@/components/ui/textarea";
import type { RedFlagCandidate } from "@/types/polibrawl";
import { useRouter } from "next/navigation";

const initialState: ReviewActionState = { message: null, error: null, success: false };

export function MergeForm({
  sourceCandidateId,
  potentialTargets,
}: {
  sourceCandidateId: string;
  potentialTargets: RedFlagCandidate[];
}) {
  const [state, formAction, isPending] = useActionState(processReviewAction, initialState);
  const [selectedTargetId, setSelectedTargetId] = useState<string>("");
  const router = useRouter();

  if (state.success) {
    router.push("/admin/candidates");
    return null;
  }

  const selectedTarget = potentialTargets.find(t => t.id === selectedTargetId);

  return (
    <div className="space-y-6">
      {state.error && <p className="text-sm text-destructive font-medium">{state.error}</p>}
      
      <div className="space-y-3">
        <label className="text-sm font-medium">Select target to merge into:</label>
        <div className="grid gap-2">
          {potentialTargets.map(t => (
            <label 
              key={t.id} 
              className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 ${selectedTargetId === t.id ? "ring-2 ring-primary border-primary bg-primary/5" : "border-border"}`}
            >
              <input 
                type="radio" 
                name="targetCandidateId" 
                value={t.id} 
                checked={selectedTargetId === t.id}
                onChange={() => setSelectedTargetId(t.id)}
                className="mt-1"
              />
              <div className="space-y-1">
                <p className="text-sm font-semibold">{t.headline}</p>
                <div className="flex flex-wrap gap-1">
                  {t.matched_keywords.map(kw => (
                    <span key={kw} className="rounded-full bg-zinc-100 border px-1.5 py-0.5 text-[10px] text-zinc-600">{kw}</span>
                  ))}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {selectedTarget && (
        <form action={formAction} className="space-y-4 pt-4 border-t">
          <input type="hidden" name="candidateId" value={sourceCandidateId} />
          <input type="hidden" name="action" value="merge" />
          <input type="hidden" name="targetCandidateId" value={selectedTargetId} />
          
          <div>
            <label className="text-sm font-medium">Merge Note</label>
            <Textarea name="note" placeholder="Optional note about this merge" className="mt-1" />
          </div>

          <Button type="submit" disabled={isPending || !selectedTargetId}>
            Confirm Merge
          </Button>
        </form>
      )}
    </div>
  );
}
