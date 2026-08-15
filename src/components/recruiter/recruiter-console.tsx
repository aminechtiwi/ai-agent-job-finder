"use client";

import { useMemo, useRef, useState } from "react";
import {
  Play,
  RotateCcw,
  Sparkles,
  Terminal,
  FileText,
  Search,
  Copy,
  Check,
  Download,
  AlertCircle,
  User,
  Briefcase,
  Link2,
  Upload,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useRecruiterAgent } from "@/hooks/use-recruiter-agent";
import { useToast } from "@/hooks/use-toast";
import { Stepper } from "./stepper";
import { ReportView } from "./report-view";
import { RunHistory } from "./run-history";
import { SAMPLE_CV } from "./sample-cv";
import { cn } from "@/lib/utils";

const PHASE_LABEL = ["System", "Phase 1", "Phase 2", "Phase 3"] as const;

export function RecruiterConsole() {
  const agent = useRecruiterAgent();
  const { toast } = useToast();
  const [cvText, setCvText] = useState("");
  const [copied, setCopied] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canRun = cvText.trim().length >= 20 && agent.status !== "running";
  const isRunning = agent.status === "running";

  const handleRun = () => {
    if (!canRun) return;
    void agent.run(cvText.trim());
    // Bump history key so the history list refreshes after completion-ish.
    setTimeout(() => setHistoryKey((k) => k + 1), 1500);
  };

  const handleSample = () => {
    setCvText(SAMPLE_CV);
    toast({ title: "Sample CV loaded", description: "Senior PM @ Paystack profile." });
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so the same file can be re-selected.
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast({ title: "Invalid file", description: "Please upload a PDF file.", variant: "destructive" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 10 MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/recruiter/parse-pdf", {
        method: "POST",
        body: formData,
      });

      const data = await res.json() as { text?: string; error?: string };
      if (!res.ok || !data.text) {
        toast({
          title: "PDF parsing failed",
          description: data.error ?? "Could not extract text from the PDF.",
          variant: "destructive",
        });
        return;
      }

      setCvText(data.text);
      toast({
        title: "PDF uploaded successfully",
        description: `Extracted ${data.text.length.toLocaleString()} characters from "${file.name}".`,
      });
    } catch {
      toast({ title: "Upload failed", description: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    agent.reset();
  };

  const handleCopyReport = async () => {
    if (!agent.report) return;
    try {
      await navigator.clipboard.writeText(agent.report);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast({ title: "Report copied to clipboard" });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const handleDownloadReport = () => {
    if (!agent.report) return;
    const blob = new Blob([agent.report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const name =
      agent.profile?.candidateName?.replace(/\s+/g, "-").toLowerCase() ??
      "candidate";
    a.download = `career-report-${name}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSelectHistory = async (runId: string) => {
    await agent.loadRun(runId);
    setHistoryKey((k) => k + 1);
  };

  const totalResults = useMemo(
    () => agent.searchHits.reduce((n, h) => n + h.results.length, 0),
    [agent.searchHits],
  );

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      {/* ----------------------------------------------------------- INPUT */}
      <section className="flex flex-col rounded-2xl border bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-sm font-bold text-emerald-700 dark:text-emerald-400">
              1
            </span>
            <h2 className="text-sm font-semibold">Candidate CV</h2>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isRunning || uploading}
              className="h-8 text-xs text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  Parsing…
                </>
              ) : (
                <>
                  <Upload className="mr-1 h-3.5 w-3.5" />
                  Upload PDF
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSample}
              className="h-8 text-xs text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
            >
              <Sparkles className="mr-1 h-3.5 w-3.5" />
              Load sample
            </Button>
          </div>
          {/* Hidden file input for PDF upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => void handlePdfUpload(e)}
            className="hidden"
            aria-label="Upload PDF CV"
          />
        </div>

        <Textarea
          value={cvText}
          onChange={(e) => setCvText(e.target.value)}
          placeholder={
            "Paste the candidate's CV text here, or click \"Upload PDF\" to import from a file…\n\nInclude work history, skills, tools, education, and certifications. The agent will parse it in Phase 1."
          }
          className="min-h-[340px] flex-1 resize-none font-mono text-xs leading-relaxed"
          disabled={isRunning || uploading}
        />

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            {cvText.trim().length.toLocaleString()} chars
            {cvText.trim().length > 0 && cvText.trim().length < 20 && (
              <span className="ml-2 text-amber-600 dark:text-amber-400">
                · min 20 characters
              </span>
            )}
          </span>
          <div className="flex items-center gap-2">
            {(agent.status === "done" || agent.status === "error") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-9"
              >
                <RotateCcw className="mr-1 h-3.5 w-3.5" />
                Reset
              </Button>
            )}
            <Button
              onClick={handleRun}
              disabled={!canRun}
              className="h-9 bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
            >
              {isRunning ? (
                <>
                  <span className="mr-1 h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Running…
                </>
              ) : (
                <>
                  <Play className="mr-1 h-3.5 w-3.5" />
                  Run Agent
                </>
              )}
            </Button>
          </div>
        </div>

        <p className="mt-3 rounded-lg bg-muted/50 p-2.5 text-[11px] leading-relaxed text-muted-foreground">
          Upload a <span className="font-medium text-foreground">PDF</span> or paste text, then run the 3-phase workflow:{" "}
          <span className="font-medium text-foreground">CV parsing</span> →{" "}
          <span className="font-medium text-foreground">
            live Google & LinkedIn research
          </span>{" "}
          →{" "}
          <span className="font-medium text-foreground">
            job matching & report
          </span>
          . Progress streams in real time on the right.
        </p>
      </section>

      {/* --------------------------------------------------------- CONSOLE */}
      <section className="flex min-h-[480px] flex-col rounded-2xl border bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-sm font-bold text-emerald-700 dark:text-emerald-400">
              2
            </span>
            <h2 className="text-sm font-semibold">Agent Console</h2>
          </div>
          {agent.runId && (
            <Badge variant="outline" className="font-mono text-[10px]">
              run · {agent.runId.slice(-8)}
            </Badge>
          )}
        </div>

        <Stepper phases={agent.phases} active={isRunning} />

        <ScrollArea className="mt-4 max-h-[620px] flex-1 pr-2">
          <div className="space-y-4">
            {/* Error banner */}
            {agent.error && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">Agent error</p>
                  <p className="mt-0.5 text-xs opacity-90">{agent.error}</p>
                </div>
              </div>
            )}

            {/* Live log */}
            {agent.logs.length > 0 && (
              <div className="rounded-xl border bg-background/60">
                <div className="flex items-center gap-2 border-b px-3 py-2">
                  <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Live log
                  </span>
                </div>
                <div className="max-h-44 space-y-1 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed">
                  {agent.logs.map((entry) => (
                    <div key={entry.id} className="flex gap-2">
                      <span className="shrink-0 text-muted-foreground">
                        {PHASE_LABEL[entry.phase]}
                      </span>
                      <span
                        className={cn(
                          entry.kind === "success" &&
                            "text-emerald-600 dark:text-emerald-400",
                          entry.kind === "error" && "text-destructive",
                          entry.kind === "info" && "text-foreground/80",
                        )}
                      >
                        {entry.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Profile summary */}
            {agent.profile && (
              <div className="rounded-xl border p-4">
                <div className="mb-3 flex items-center gap-2">
                  <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-semibold">
                    Candidate Profile Summary
                  </h3>
                  <Badge variant="secondary" className="ml-auto text-[10px]">
                    Phase 1
                  </Badge>
                </div>
                <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
                  <Field
                    label="Name"
                    value={agent.profile.candidateName ?? "—"}
                  />
                  <Field
                    label="Primary Domain"
                    value={agent.profile.primaryDomain}
                  />
                  <Field
                    label="Seniority"
                    value={agent.profile.seniorityLevel}
                  />
                  <Field
                    label="Years Exp."
                    value={
                      agent.profile.yearsOfExperience != null
                        ? `${agent.profile.yearsOfExperience} yrs`
                        : "—"
                    }
                  />
                  <Field
                    label="Hard Skills"
                    value={`${agent.profile.hardSkills.length}`}
                  />
                  <Field
                    label="Soft Skills"
                    value={`${agent.profile.softSkills.length}`}
                  />
                </dl>
                <div className="mt-3">
                  <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Top 5 Core Competencies
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.profile.coreCompetencies.map((c, idx) => (
                      <span
                        key={`comp-${idx}-${c}`}
                        className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
                {agent.profile.titleVariations.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Title Variations
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {agent.profile.titleVariations.map((t, idx) => (
                        <span
                          key={`title-${idx}-${t}`}
                          className="rounded-md border bg-background px-2 py-0.5 text-xs"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {agent.profile.summary && (
                  <p className="mt-3 rounded-lg bg-muted/40 p-2.5 text-xs italic text-muted-foreground">
                    “{agent.profile.summary}”
                  </p>
                )}
              </div>
            )}

            {/* Search queries + hits */}
            {agent.queries.length > 0 && (
              <div className="rounded-xl border p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Search className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-semibold">
                    Live Market Research
                  </h3>
                  <Badge variant="secondary" className="ml-auto text-[10px]">
                    Phase 2 · {totalResults} results
                  </Badge>
                </div>
                <Accordion type="multiple" className="w-full">
                  {agent.searchHits.map((hit, i) => (
                    <AccordionItem
                      key={`hit-${i}-${hit.query.slice(0, 24)}`}
                      value={`q-${i}`}
                      className="border-b last:border-b-0"
                    >
                      <AccordionTrigger className="py-2 text-xs hover:no-underline">
                        <span className="flex items-center gap-2 truncate text-left">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-bold">
                            {i + 1}
                          </span>
                          <span className="truncate font-mono text-[11px] text-foreground/80">
                            {hit.query}
                          </span>
                          <Badge
                            variant="outline"
                            className="ml-1 shrink-0 text-[10px]"
                          >
                            {hit.results.length}
                          </Badge>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-3">
                        {hit.results.length === 0 ? (
                          <p className="px-1 text-xs text-muted-foreground">
                            No results returned.
                          </p>
                        ) : (
                          <ul className="space-y-2">
                            {hit.results.map((r, j) => (
                              <li
                                key={`res-${i}-${j}-${r.url.slice(-12)}`}
                                className="rounded-lg border bg-background/60 p-2"
                              >
                                <a
                                  href={r.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-start gap-1.5 text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                                >
                                  <Link2 className="mt-0.5 h-3 w-3 shrink-0" />
                                  <span className="line-clamp-2">{r.title || r.url}</span>
                                </a>
                                {r.snippet && (
                                  <p className="mt-1 line-clamp-3 pl-4 text-[11px] text-muted-foreground">
                                    {r.snippet}
                                  </p>
                                )}
                                {r.host && (
                                  <p className="mt-1 pl-4 text-[10px] text-muted-foreground/70">
                                    {r.host}
                                  </p>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}

            {/* Final report */}
            {agent.report && (
              <div className="rounded-xl border-2 border-emerald-500/30 bg-emerald-500/[0.02] p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-sm font-semibold">Final Report</h3>
                    <Badge variant="secondary" className="text-[10px]">
                      Phase 3
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyReport}
                      className="h-8 px-2 text-xs"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span className="ml-1">{copied ? "Copied" : "Copy"}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDownloadReport}
                      className="h-8 px-2 text-xs"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="ml-1">.md</span>
                    </Button>
                  </div>
                </div>
                <ReportView markdown={agent.report} />
                {agent.durationMs != null && (
                  <p className="mt-4 border-t pt-2 text-[11px] text-muted-foreground">
                    Generated in {(agent.durationMs / 1000).toFixed(1)}s across
                    3 phases using live web search + LLM reasoning.
                  </p>
                )}
              </div>
            )}

            {/* Empty state */}
            {!agent.profile &&
              !agent.report &&
              !agent.error &&
              agent.logs.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                    <Briefcase className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-sm font-medium">Agent idle</p>
                  <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                    Paste a CV on the left and hit{" "}
                    <span className="font-medium text-foreground">Run Agent</span>{" "}
                    to start the 3-phase analysis. Results stream here in real
                    time.
                  </p>
                </div>
              )}
          </div>
        </ScrollArea>
      </section>
      </div>

      {/* ----------------------------------------------------- HISTORY */}
      <RunHistory
        activeRunId={agent.runId}
        onSelect={handleSelectHistory}
        refreshKey={historyKey}
      />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-sm font-medium text-foreground">
        {value}
      </dd>
    </div>
  );
}
