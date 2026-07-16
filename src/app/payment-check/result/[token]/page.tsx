export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";

import { PublicFooter, PublicNav } from "@/components/public/layout";
import { PaymentDecisionReport } from "@/features/payment-decision/components/payment-decision-report";
import { loadPaymentDecisionReportByToken } from "@/features/payment-decision/services/payment-decision-persistence";

export const metadata = {
  title: "Payment Decision Report | PoliBrawl",
  description:
    "A shareable evidence-based payout platform dependency report from PoliBrawl.",
};

export default async function PaymentDecisionResultPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await loadPaymentDecisionReportByToken(token);

  if (!result) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      <PublicNav activePath="/payment-check" />
      <main className="mx-auto max-w-[90rem] px-4 py-12 lg:px-8" id="main-content">
        <PaymentDecisionReport result={result} token={token} />
      </main>
      <PublicFooter />
    </div>
  );
}
