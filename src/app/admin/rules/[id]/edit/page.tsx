import { notFound } from "next/navigation";

import { RuleForm } from "@/components/forms/rule-form";
import { PageHeader } from "@/components/shared/page-header";
import { getSignalRuleById } from "@/server/repositories/signal-repository";

export default async function EditRulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rule = await getSignalRuleById(id).catch(() => null);

  if (!rule) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Epic 6"
        title={`Edit ${rule.rule_name}`}
        description="Update rule behavior, confidence weighting, and enablement."
      />
      <RuleForm mode="edit" initialValues={{ ...rule, id: rule.id }} />
    </div>
  );
}
