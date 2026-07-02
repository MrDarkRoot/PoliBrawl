import "server-only";

import { getPolibrawlPool, queryMany } from "@/server/polibrawl/db";
import type {
  CandidateReviewHistory,
  RedFlagCandidate,
  RedFlag,
  Uuid,
} from "@/types/polibrawl";

export async function listReviewHistory(
  candidateId: Uuid,
): Promise<CandidateReviewHistory[]> {
  return queryMany<CandidateReviewHistory>(
    `SELECT * FROM candidate_review_history WHERE candidate_id = $1 ORDER BY created_at ASC`,
    [candidateId],
  );
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .substring(0, 100);
}

export async function startReview(
  candidateId: Uuid,
  reviewerId: Uuid,
): Promise<void> {
  // @ts-expect-error - pg types issue
  const client = await getPolibrawlPool().connect();
  try {
    await client.query("BEGIN");
    
    const candidateRes = await client.query<RedFlagCandidate>(
      `SELECT * FROM red_flag_candidates WHERE id = $1 FOR UPDATE`,
      [candidateId]
    );
    const candidate = candidateRes.rows[0];
    if (!candidate) throw new Error("Candidate not found");
    if (candidate.status !== "pending" && candidate.status !== "needs_more_review") {
      throw new Error("Only pending candidates can be reviewed");
    }

    const oldStatus = candidate.status;
    const newStatus = "reviewing";

    await client.query(
      `UPDATE red_flag_candidates SET status = $1, review_status = 'started', reviewed_by = $2, updated_at = now() WHERE id = $3`,
      [newStatus, reviewerId, candidateId]
    );

    await client.query(
      `INSERT INTO candidate_review_history (candidate_id, action, old_status, new_status, reviewer, note)
       VALUES ($1, 'start_review', $2, $3, $4, 'Started review')`,
      [candidateId, oldStatus, newStatus, reviewerId]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function rejectCandidate(
  candidateId: Uuid,
  reviewerId: Uuid,
  reason: string,
): Promise<void> {
  // @ts-expect-error - pg types issue
  const client = await getPolibrawlPool().connect();
  try {
    await client.query("BEGIN");

    const candidateRes = await client.query<RedFlagCandidate>(
      `SELECT * FROM red_flag_candidates WHERE id = $1 FOR UPDATE`,
      [candidateId]
    );
    const candidate = candidateRes.rows[0];
    if (!candidate) throw new Error("Candidate not found");
    if (candidate.status === "approved" || candidate.status === "merged") {
      throw new Error("Cannot reject an approved or merged candidate");
    }

    const oldStatus = candidate.status;
    const newStatus = "rejected";

    await client.query(
      `UPDATE red_flag_candidates 
       SET status = $1, reject_reason = $2, review_notes = $2, reviewed_by = $3, reviewed_at = now(), updated_at = now() 
       WHERE id = $4`,
      [newStatus, reason, reviewerId, candidateId]
    );

    await client.query(
      `INSERT INTO candidate_review_history (candidate_id, action, old_status, new_status, reviewer, note)
       VALUES ($1, 'reject', $2, $3, $4, $5)`,
      [candidateId, oldStatus, newStatus, reviewerId, reason]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function approveCandidate(
  candidateId: Uuid,
  reviewerId: Uuid,
  note: string = "Approved",
): Promise<RedFlag> {
  // @ts-expect-error - pg types issue
  const client = await getPolibrawlPool().connect();
  try {
    await client.query("BEGIN");

    const candidateRes = await client.query<RedFlagCandidate>(
      `SELECT * FROM red_flag_candidates WHERE id = $1 FOR UPDATE`,
      [candidateId]
    );
    const candidate = candidateRes.rows[0];
    if (!candidate) throw new Error("Candidate not found");
    if (candidate.status === "approved") throw new Error("Candidate already approved");
    if (candidate.status === "merged") throw new Error("Candidate is merged");
    if (candidate.status === "rejected") throw new Error("Candidate is rejected");

    // Create Draft Red Flag
    const slug = generateSlug(candidate.headline) || `rf-${Date.now()}`;
    const level = (candidate.confidence_note && candidate.confidence_note.includes("critical")) ? "critical" : "unknown";

    const redFlagRes = await client.query<RedFlag>(
      `INSERT INTO red_flags (
         platform_id, slug, title, category, level, summary, why_it_matters, status,
         excerpt, source_id, source_snapshot_id, keywords
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, 'draft',
         $8, $9, $10, $11
       ) RETURNING *`,
      [
        candidate.platform_id,
        slug,
        candidate.headline,
        candidate.category,
        level,
        "Auto-generated summary from candidate approval.",
        "Auto-generated context.",
        candidate.excerpt,
        candidate.source_id,
        candidate.source_snapshot_id,
        candidate.matched_keywords,
      ]
    );

    const redFlag = redFlagRes.rows[0];

    const oldStatus = candidate.status;
    const newStatus = "approved";

    await client.query(
      `UPDATE red_flag_candidates 
       SET status = $1, approved_red_flag_id = $2, review_notes = $3, reviewed_by = $4, reviewed_at = now(), updated_at = now() 
       WHERE id = $5`,
      [newStatus, redFlag.id, note, reviewerId, candidateId]
    );

    await client.query(
      `INSERT INTO candidate_review_history (candidate_id, action, old_status, new_status, reviewer, note)
       VALUES ($1, 'approve', $2, $3, $4, $5)`,
      [candidateId, oldStatus, newStatus, reviewerId, note]
    );

    await client.query("COMMIT");
    return redFlag;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function mergeCandidate(
  sourceCandidateId: Uuid,
  targetCandidateId: Uuid,
  reviewerId: Uuid,
  note: string = "Merged",
): Promise<void> {
  // @ts-expect-error - pg types issue
  const client = await getPolibrawlPool().connect();
  try {
    await client.query("BEGIN");

    const sourceRes = await client.query<RedFlagCandidate>(
      `SELECT * FROM red_flag_candidates WHERE id = $1 FOR UPDATE`,
      [sourceCandidateId]
    );
    const sourceCandidate = sourceRes.rows[0];

    const targetRes = await client.query<RedFlagCandidate>(
      `SELECT * FROM red_flag_candidates WHERE id = $1 FOR UPDATE`,
      [targetCandidateId]
    );
    const targetCandidate = targetRes.rows[0];

    if (!sourceCandidate) throw new Error("Source candidate not found");
    if (!targetCandidate) throw new Error("Target candidate not found");

    if (sourceCandidate.platform_id !== targetCandidate.platform_id) {
      throw new Error("Cannot merge candidates from different platforms");
    }
    if (sourceCandidate.category !== targetCandidate.category) {
      throw new Error("Cannot merge candidates of different categories");
    }

    if (sourceCandidate.status === "approved" || sourceCandidate.status === "merged") {
      throw new Error("Source candidate cannot be approved or merged");
    }

    // Merge keywords and excerpt (keep target excerpt, union keywords)
    const newKeywords = Array.from(new Set([...targetCandidate.matched_keywords, ...sourceCandidate.matched_keywords]));

    await client.query(
      `UPDATE red_flag_candidates SET matched_keywords = $1, updated_at = now() WHERE id = $2`,
      [newKeywords, targetCandidateId]
    );

    const oldStatus = sourceCandidate.status;
    const newStatus = "merged";

    await client.query(
      `UPDATE red_flag_candidates 
       SET status = $1, merged_into_candidate_id = $2, review_notes = $3, reviewed_by = $4, reviewed_at = now(), updated_at = now() 
       WHERE id = $5`,
      [newStatus, targetCandidateId, note, reviewerId, sourceCandidateId]
    );

    await client.query(
      `INSERT INTO candidate_review_history (candidate_id, action, old_status, new_status, reviewer, note)
       VALUES ($1, 'merge', $2, $3, $4, $5)`,
      [sourceCandidateId, oldStatus, newStatus, reviewerId, note]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function returnToPending(
  candidateId: Uuid,
  reviewerId: Uuid,
): Promise<void> {
  // @ts-expect-error - pg types issue
  const client = await getPolibrawlPool().connect();
  try {
    await client.query("BEGIN");
    
    const candidateRes = await client.query<RedFlagCandidate>(
      `SELECT * FROM red_flag_candidates WHERE id = $1 FOR UPDATE`,
      [candidateId]
    );
    const candidate = candidateRes.rows[0];
    if (!candidate) throw new Error("Candidate not found");
    
    const oldStatus = candidate.status;
    const newStatus = "pending";

    await client.query(
      `UPDATE red_flag_candidates SET status = $1, review_status = 'pending', reviewed_by = null, updated_at = now() WHERE id = $2`,
      [newStatus, candidateId]
    );

    await client.query(
      `INSERT INTO candidate_review_history (candidate_id, action, old_status, new_status, reviewer, note)
       VALUES ($1, 'return_to_pending', $2, $3, $4, 'Returned to pending')`,
      [candidateId, oldStatus, newStatus, reviewerId]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
