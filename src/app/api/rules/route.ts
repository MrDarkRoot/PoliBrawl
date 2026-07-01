import { NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth";
import { logDecision } from "@/server/repositories/decision-log-repository";
import { ruleSchema } from "@/lib/validation/rule";
import { createSignalRule } from "@/server/repositories/signal-repository";

export async function POST(request: Request) {
  const auth = await requireAdminAccess();
  if (auth.kind === "missing-env") {
    return NextResponse.json({ error: "Supabase environment is not configured." }, { status: 500 });
  }

  const body = await request.json();
  const parsed = ruleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
  }

  const rule = await createSignalRule(parsed.data);

  await logDecision({
    entityType: "signal_rule",
    entityId: rule.id,
    action: "signal_rule.created",
    newValue: rule,
    decidedBy: auth.user.id,
  });

  return NextResponse.json({ id: rule.id }, { status: 201 });
}
