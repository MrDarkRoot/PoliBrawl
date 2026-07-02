"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { processReviewAction, type ReviewActionState } from "@/features/candidates/actions/review.actions";
import { Textarea } from "@/components/ui/textarea";

const initialState: ReviewActionState = { message: null, error: null, success: false };

export function ReviewActions({
  candidateId,
  currentStatus,
}: {
  candidateId: string;
  currentStatus: string;
}) {
  const [state, formAction, isPending] = useActionState(processReviewAction, initialState);
  const [rejectMode, setRejectMode] = useState(false);

  if (currentStatus === "approved" || currentStatus === "merged" || currentStatus === "rejected") {
    return <div className="text-sm text-muted-foreground">This candidate has been finalized ({currentStatus}).</div>;
  }

  return (
    <div className="space-y-4">
      {state.error && <p className="text-sm text-destructive font-medium">{state.error}</p>}
      {state.message && <p className="text-sm text-green-600 font-medium">{state.message}</p>}

      {currentStatus === "pending" && (
        <form action={formAction}>
          <input type="hidden" name="candidateId" value={candidateId} />
          <input type="hidden" name="action" value="start" />
          <Button type="submit" disabled={isPending}>Start Review</Button>
        </form>
      )}

      {currentStatus === "reviewing" && !rejectMode && (
        <div className="flex gap-2 flex-wrap">
          <form action={formAction}>
            <input type="hidden" name="candidateId" value={candidateId} />
            <input type="hidden" name="action" value="approve" />
            <input type="hidden" name="note" value="Approved from UI" />
            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isPending}>Approve</Button>
          </form>
          
          <Button variant="destructive" onClick={() => setRejectMode(true)} disabled={isPending}>Reject</Button>
          
          <form action={formAction}>
            <input type="hidden" name="candidateId" value={candidateId} />
            <input type="hidden" name="action" value="pending" />
            <Button type="submit" variant="outline" disabled={isPending}>Back to Pending</Button>
          </form>

          {/* Merge button requires opening a dialog, we will just stub it as a link to merge page for now */}
        </div>
      )}

      {rejectMode && (
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="candidateId" value={candidateId} />
          <input type="hidden" name="action" value="reject" />
          <Textarea name="reason" placeholder="Enter reject reason (required)" required />
          <div className="flex gap-2">
            <Button type="submit" variant="destructive" disabled={isPending}>Confirm Reject</Button>
            <Button type="button" variant="outline" onClick={() => setRejectMode(false)} disabled={isPending}>Cancel</Button>
          </div>
        </form>
      )}
    </div>
  );
}
