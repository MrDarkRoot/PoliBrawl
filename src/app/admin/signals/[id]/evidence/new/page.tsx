import { notFound } from "next/navigation";

import { EvidenceForm } from "@/components/forms/evidence-form";
import { PageHeader } from "@/components/shared/page-header";
import { getSignalCandidateById, getSignalById } from "@/server/repositories/signal-repository";

export default async function NewEvidencePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const candidateId =
    typeof resolvedSearchParams.candidateId === "string"
      ? resolvedSearchParams.candidateId
      : undefined;

  const signal = await getSignalById(id).catch(() => null);

  if (!signal) {
    notFound();
  }

  const candidate = candidateId
    ? await getSignalCandidateById(candidateId).catch(() => null)
    : null;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Epic 7"
        title="Evidence builder"
        description={`Create an evidence item for ${signal.signal.name}`}
      />
      <EvidenceForm
        signalId={signal.signal.id}
        initialValues={{
          clause_id: candidate?.clauses?.id ?? null,
          policy_source_id:
            candidate?.clauses?.document_versions?.policy_source_id ?? "",
          document_version_id: candidate?.clauses?.document_version_id ?? null,
          clause_excerpt: candidate?.clauses?.clause_text ?? "",
          source_url:
            candidate?.clauses?.document_versions?.policy_sources?.url ?? "",
          document_title:
            candidate?.clauses?.document_versions?.policy_sources?.title ?? "",
          explanation: signal.signal.explanation ?? "",
          why_it_matters: "",
          visibility: "public",
          status: "draft",
        }}
      />
    </div>
  );
}
