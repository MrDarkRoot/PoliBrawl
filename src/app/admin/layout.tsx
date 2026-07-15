import { AdminShell } from "@/components/layout/admin-shell";
import { requireAdminAccess } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await requireAdminAccess();

  return <AdminShell userEmail={context.user.email}>{children}</AdminShell>;
}
