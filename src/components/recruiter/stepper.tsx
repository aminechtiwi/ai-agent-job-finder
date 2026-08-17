"use client";

import { FileSearch, Globe, Target, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PhaseState } from "@/hooks/use-recruiter-agent";

interface StepperProps {
  phases: [PhaseState, PhaseState, PhaseState];
  active: boolean;
}

const PHASE_META = [
  {
    icon: FileSearch,
    label: "CV Extraction & Parsing",
    sub: "Skills · Seniority · Domain",
  },
  {
    icon: Globe,
    label: "Google & LinkedIn Research",
    sub: "Live job market data",
  },
  {
    icon: Target,
    label: "Evaluation & Mapping",
    sub: "Full market matches + report",
  },
] as const;

export function Stepper({ phases, active }: StepperProps) {
  return (
    <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {PHASE_META.map((meta, i) => {
        const phase = phases[i];
        const status = phase.status;
        const Icon = meta.icon;
        return (
          <li
            key={meta.label}
            className={cn(
              "relative rounded-xl border p-3 transition-colors",
              status === "done" &&
                "border-emerald-500/40 bg-emerald-500/5",
              status === "active" &&
                "border-emerald-500/60 bg-emerald-500/10 shadow-sm",
              status === "pending" &&
                "border-border bg-muted/30",
            )}
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-sm font-semibold",
                  status === "done" &&
                    "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
                  status === "active" &&
                    "border-emerald-500/60 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
                  status === "pending" &&
                    "border-border bg-background text-muted-foreground",
                )}
              >
                {status === "active" && active ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : status === "done" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Phase {i + 1}
                  </span>
                  {status === "active" && active && (
                    <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                      Running
                    </span>
                  )}
                </div>
                <p className="truncate text-sm font-semibold leading-tight">
                  {meta.label}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {meta.sub}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
