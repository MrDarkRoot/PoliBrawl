import { AlertTriangle } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function ConfigBanner() {
  return (
    <Card className="border-amber-300 bg-amber-50">
      <CardContent className="flex items-start gap-3 p-4 text-sm text-amber-950">
        <AlertTriangle className="mt-0.5 h-4 w-4" />
        <div>
          <p className="font-semibold">Supabase configuration is missing.</p>
          <p className="text-amber-900/80">
            Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
            `SUPABASE_SERVICE_ROLE_KEY` to run the admin application end-to-end.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
