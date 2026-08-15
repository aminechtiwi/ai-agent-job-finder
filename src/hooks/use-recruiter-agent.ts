"use client";

import { useCallback, useRef, useState } from "react";
import type {
  AgentEvent,
  CandidateProfile,
  SearchHit,
} from "@/lib/agent/types";

export type AgentStatus = "idle" | "running" | "done" | "error";

export interface PhaseState {
  status: "pending" | "active" | "done";
  steps: string[];
}

export interface LogEntry {
  id: number;
  phase: 1 | 2 | 3 | 0; // 0 = system
  message: string;
  kind: "info" | "success" | "error";
  ts: number;
}

export interface UseRecruiterAgent {
  status: AgentStatus;
  runId: string | null;
  phases: [PhaseState, PhaseState, PhaseState];
  logs: LogEntry[];
  profile: CandidateProfile | null;
  queries: string[];
  searchHits: SearchHit[];
  report: string | null;
  error: string | null;
  durationMs: number | null;
  run: (cvText: string) => Promise<void>;
  reset: () => VoidFunction;
  loadRun: (runId: string) => Promise<void>;
  clearLogs: () => void;
}

const initialPhases = (): [PhaseState, PhaseState, PhaseState] => [
  { status: "pending", steps: [] },
  { status: "pending", steps: [] },
  { status: "pending", steps: [] },
];

/**
 * Drives the recruiter agent over SSE. Parses the streaming events
 * emitted by /api/recruiter/run and exposes reactive state for the UI.
 */
