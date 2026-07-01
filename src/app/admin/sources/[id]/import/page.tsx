import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getPolicySourceById } from "@/server/repositories/source-repository";

export default async function ManualImportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const source = await getPolicySourceById(id).catch(() => null);

  if (!source) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Epic 4"
        title="Manual import"
        description={`Create a document version for ${source.title ?? source.url} without automated fetch.`}
      />
      <form action={`/api/sources/${source.id}/import`} method="post" className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="markdown_text">Markdown text</Label>
          <Textarea id="markdown_text" name="markdown_text" rows={18} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="plain_text">Plain text (optional)</Label>
          <Textarea id="plain_text" name="plain_text" rows={12} />
        </div>
        <Button type="submit">Create manual version</Button>
      </form>
    </div>
  );
}
