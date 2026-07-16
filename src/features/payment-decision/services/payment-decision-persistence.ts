import "server-only";

import { paymentDecisionResultSchema } from "@/features/payment-decision/schemas/payment-decision-result.schema";
import {
  createReportToken,
  isValidReportToken,
} from "@/features/payment-decision/services/payment-decision-token";
import type {
  PaymentDecisionInput,
  PaymentDecisionProfile,
  PaymentDecisionResult,
} from "@/features/payment-decision/types/payment-decision.types";
import { queryMany, queryOne } from "@/server/polibrawl/db";

type SessionInsertRow = {
  id: string;
  report_token: string;
};

type ResultSnapshotRow = {
  result_snapshot: unknown;
};

function jsonb(value: unknown) {
  return JSON.stringify(value);
}

async function insertSession(
  input: PaymentDecisionInput,
  profile: PaymentDecisionProfile,
  reportToken: string,
) {
  if (!profile.platform.id) {
    throw new Error("Cannot store a payment decision report without a reviewed platform profile.");
  }

  return queryOne<SessionInsertRow>(
    `insert into payment_decision_sessions (
       report_token,
       country,
       work_type,
       platform_id,
       comparison_platform_id,
       amount_range,
       payment_frequency,
       usage_role,
       has_backup_route,
       concerns
     ) values ($1, $2, $3, $4, null, $5, $6, $7, $8, $9::jsonb)
     returning id, report_token`,
    [
      reportToken,
      input.country,
      input.workType,
      profile.platform.id,
      input.amountRange,
      input.paymentFrequency,
      input.usageRole,
      input.hasBackupRoute,
      jsonb(input.concerns),
    ],
  );
}

async function insertResult(
  sessionId: string,
  result: PaymentDecisionResult,
  profile: PaymentDecisionProfile,
) {
  const matchedRiskCategories = new Set(
    result.risks.map((risk) => risk.category),
  );
  const matchedRiskIds = profile.risks
    .filter((risk) => matchedRiskCategories.has(risk.category))
    .map((risk) => risk.internalRiskId);
  const matchedEvidenceIds = profile.evidence
    .filter((evidence) => matchedRiskCategories.has(evidence.riskCategory))
    .map((evidence) => evidence.internalEvidenceId);

  await queryMany(
    `insert into payment_decision_results (
       session_id,
       recommendation_code,
       matched_rule_keys,
       matched_risk_ids,
       matched_evidence_ids,
       action_codes,
       confidence_level,
       confidence_reasons,
       limitations,
       result_snapshot
     ) values ($1, $2, $3::jsonb, $4::jsonb, $5::jsonb, $6::jsonb, $7, $8::jsonb, $9::jsonb, $10::jsonb)`,
    [
      sessionId,
      result.recommendationCode,
      jsonb(result.matchedRuleKeys),
      jsonb(Array.from(new Set(matchedRiskIds))),
      jsonb(Array.from(new Set(matchedEvidenceIds))),
      jsonb(result.checklist.map((item) => item.code)),
      result.confidence.level,
      jsonb(result.confidence.reasons),
      jsonb(result.limitations),
      jsonb(result),
    ],
  );
}

export async function storePaymentDecisionReport(
  input: PaymentDecisionInput,
  profile: PaymentDecisionProfile,
  result: PaymentDecisionResult,
) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const reportToken = createReportToken();

    try {
      const session = await insertSession(input, profile, reportToken);
      if (!session) {
        throw new Error("Payment decision session insert failed.");
      }

      await insertResult(session.id, result, profile);

      return session.report_token;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("payment_decision_sessions_report_token_key")) {
        throw error;
      }
    }
  }

  throw new Error("Unable to allocate a unique payment decision report token.");
}

export async function loadPaymentDecisionReportByToken(token: string) {
  if (!isValidReportToken(token)) {
    return null;
  }

  const row = await queryOne<ResultSnapshotRow>(
    `select
       r.result_snapshot
     from payment_decision_results r
     join payment_decision_sessions s
       on s.id = r.session_id
     where s.report_token = $1
       and (s.expires_at is null or s.expires_at > now())
     order by r.created_at desc
     limit 1`,
    [token],
  );

  if (!row) {
    return null;
  }

  return paymentDecisionResultSchema.parse(row.result_snapshot);
}
