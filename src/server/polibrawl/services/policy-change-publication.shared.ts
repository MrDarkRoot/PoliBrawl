import { validatePublishedPolicyChange } from "@/server/polibrawl/services/editorial/editorial-quality-validator";
import type { PolicyChange } from "@/types/polibrawl";

export type PolicyChangePublicationReadiness = {
  ready: boolean;
  errors: string[];
};

export function evaluatePolicyChangePublication(
  change: PolicyChange | null,
): PolicyChangePublicationReadiness {
  if (!change) {
    return {
      ready: false,
      errors: ["Missing policy change record."],
    };
  }

  const errors: string[] = [];

  if (change.archived_at || change.published_status === "archived") {
    errors.push("Policy change is archived.");
  }

  if (change.published_status !== "published") {
    errors.push("Policy change is not published.");
  }

  errors.push(...validatePublishedPolicyChange(change));

  return {
    ready: errors.length === 0,
    errors,
  };
}

export function isPolicyChangePubliclyVisible(change: PolicyChange | null) {
  return evaluatePolicyChangePublication(change).ready;
}
