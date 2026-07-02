"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { RedFlag, EvidenceItem, SurvivalNote, BackupOption, Checklist, ChecklistItem } from "@/types/polibrawl";
import { addEvidenceAction, addSurvivalNoteAction, addBackupOptionAction, addChecklistItemAction, deleteEvidenceAction } from "../actions/workspace.actions";
import { useActionState } from "react";
import { Textarea } from "@/components/ui/textarea";

export function WorkspaceTabs({
  redFlag,
  evidence,
  notes,
  backups,
  checklists,
  checklistItems,
  quality,
}: {
  redFlag: RedFlag;
  evidence: EvidenceItem[];
  notes: SurvivalNote[];
  backups: BackupOption[];
  checklists: Checklist[];
  checklistItems: ChecklistItem[];
  quality: { score: number; ready_for_publish: boolean; errors: string[]; warnings: string[]; };
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [eviState, eviAction, eviPending] = useActionState(addEvidenceAction, { success: false, error: null });
  const [noteState, noteAction, notePending] = useActionState(addSurvivalNoteAction, { success: false, error: null });
  const [backupState, backupAction, backupPending] = useActionState(addBackupOptionAction, { success: false, error: null });
  const [chkState, chkAction, chkPending] = useActionState(addChecklistItemAction, { success: false, error: null });

  void eviState; void noteState; void backupState; void chkState;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "evidence", label: `Evidence (${evidence.length})` },
    { id: "notes", label: `Survival Notes (${notes.length})` },
    { id: "backups", label: `Backups (${backups.length})` },
    { id: "checklists", label: `Checklist (${checklistItems.length})` },
    { id: "quality", label: `Quality Gate` },
    { id: "history", label: "History" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-border pb-px">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === t.id 
                ? "border-b-2 border-primary text-primary" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{redFlag.summary}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Excerpt (from Candidate)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded bg-muted/30 p-4 text-sm whitespace-pre-wrap font-mono">
                  {redFlag.excerpt}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "evidence" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add Evidence</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={eviAction} className="space-y-4">
                  <input type="hidden" name="redFlagId" value={redFlag.id} />
                  <input type="hidden" name="sourceId" value={redFlag.source_id || ''} />
                  <div>
                    <label className="text-sm font-medium">Title</label>
                    <input name="title" required className="w-full mt-1 px-3 py-2 border rounded" placeholder="Evidence title" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Excerpt</label>
                    <Textarea name="excerpt" required className="w-full mt-1" placeholder="Paste evidence text" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Confidence</label>
                    <select name="confidence" className="w-full mt-1 px-3 py-2 border rounded">
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <Button type="submit" disabled={eviPending}>Add Evidence</Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {evidence.map(e => (
                <Card key={e.id}>
                  <CardContent className="p-4 flex justify-between items-start">
                    <div className="space-y-2">
                      <p className="font-semibold text-sm">{e.title}</p>
                      <p className="text-sm text-muted-foreground">{e.excerpt}</p>
                      <span className="text-xs bg-muted px-2 py-1 rounded">Confidence: {e.confidence}</span>
                    </div>
                    <form action={async () => { await deleteEvidenceAction(e.id, redFlag.id); }}>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">Delete</Button>
                    </form>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === "notes" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add Survival Note</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={noteAction} className="space-y-4">
                  <input type="hidden" name="redFlagId" value={redFlag.id} />
                  <div>
                    <label className="text-sm font-medium">Title</label>
                    <input name="title" required className="w-full mt-1 px-3 py-2 border rounded" placeholder="e.g. Why this matters" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Body</label>
                    <Textarea name="body" required className="w-full mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Priority</label>
                    <select name="priority" className="w-full mt-1 px-3 py-2 border rounded">
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <Button type="submit" disabled={notePending}>Add Note</Button>
                </form>
              </CardContent>
            </Card>
            <div className="space-y-4">
              {notes.map(n => (
                <Card key={n.id}>
                  <CardContent className="p-4">
                    <p className="font-semibold text-sm">{n.title || n.note_title}</p>
                    <p className="text-sm text-muted-foreground mt-2">{n.body || n.note_body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === "backups" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add Backup Option</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={backupAction} className="space-y-4">
                  <input type="hidden" name="redFlagId" value={redFlag.id} />
                  <input type="hidden" name="optionType" value="alternative_platform" />
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <input name="name" required className="w-full mt-1 px-3 py-2 border rounded" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Summary</label>
                    <input name="summary" required className="w-full mt-1 px-3 py-2 border rounded" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Tradeoffs</label>
                    <Textarea name="tradeoffs" required className="w-full mt-1" />
                  </div>
                  <Button type="submit" disabled={backupPending}>Add Backup Option</Button>
                </form>
              </CardContent>
            </Card>
            <div className="space-y-4">
              {backups.map(b => (
                <Card key={b.id}>
                  <CardContent className="p-4">
                    <p className="font-semibold text-sm">{b.name || b.label}</p>
                    <p className="text-sm text-muted-foreground mt-1">{b.summary}</p>
                    <div className="mt-2 text-sm bg-muted/30 p-2 rounded border">
                      <strong>Tradeoffs:</strong> {b.tradeoffs}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === "checklists" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add Checklist Item</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={chkAction} className="space-y-4">
                  <input type="hidden" name="redFlagId" value={redFlag.id} />
                  <input type="hidden" name="checklistId" value={checklists[0]?.id || ''} />
                  <div>
                    <label className="text-sm font-medium">Item Text</label>
                    <input name="text" required className="w-full mt-1 px-3 py-2 border rounded" />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="required" /> Required step
                  </label>
                  <Button type="submit" disabled={chkPending}>Add Item</Button>
                </form>
              </CardContent>
            </Card>
            <div className="space-y-2">
              {checklistItems.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-3 border rounded-lg bg-background">
                  <input type="checkbox" disabled checked={c.required} />
                  <span className="text-sm">{c.text || c.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "quality" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quality Gate Evaluation</CardTitle>
                <CardDescription>Drafts must pass these checks to be eligible for publishing.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Overall Score: {quality.score}/100</h4>
                  {quality.ready_for_publish ? (
                    <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm font-medium">
                      ✓ Ready for Publish
                    </div>
                  ) : (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm font-medium">
                      ✕ Not Ready for Publish
                    </div>
                  )}
                </div>

                {quality.errors.length > 0 && (
                  <div>
                    <h4 className="font-medium text-red-600 mb-2">Errors (Blockers)</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-red-600">
                      {quality.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}
                    </ul>
                  </div>
                )}

                {quality.warnings.length > 0 && (
                  <div>
                    <h4 className="font-medium text-amber-600 mb-2">Warnings</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-amber-600">
                      {quality.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        
        {activeTab === "history" && (
          <Card>
            <CardHeader><CardTitle>History Log</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Detailed history will appear here.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
