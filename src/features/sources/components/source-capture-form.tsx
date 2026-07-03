"use client";

import { useActionState, useState } from "react";
import { acquireSourceAction, type SourceActionState } from "@/features/sources/actions/source.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SourceListItem } from "@/types/polibrawl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const initialSourceActionState: SourceActionState = {
  message: null,
  fieldErrors: {},
};

function FieldError({ state, name }: { state: SourceActionState; name: string }) {
  const message = state.fieldErrors[name]?.[0];
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

function ActionMessage({ state }: { state: SourceActionState }) {
  if (!state.message) return null;
  return <p className="text-sm text-destructive">{state.message}</p>;
}

export function SourceCaptureForm({ source }: { source: SourceListItem }) {
  const [state, action, isPending] = useActionState(acquireSourceAction, initialSourceActionState);
  const [activeTab, setActiveTab] = useState("auto");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acquire Source Snapshot</CardTitle>
        <CardDescription>
          Choose an acquisition method to capture the content of this source.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4 grid w-full grid-cols-5">
            <TabsTrigger value="auto">Auto</TabsTrigger>
            <TabsTrigger value="http">HTTP Fetch</TabsTrigger>
            <TabsTrigger value="browser">Browser</TabsTrigger>
            <TabsTrigger value="paste">Paste</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
          </TabsList>

          <form action={action} className="space-y-4">
            <input type="hidden" name="source_id" value={source.id} />
            <input type="hidden" name="method" value={activeTab === "upload" ? "upload_html" : activeTab} />

            {(activeTab === "auto" || activeTab === "http" || activeTab === "browser") && (
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  name="url"
                  defaultValue={source.url ?? ""}
                  placeholder="https://example.com/policy"
                  required
                  type="url"
                />
                <FieldError state={state} name="url" />
                <p className="text-xs text-muted-foreground mt-1">
                  {activeTab === "auto" && "Attempts HTTP Fetch first, falls back to Browser if blocked."}
                  {activeTab === "http" && "Standard fast HTTP request. Blocked by some CDNs."}
                  {activeTab === "browser" && "Headless Chromium capture. Slower but bypasses basic blocks."}
                </p>
              </div>
            )}

            {activeTab === "paste" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="pastedText">Pasted Text</Label>
                  <Textarea
                    id="pastedText"
                    name="pastedText"
                    rows={10}
                    placeholder="Paste the raw text here..."
                    required
                  />
                  <FieldError state={state} name="pastedText" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url-paste">Original URL (Optional)</Label>
                  <Input
                    id="url-paste"
                    name="url"
                    defaultValue={source.url ?? ""}
                    placeholder="https://example.com/policy"
                    type="url"
                  />
                  <FieldError state={state} name="url" />
                </div>
              </>
            )}

            {activeTab === "upload" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="uploadedContent">HTML or Text Content</Label>
                  <Textarea
                    id="uploadedContent"
                    name="uploadedContent"
                    rows={10}
                    placeholder="Paste the full HTML or Text content here..."
                    required
                  />
                  <FieldError state={state} name="uploadedContent" />
                  <p className="text-xs text-muted-foreground mt-1">
                    HTML content will be cleaned automatically.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url-upload">Original URL (Optional)</Label>
                  <Input
                    id="url-upload"
                    name="url"
                    defaultValue={source.url ?? ""}
                    placeholder="https://example.com/policy"
                    type="url"
                  />
                  <FieldError state={state} name="url" />
                </div>
              </>
            )}

            <ActionMessage state={state} />
            <Button type="submit" disabled={isPending}>
              {isPending ? "Acquiring..." : "Acquire Snapshot"}
            </Button>
          </form>
        </Tabs>
      </CardContent>
    </Card>
  );
}