export function useRecruiterAgent(): UseRecruiterAgent {
  const [status, setStatus] = useState<AgentStatus>("idle");
  const [runId, setRunId] = useState<string | null>(null);
  const [phases, setPhases] = useState<
    [PhaseState, PhaseState, PhaseState]
  >(initialPhases);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [queries, setQueries] = useState<string[]>([]);
  const [searchHits, setSearchHits] = useState<SearchHit[]>([]);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const logIdRef = useRef(0);

  const pushLog = useCallback(
    (phase: 1 | 2 | 3 | 0, message: string, kind: LogEntry["kind"] = "info") => {
      // Capture the id NOW, outside the updater. If we read logIdRef.current
      // lazily inside the updater, React's batched execution means every
      // batched updater would read the SAME (final) ref value → duplicate keys.
      logIdRef.current += 1;
      const id = logIdRef.current;
      setLogs((prev) => [
        ...prev,
        {
          id,
          phase,
          message,
          kind,
          ts: Date.now(),
        },
      ]);
    },
    [],
  );

  const reset = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setStatus("idle");
    setRunId(null);
    setPhases(initialPhases());
    setLogs([]);
    setProfile(null);
    setQueries([]);
    setSearchHits([]);
    setReport(null);
    setError(null);
    setDurationMs(null);
    logIdRef.current = 0;
    // returning no-op to satisfy a stable signature while keeping the
    // call site ergonomic.
    return () => undefined;
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  const applyEvent = useCallback(
    (event: AgentEvent) => {
      switch (event.type) {
        case "phase:start":
          setPhases((prev) => {
            const next = [...prev] as [PhaseState, PhaseState, PhaseState];
            next[event.phase - 1] = {
              ...next[event.phase - 1],
              status: "active",
            };
            return next;
          });
          pushLog(event.phase, `Phase ${event.phase} — ${event.label}`);
          break;
        case "phase:done":
          setPhases((prev) => {
            const next = [...prev] as [PhaseState, PhaseState, PhaseState];
            next[event.phase - 1] = {
              ...next[event.phase - 1],
              status: "done",
            };
            return next;
          });
          pushLog(event.phase, `Phase ${event.phase} complete.`, "success");
          break;
        case "step":
          pushLog(event.phase, event.message);
          setPhases((prev) => {
            const next = [...prev] as [PhaseState, PhaseState, PhaseState];
            next[event.phase - 1] = {
              ...next[event.phase - 1],
              steps: [...next[event.phase - 1].steps, event.message],
            };
            return next;
          });
          break;
        case "profile":
          setProfile(event.profile);
          break;
        case "queries":
          setQueries(event.queries);
          break;
        case "search-hit":
          setSearchHits((prev) => [...prev, event.hit]);
          break;
        case "report":
          setReport(event.report);
          break;
        case "done":
          setDurationMs(event.durationMs);
          setStatus("done");
          pushLog(0, `Agent finished in ${(event.durationMs / 1000).toFixed(1)}s.`, "success");
          break;
        case "error":
          setError(event.message);
          setStatus("error");
          pushLog(0, event.message, "error");
          break;
      }
    },
    [pushLog],
  );

  const run = useCallback(
    async (cvText: string) => {
      if (abortRef.current) abortRef.current.abort();

      // Fresh state for a new run.
      setPhases(initialPhases());
      setLogs([]);
      setProfile(null);
      setQueries([]);
      setSearchHits([]);
      setReport(null);
      setError(null);
      setDurationMs(null);
      setRunId(null);
      setStatus("running");
      logIdRef.current = 0;

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/recruiter/run", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ cvText }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          let msg = `Request failed (${res.status})`;
          try {
            const data = await res.json();
            msg = data.error ?? msg;
          } catch {
            // ignore
          }
          setError(msg);
          setStatus("error");
          pushLog(0, msg, "error");
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // SSE frames are separated by a blank line.
          let sep: number;
          while ((sep = buffer.indexOf("\n\n")) !== -1) {
            const raw = buffer.slice(0, sep);
            buffer = buffer.slice(sep + 2);

            let eventType = "message";
            let dataStr = "";
            for (const line of raw.split("\n")) {
              if (line.startsWith("event:")) {
                eventType = line.slice(6).trim();
              } else if (line.startsWith("data:")) {
                dataStr += line.slice(5).trim();
              }
            }

            if (eventType === "run:start") {
              try {
                const parsed = JSON.parse(dataStr) as { runId: string };
                setRunId(parsed.runId);
              } catch {
                // ignore
              }
              continue;
            }

            if (!dataStr) continue;
            try {
              const event = JSON.parse(dataStr) as AgentEvent;
              applyEvent(event);
            } catch {
              // ignore malformed frame
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setStatus("error");
        pushLog(0, message, "error");
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
      }
    },
    [applyEvent, pushLog],
  );

  const loadRun = useCallback(
    async (id: string) => {
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
      try {
        const res = await fetch(`/api/recruiter/runs/${id}`);
        if (!res.ok) {
          throw new Error(`Failed to load run (${res.status})`);
        }
        const data = (await res.json()) as {
          run: {
            id: string;
            candidateName: string | null;
            cvText: string;
            profile: CandidateProfile | null;
            searchQueries: string[];
            searchHits: SearchHit[];
            report: string | null;
            status: string;
            error: string | null;
            durationMs: number | null;
            createdAt: string;
          };
        };

        const r = data.run;
        setPhases([
          {
            status: r.profile ? "done" : "pending",
            steps: r.profile ? ["Loaded from history."] : [],
          },
          {
            status: r.searchQueries.length ? "done" : "pending",
            steps: r.searchHits.length
              ? [`${r.searchHits.length} search queries executed.`]
              : [],
          },
          {
            status: r.report ? "done" : "pending",
            steps: r.report ? ["Report loaded."] : [],
          },
        ]);
        setProfile(r.profile);
        setQueries(r.searchQueries);
        setSearchHits(r.searchHits);
        setReport(r.report);
        setError(r.error);
        setDurationMs(r.durationMs);
        setRunId(r.id);
        setStatus(r.status === "completed" ? "done" : r.status === "failed" ? "error" : "idle");
        setLogs(
          r.error
            ? [
                {
                  id: 1,
                  phase: 0,
                  message: r.error,
                  kind: "error" as const,
                  ts: new Date(r.createdAt).getTime(),
                },
              ]
            : [
                {
                  id: 1,
                  phase: 0,
                  message: `Loaded run from ${new Date(r.createdAt).toLocaleString()}.`,
                  kind: "info" as const,
                  ts: new Date(r.createdAt).getTime(),
                },
              ],
        );
        logIdRef.current = 1;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setStatus("error");
      }
    },
    [],
  );

  return {
    status,
    runId,
    phases,
    logs,
    profile,
    queries,
    searchHits,
    report,
    error,
    durationMs,
    run,
    reset,
    loadRun,
    clearLogs,
  };
}
