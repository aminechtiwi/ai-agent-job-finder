"use client";

import { useCallback, useEffect, useState } from "react";
import {
  History,
  RefreshCw,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface HistoryItem {
  id: string;
  candidateName: string | null;
  status: string;
  durationMs: number | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  primaryDomain: string;
  seniorityLevel: string;
  coreCompetencies: string[];
}

interface RunHistoryProps {
  activeRunId: string | null;
  onSelect: (runId: string) => void;
  refreshKey: number;
}

export function RunHistory({
  activeRunId,
  onSelect,
  refreshKey,
}: RunHistoryProps) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/recruiter/runs");
      if (!res.ok) throw new Error("Failed to load history");
      const data = (await res.json()) as { runs: HistoryItem[] };
      setItems(data.runs);
    } catch {
      // silently fail; history is non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const handleClearAll = useCallback(async () => {
    setClearing(true);
    try {
      const res = await fetch("/api/recruiter/runs?all=true", {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to clear history");
      setItems([]);
      toast({ title: "History cleared" });
    } catch {
      toast({
        title: "Could not clear history",
        variant: "destructive",
      });
    } finally {
      setClearing(false);
    }
  }, [toast]);

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-sm font-semibold">Run History</h2>
          <Badge variant="secondary" className="text-[10px]">
            {items.length}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void load()}
            disabled={loading}
            className="h-8 px-2 text-xs"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            <span className="sr-only">Refresh</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void handleClearAll()}
            disabled={clearing || items.length === 0}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="sr-only">Clear all</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No runs yet. Paste a CV and launch the agent to build a history.
        </p>
      ) : (
        <ScrollArea className="max-h-80">
          <ul className="space-y-2 pr-2">
            {items.map((item) => {
              const isActive = item.id === activeRunId;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(item.id)}
                    className={cn(
                      "w-full rounded-xl border p-3 text-left transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/5",
                      isActive
                        ? "border-emerald-500/50 bg-emerald-500/5"
                        : "border-border bg-background/60",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {item.candidateName ?? "Untitled candidate"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {item.primaryDomain} · {item.seniorityLevel}
                        </p>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(item.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {item.durationMs != null && (
                        <span>
                          {(item.durationMs / 1000).toFixed(1)}s
                        </span>
                      )}
                    </div>
                    {item.coreCompetencies.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.coreCompetencies.slice(0, 3).map((c, idx) => (
                          <span
                            key={`cc-${idx}-${c}`}
                            className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "completed") {
    return (
      <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="h-3 w-3" />
        Done
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="flex shrink-0 items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-semibold text-destructive">
        <XCircle className="h-3 w-3" />
        Failed
      </span>
    );
  }
  return (
    <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
      <Loader2 className="h-3 w-3 animate-spin" />
      Running
    </span>
  );
}
