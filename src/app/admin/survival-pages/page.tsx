import { requireAdminAccess } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { listPlatformSurvivalPages } from "@/server/polibrawl/repositories/platform-survival-page.repository";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default async function AdminSurvivalPagesList() {
  await requireAdminAccess();
  
  const pages = await listPlatformSurvivalPages();

  return (
    <div className="space-y-6">
      <PageHeader 
        eyebrow="Content Management" 
        title="Survival Pages" 
        actions={<Link href="/admin/survival-pages/new" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">New Page</Link>}
      />

      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-700">Title</th>
              <th className="px-4 py-3 font-medium text-gray-700">Platform</th>
              <th className="px-4 py-3 font-medium text-gray-700">Status</th>
              <th className="px-4 py-3 font-medium text-gray-700">Ready</th>
              <th className="px-4 py-3 font-medium text-gray-700">Updated</th>
              <th className="px-4 py-3 font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {pages.map(page => (
              <tr key={page.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{page.title}</td>
                <td className="px-4 py-3 text-gray-500">{page.platform_name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    page.status === 'ready_for_publish' ? 'bg-green-100 text-green-800' :
                    page.status === 'needs_review' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {page.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {page.ready_for_publish ? '✅ Yes' : '❌ No'}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {formatDistanceToNow(new Date(page.updated_at), { addSuffix: true })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <Link href={`/admin/survival-pages/${page.id}`} className="text-blue-600 hover:underline">Composer</Link>
                    <Link href={`/admin/survival-pages/${page.id}/edit`} className="text-gray-600 hover:underline">Edit</Link>
                  </div>
                </td>
              </tr>
            ))}
            {pages.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No survival pages found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
