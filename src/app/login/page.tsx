import { AppLogo } from "@/components/shared/app-logo";
import { ConfigBanner } from "@/components/shared/config-banner";
import { LoginForm } from "@/components/forms/login-form";
import { hasSupabaseEnv } from "@/lib/env";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const redirectToRaw = resolvedSearchParams.next;
  const redirectTo =
    typeof redirectToRaw === "string" &&
    redirectToRaw.startsWith("/") &&
    !redirectToRaw.startsWith("//")
      ? redirectToRaw
      : "/dashboard";
  const initialError =
    resolvedSearchParams.error === "role"
      ? "Your profile does not have access to the requested area."
      : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f5f5f4,#ffffff)] px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <AppLogo />
        </div>
        {!hasSupabaseEnv() ? <ConfigBanner /> : null}
        <LoginForm initialError={initialError} redirectTo={redirectTo} />
      </div>
    </div>
  );
}
