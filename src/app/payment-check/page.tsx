export const dynamic = "force-dynamic";

import { PublicFooter, PublicNav } from "@/components/public/layout";
import { PaymentDecisionQuestionnaire } from "@/features/payment-decision/components/payment-decision-questionnaire";
import { listPaymentDecisionPlatformOptions } from "@/features/payment-decision/services/load-payment-risk-evidence";

export const metadata = {
  title: "Payment Platform Check | PoliBrawl",
  description:
    "Build an evidence-based payout platform dependency decision report before depending on an international payment route.",
};

export default async function PaymentCheckPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; correction?: string }>;
}) {
  const params = await searchParams;
  const platformOptions = await listPaymentDecisionPlatformOptions("vietnam");

  return (
    <div className="min-h-screen bg-white font-sans">
      <PublicNav activePath="/payment-check" />
      <main className="mx-auto max-w-[90rem] px-4 py-12 lg:px-8" id="main-content">
        <PaymentDecisionQuestionnaire
          platformOptions={platformOptions}
          error={params.error}
          correction={params.correction}
        />
      </main>
      <PublicFooter />
    </div>
  );
}
