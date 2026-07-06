"use client";

import { useState, useTransition } from "react";
import type { PlatformSurvivalPage, PlatformSurvivalPageRedFlag, RedFlag } from "@/types/polibrawl";
import type { PageQualityEvaluation } from "@/server/polibrawl/services/survival-page-composer.service";
import type { ValidationResult } from "@/server/polibrawl/services/editorial/editorial-validator";
import { 
  attachRedFlagToPageAction, 
  detachRedFlagFromPageAction, 
  reorderPageRedFlagsAction,
  autoAttachReadyRedFlagsAction,
  updatePageReadinessAction
} from "../actions/survival-page.actions";
import { generateEditorialDraftAction, generatePlatformGuidePromptAction } from "../actions/editorial.actions";

export function SurvivalPageComposer({ 
  page, 
  attachedRedFlags, 
  quality,
  availableRedFlags
}: { 
  page: PlatformSurvivalPage;
  attachedRedFlags: (PlatformSurvivalPageRedFlag & { red_flag: RedFlag })[];
  quality: PageQualityEvaluation;
  availableRedFlags: RedFlag[];
}) {
  const [activeTab, setActiveTab] = useState("red-flags");
  const [isPending, startTransition] = useTransition();
  const [draftContent, setDraftContent] = useState<string | null>(null);
  const [promptContent, setPromptContent] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateDraft = async () => {
    setIsGenerating(true);
    try {
      const res = await generateEditorialDraftAction(page.platform_id);
      setDraftContent(res.markdown);
      setValidationResult(res.validation);
      const prompt = await generatePlatformGuidePromptAction(page.platform_id);
      setPromptContent(prompt);
    } catch (e) {
      console.error(e);
      alert("Failed to generate draft.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPrompt = () => {
    if (promptContent) {
      navigator.clipboard.writeText(promptContent);
      alert("AI Prompt copied to clipboard!");
    }
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "red-flags", label: `Red Flags (${attachedRedFlags.length})` },
    { id: "editorial-draft", label: "Editorial Draft (AI)" },
    { id: "page-copy", label: "Page Copy" },
    { id: "quality", label: "Quality Gate" },
    { id: "preview", label: "Preview" },
  ];

  return (
    <div>
      <div className="border-b mb-6">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
              {tab.id === 'quality' && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  quality.ready_for_publish ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {quality.score}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-white p-6 border rounded-lg shadow-sm">
        {activeTab === "overview" && (
          <div className="space-y-4 max-w-3xl">
            <h3 className="text-lg font-medium">Page Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Status:</span> {page.status}</div>
              <div><span className="text-gray-500">Ready for Publish:</span> {page.ready_for_publish ? 'Yes' : 'No'}</div>
              <div><span className="text-gray-500">Slug:</span> {page.slug}</div>
              <div><span className="text-gray-500">Main Level:</span> {page.main_level || '-'}</div>
            </div>
          </div>
        )}

        {activeTab === "red-flags" && (
          <div className="space-y-8">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Attached Red Flags</h3>
                <button 
                  disabled={isPending}
                  onClick={() => startTransition(() => { autoAttachReadyRedFlagsAction(page.id); })}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-sm hover:bg-blue-100 disabled:opacity-50"
                >
                  Auto-Attach Ready Flags
                </button>
              </div>
              
              {attachedRedFlags.length === 0 ? (
                <p className="text-gray-500 text-sm">No red flags attached yet.</p>
              ) : (
                <div className="space-y-3">
                  {attachedRedFlags.map((pr) => (
                    <div key={pr.id} className="flex justify-between items-center p-3 border rounded bg-gray-50">
                      <div>
                        <div className="font-medium">{pr.red_flag.title}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Category: {pr.red_flag.category} | Level: {pr.red_flag.level} | Order: {pr.display_order}
                        </div>
                      </div>
                      <button 
                        disabled={isPending}
                        onClick={() => startTransition(() => { detachRedFlagFromPageAction(page.id, pr.red_flag_id); })}
                        className="text-red-600 hover:underline text-sm disabled:opacity-50"
                      >
                        Detach
                      </button>
                    </div>
                  ))}
                  <button 
                    disabled={isPending}
                    onClick={() => startTransition(() => {
                      reorderPageRedFlagsAction(page.id, attachedRedFlags.map(f => f.red_flag_id).reverse());
                    })}
                    className="text-sm text-gray-600 hover:underline mt-2 inline-block disabled:opacity-50"
                  >
                    Reverse Order (Test Reorder)
                  </button>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Available Draft Flags (Unattached)</h3>
              <div className="space-y-3">
                {availableRedFlags.map(rf => (
                  <div key={rf.id} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <div className="font-medium">{rf.title}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Category: {rf.category} | Status: {rf.status}
                      </div>
                    </div>
                    <form action={async (fd) => {
                      startTransition(() => { attachRedFlagToPageAction(null, fd); });
                    }}>
                      <input type="hidden" name="pageId" value={page.id} />
                      <input type="hidden" name="redFlagId" value={rf.id} />
                      <button type="submit" disabled={isPending} className="text-blue-600 hover:underline text-sm disabled:opacity-50">Attach</button>
                    </form>
                  </div>
                ))}
                {availableRedFlags.length === 0 && <p className="text-gray-500 text-sm">All available flags are attached.</p>}
              </div>
            </div>
          </div>
        )}

        {activeTab === "editorial-draft" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h3 className="text-lg font-medium">AI Editorial Engine</h3>
                <p className="text-sm text-gray-500">Transform research packets into a perfect writing brief for ChatGPT/Claude.</p>
              </div>
              <div className="space-x-3">
                <button
                  disabled={isGenerating}
                  onClick={handleGenerateDraft}
                  className="px-4 py-2 bg-slate-900 text-white rounded text-sm hover:bg-slate-800 disabled:opacity-50"
                >
                  {isGenerating ? "Generating..." : draftContent ? "Regenerate Draft" : "Generate Editorial Draft"}
                </button>
                {promptContent && (
                  <button
                    onClick={handleCopyPrompt}
                    className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    Copy AI Prompt
                  </button>
                )}
              </div>
            </div>

            {validationResult && (
              <div className={`p-4 border rounded-lg ${validationResult.status === 'PASS' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                <h4 className="font-bold mb-2">Validation: {validationResult.status}</h4>
                {validationResult.issues.length > 0 && (
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    {validationResult.issues.map((issue: string, i: number) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                )}
                {validationResult.issues.length === 0 && <p className="text-sm">The draft passes all editorial guidelines.</p>}
              </div>
            )}

            {draftContent && (
              <div>
                <h4 className="font-medium mb-3">Preview Draft (Markdown)</h4>
                <div className="relative">
                  <pre className="bg-gray-50 border rounded p-4 text-xs overflow-auto max-h-[600px] whitespace-pre-wrap font-mono text-gray-800">
                    {draftContent}
                  </pre>
                  <button 
                    onClick={() => {
                      const blob = new Blob([draftContent], { type: 'text/markdown' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `platform-guide-${page.platform_id}.md`;
                      a.click();
                    }}
                    className="absolute top-2 right-2 px-3 py-1 bg-white border shadow-sm rounded text-xs hover:bg-gray-50"
                  >
                    Download Markdown
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "page-copy" && (
          <div className="space-y-4 max-w-3xl">
            <h3 className="text-lg font-medium">Editorial Copy</h3>
            
            <div className="space-y-4 text-sm">
              <div>
                <span className="block font-medium text-gray-700 mb-1">Editorial Intro</span>
                <div className="p-3 bg-gray-50 rounded border whitespace-pre-wrap">{page.editorial_intro || <span className="text-gray-400">Empty</span>}</div>
              </div>
              <div>
                <span className="block font-medium text-gray-700 mb-1">Survival Summary</span>
                <div className="p-3 bg-gray-50 rounded border whitespace-pre-wrap">{page.survival_summary || <span className="text-gray-400">Empty</span>}</div>
              </div>
              <div>
                <span className="block font-medium text-gray-700 mb-1">Disclaimer Note</span>
                <div className="p-3 bg-gray-50 rounded border whitespace-pre-wrap">{page.disclaimer_note || <span className="text-gray-400">Empty</span>}</div>
              </div>
            </div>
            
            <div className="pt-4">
              <a href={`/admin/survival-pages/${page.id}/edit`} className="text-blue-600 hover:underline text-sm">Edit Copy</a>
            </div>
          </div>
        )}

        {activeTab === "quality" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Quality Evaluation</h3>
              <button
                disabled={isPending}
                onClick={() => startTransition(() => { updatePageReadinessAction(page.id); })}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 disabled:opacity-50"
              >
                Re-evaluate
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg border">
                <div className="text-sm text-gray-500 mb-1">Score</div>
                <div className="text-3xl font-bold">{quality.score}/100</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border">
                <div className="text-sm text-gray-500 mb-1">Ready for Publish</div>
                <div className="text-3xl font-bold">{quality.ready_for_publish ? '✅' : '❌'}</div>
              </div>
            </div>

            {quality.errors.length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">Blockers ({quality.errors.length})</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-red-700">
                  {quality.errors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}

            {quality.warnings.length > 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">Warnings ({quality.warnings.length})</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-yellow-700">
                  {quality.warnings.map((warn, i) => <li key={i}>{warn}</li>)}
                </ul>
              </div>
            )}

            {quality.notReadyRedFlags.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Attached Flags Not Ready</h4>
                <div className="space-y-2">
                  {quality.notReadyRedFlags.map(rf => (
                    <div key={rf.id} className="p-3 border rounded bg-gray-50 text-sm">
                      <a href={`/admin/red-flags/${rf.id}`} className="font-medium text-blue-600 hover:underline">{rf.title}</a>
                      <ul className="list-disc pl-5 mt-1 text-red-600">
                        {rf.reasons.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "preview" && (
          <div className="bg-gray-100 -mx-6 -my-6 p-8 min-h-[500px]">
            <div className="max-w-2xl mx-auto bg-white p-8 rounded shadow-lg border">
              <div className="text-center mb-8">
                <div className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full mb-4">
                  Internal Draft Preview
                </div>
                <h1 className="text-3xl font-bold mb-4">{page.title}</h1>
                {page.editorial_intro && <p className="text-gray-600 italic text-lg leading-relaxed">{page.editorial_intro}</p>}
              </div>

              <div className="space-y-12">
                {attachedRedFlags.map((pr, i) => (
                  <div key={pr.id} className="border-t pt-8">
                    <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-500 uppercase tracking-wide">
                      <span>{i+1}.</span>
                      <span>{pr.red_flag.category}</span>
                    </div>
                    <h2 className="text-2xl font-semibold mb-3">{pr.red_flag.title}</h2>
                    <p className="text-gray-700">{pr.red_flag.summary}</p>
                  </div>
                ))}
              </div>

              <div className="mt-12 pt-8 border-t border-gray-200">
                {page.survival_summary && (
                  <div className="mb-6 p-4 bg-gray-50 rounded border">
                    <h3 className="font-medium mb-2">Survival Summary</h3>
                    <p className="text-sm text-gray-700">{page.survival_summary}</p>
                  </div>
                )}
                {page.disclaimer_note && (
                  <p className="text-xs text-gray-500 text-center">{page.disclaimer_note}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
