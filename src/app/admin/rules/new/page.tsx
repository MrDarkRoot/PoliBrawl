import { RuleForm } from "@/components/forms/rule-form";
import { PageHeader } from "@/components/shared/page-header";

export default function NewRulePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Epic 6"
        title="Create rule"
        description="Add a deterministic signal rule using keywords and optional regex patterns."
      />
      <RuleForm mode="create" />
    </div>
  );
}
