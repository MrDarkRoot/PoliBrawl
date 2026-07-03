// Research Packet Repository
import "server-only";

import { queryMany, queryOne } from "@/server/polibrawl/db";
import { createCrudRepository } from "@/server/polibrawl/repositories/base.repository";
import type {
  ResearchPacket,
  ResearchPacketEvidence,
  ResearchPacketWithEvidence,
  CreateResearchPacketDto,
  UpdateResearchPacketDto,
  CreateResearchPacketEvidenceDto,
  ResearchPacketListFilters,
  Uuid,
} from "@/types/polibrawl";

// ---------------------------------------------------------------------------
// research_packets CRUD
// ---------------------------------------------------------------------------

const packetColumns = [
  "candidate_id",
  "platform_id",
  "source_snapshot_id",
  "category",
  "title",
  "status",
  "confidence_score",
  "noise_score",
  "summary",
  "suggested_level",
  "suggested_risk",
  "scanner_observations",
  "possible_false_positives",
  "keywords_found",
  "source_url",
  "generated_at",
] as const;

export const researchPacketRepository = createCrudRepository<
  ResearchPacket,
  CreateResearchPacketDto,
  UpdateResearchPacketDto,
  ResearchPacketListFilters
>({
  tableName: "research_packets",
  insertableColumns: packetColumns,
  updatableColumns: [
    "status",
    "summary",
    "suggested_level",
    "suggested_risk",
    "scanner_observations",
    "possible_false_positives",
  ],
  filterableColumns: ["id", "candidate_id", "platform_id", "category", "status"],
  defaultOrderBy: "confidence_score desc, created_at desc",
  archive: {
    archivedAtColumn: "updated_at",
    statusColumn: "status",
    archivedStatusValue: "archived",
  },
});

export const listResearchPackets = researchPacketRepository.list;
export const findResearchPacketById = researchPacketRepository.findById;
export const findResearchPacket = researchPacketRepository.findOne;
export const createResearchPacket = researchPacketRepository.insert;
export const updateResearchPacket = researchPacketRepository.update;

// ---------------------------------------------------------------------------
// research_packet_evidence — insert only, no CRUD needed
// ---------------------------------------------------------------------------

export async function insertResearchPacketEvidence(
  dto: CreateResearchPacketEvidenceDto,
): Promise<ResearchPacketEvidence | null> {
  return queryOne<ResearchPacketEvidence>(
    `insert into research_packet_evidence
      (research_packet_id, keyword_match_id, excerpt, context_before, context_after,
       source_url, section_hint, confidence_score, noise_score, display_order)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *`,
    [
      dto.research_packet_id,
      dto.keyword_match_id ?? null,
      dto.excerpt,
      dto.context_before ?? null,
      dto.context_after ?? null,
      dto.source_url ?? null,
      dto.section_hint ?? null,
      dto.confidence_score,
      dto.noise_score,
      dto.display_order,
    ],
  );
}

export async function listResearchPacketEvidence(
  packetId: Uuid,
): Promise<ResearchPacketEvidence[]> {
  return queryMany<ResearchPacketEvidence>(
    `select * from research_packet_evidence where research_packet_id = $1 order by display_order asc, confidence_score desc`,
    [packetId],
  );
}

// ---------------------------------------------------------------------------
// Joined query for detailed view
// ---------------------------------------------------------------------------

export async function findResearchPacketWithEvidence(
  packetId: Uuid,
): Promise<ResearchPacketWithEvidence | null> {
  const packet = await queryOne<
    ResearchPacket & {
      platform_name: string;
      platform_slug: string;
      candidate_headline: string;
      candidate_status: string;
    }
  >(
    `select rp.*,
            p.name as platform_name,
            p.slug as platform_slug,
            rfc.headline as candidate_headline,
            rfc.status as candidate_status
     from research_packets rp
     join platforms p on p.id = rp.platform_id
     join red_flag_candidates rfc on rfc.id = rp.candidate_id
     where rp.id = $1
     limit 1`,
    [packetId],
  );

  if (!packet) return null;

  const evidence = await listResearchPacketEvidence(packetId);
  return { ...packet, evidence };
}

export async function listResearchPacketsWithPlatform(
  filters: ResearchPacketListFilters = {},
  options: { limit?: number; offset?: number } = {},
): Promise<
  (ResearchPacket & {
    platform_name: string;
    platform_slug: string;
    candidate_headline: string;
    candidate_status: string;
  })[]
> {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (filters.platform_id) {
    conditions.push(`rp.platform_id = $${idx++}`);
    values.push(filters.platform_id);
  }
  if (filters.category) {
    conditions.push(`rp.category = $${idx++}`);
    values.push(filters.category);
  }
  if (filters.status) {
    conditions.push(`rp.status = $${idx++}`);
    values.push(filters.status);
  }
  if (filters.candidate_id) {
    conditions.push(`rp.candidate_id = $${idx++}`);
    values.push(filters.candidate_id);
  }
  if (filters.id) {
    conditions.push(`rp.id = $${idx++}`);
    values.push(filters.id);
  }

  const where = conditions.length > 0 ? `where ${conditions.join(" and ")}` : "";
  const limit = options.limit ? ` limit $${idx++}` : "";
  const offset = options.offset ? ` offset $${idx++}` : "";

  if (options.limit) values.push(options.limit);
  if (options.offset) values.push(options.offset);

  return queryMany(
    `select rp.*,
            p.name as platform_name,
            p.slug as platform_slug,
            rfc.headline as candidate_headline,
            rfc.status as candidate_status
     from research_packets rp
     join platforms p on p.id = rp.platform_id
     join red_flag_candidates rfc on rfc.id = rp.candidate_id
     ${where}
     order by rp.confidence_score desc, rp.created_at desc${limit}${offset}`,
    values,
  );
}
