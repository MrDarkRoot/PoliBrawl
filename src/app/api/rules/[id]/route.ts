import { NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth";
import { logDecision } from "@/server/repositories/decision-log-repository";
import { ruleSchema } from "@/lib/validation/rule";
import { getSignalRuleById, updateSignalRule } from "@/server/repositories/signal-repository";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminAccess();

  const { id } = await params;
  const current = await getSignalRuleById(id).catch(() => null);
  if (!current) {
    return NextResponse.json({ error: "Rule not found." }, { status: 404 });
  }

  const body = await request.json();
  const parsed = ruleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
  }

  const updated = await updateSignalRule(id, parsed.data);

  await logDecision({
    entityType: "signal_rule",
    entityId: updated.id,
    action: "signal_rule.updated",
    previousValue: current,
    newValue: updated,
    decidedBy: auth.user.id,
  });

  return NextResponse.json({ id: updated.id });
}
