"use client";

import { useActionState } from "react";
import { createSurvivalPageAction, updateSurvivalPageAction } from "../actions/survival-page.actions";
import type { PlatformSurvivalPage, Platform } from "@/types/polibrawl";


export function SurvivalPageForm({ page, platforms }: { page?: PlatformSurvivalPage, platforms: Platform[] }) {
  const [state, action, isPending] = useActionState(page ? updateSurvivalPageAction : createSurvivalPageAction, { success: false, error: null });

  return (
    <form action={action} className="space-y-6 max-w-3xl">
      {state?.error && (
        <div className="p-4 bg-red-50 text-red-700 rounded border border-red-200">
          {state.error}
        </div>
      )}

      {page && <input type="hidden" name="id" value={page.id} />}

      <div>
        <label className="block text-sm font-medium mb-1">Platform</label>
        {page ? (
          <input type="hidden" name="platformId" value={page.platform_id} />
        ) : (
          <select name="platformId" required className="w-full border rounded p-2" defaultValue="">
            <option value="">Select Platform...</option>
            {platforms.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
        {page && <p className="text-gray-600 mt-1">Platform cannot be changed after creation.</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input type="text" name="title" required defaultValue={page?.title} className="w-full border rounded p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Slug</label>
          <input type="text" name="slug" required defaultValue={page?.slug} pattern="^[a-z0-9-]+$" className="w-full border rounded p-2" placeholder="e.g. platform-name" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Main Level (Optional)</label>
        <input type="text" name="main_level" defaultValue={page?.main_level || ''} className="w-full border rounded p-2" placeholder="e.g. medium" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Summary (Internal Meta)</label>
        <textarea name="summary" rows={2} defaultValue={page?.summary || ''} className="w-full border rounded p-2" />
      </div>

      <div className="pt-4 border-t">
        <h3 className="font-medium text-lg mb-4">Editorial Page Copy</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Editorial Intro</label>
            <textarea name="editorial_intro" rows={3} defaultValue={page?.editorial_intro || ''} className="w-full border rounded p-2" placeholder="Opening paragraph..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Survival Summary</label>
            <textarea name="survival_summary" rows={3} defaultValue={page?.survival_summary || ''} className="w-full border rounded p-2" placeholder="What to remember..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Disclaimer Note *</label>
            <textarea name="disclaimer_note" required rows={2} defaultValue={page?.disclaimer_note || 'The information on this page is for general survival awareness.'} className="w-full border rounded p-2" />
          </div>
        </div>
      </div>

      <button type="submit" disabled={isPending} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        {isPending ? "Saving..." : (page ? 'Save Changes' : 'Create Survival Page')}
      </button>
    </form>
  );
}
