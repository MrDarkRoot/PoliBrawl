import { ConfigBanner } from "@/components/shared/config-banner";
import { AdminShell } from "@/components/layout/admin-shell";
import { requireAdminAccess } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await requireAdminAccess();

  if (context.kind === "missing-env") {
    return (
      <AdminShell>
        <ConfigBanner />
      </AdminShell>
    );
  }

  return <AdminShell userEmail={context.user.email}>{children}</AdminShell>;
}
