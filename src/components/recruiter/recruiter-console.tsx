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
  Briefcase,
  Upload,
  Loader2,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  History,
  Bot,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRecruiterAgent } from "@/hooks/use-recruiter-agent";
import { useToast } from "@/hooks/use-toast";
import { Stepper } from "./stepper";
import { ReportView } from "./report-view";
import { RunHistory } from "./run-history";
import { SAMPLE_CVS } from "./sample-cv";
import { cn } from "@/lib/utils";

const PHASE_LABEL = ["System", "Phase 1", "Phase 2", "Phase 3"] as const;

export function RecruiterConsole() {
  const agent = useRecruiterAgent();
  const { toast } = useToast();
  const [cvText, setCvText] = useState("");
  const [copied, setCopied] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [showLiveLog, setShowLiveLog] = useState(false);
  const [viewMode, setViewMode] = useState<"input" | "dashboard">("input");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canRun = cvText.trim().length >= 20 && agent.status !== "running";
  const isRunning = agent.status === "running";
  const isCompleted = agent.status === "done" || Boolean(agent.report);

  // Automatically switch to dashboard view when agent starts running
  const handleRun = () => {
    if (!canRun) return;
    setViewMode("dashboard");
    void agent.run(cvText.trim());
    setTimeout(() => setHistoryKey((k) => k + 1), 1500);
  };

  const handleSelectSample = (key: keyof typeof SAMPLE_CVS) => {
    const sample = SAMPLE_CVS[key];
    setCvText(sample.text);
    toast({
      title: "Sample Loaded",
      description: `Loaded ${sample.label}`,
    });
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

      const data = (await res.json()) as { text?: string; error?: string };
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

  const handleBackToInput = () => {
    setViewMode("input");
  };

  const handleReset = () => {
    agent.reset();
    setViewMode("input");
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
    const name = agent.profile?.candidateName?.replace(/\s+/g, "-").toLowerCase() ?? "candidate";
    a.download = `career-report-${name}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSelectHistory = async (runId: string) => {
    await agent.loadRun(runId);
    setHistoryKey((k) => k + 1);
    setViewMode("dashboard");
  };

  const totalResults = useMemo(
    () => agent.searchHits.reduce((n, h) => n + h.results.length, 0),
    [agent.searchHits],
  );

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- VIEW 1: CV INPUT / PARSE PAGE */}
      {viewMode === "input" && (
        <div className="mx-auto max-w-4xl space-y-6 animate-in fade-in duration-300">
          {/* Main Upload / Input Card */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-xs">
                  1
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-foreground">
                    Upload or Paste Candidate CV
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Import as PDF or paste raw text to initiate AI market matching.
                  </p>
                </div>
              </div>

              {/* Upload PDF action button */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isRunning || uploading}
                  className="h-9 px-3.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs gap-1.5"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Parsing PDF…
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5" />
                      Upload PDF File
                    </>
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => void handlePdfUpload(e)}
                  className="hidden"
                  aria-label="Upload PDF CV"
                />
              </div>
            </div>

            {/* Demo Sample CV Selector */}
            <div className="pt-4 pb-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" /> Quick Samples:
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectSample("embedded")}
                className="h-7 text-xs rounded-full border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-700"
              >
                ⚡ Embedded Engineer (Tunisia)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectSample("product")}
                className="h-7 text-xs rounded-full border-border/80 hover:bg-muted"
              >
                💼 Product Manager (SaaS)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectSample("fullstack")}
                className="h-7 text-xs rounded-full border-border/80 hover:bg-muted"
              >
                🤖 Full-Stack AI Engineer
              </Button>
            </div>

            {/* Textarea */}
            <div className="space-y-2 pt-1">
              <Textarea
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
                placeholder={
                  "Paste candidate resume / CV text here (work experience, skills, education, certifications, contact info)…\n\nOr click 'Upload PDF' above to automatically parse a file."
                }
                className="min-h-[300px] sm:min-h-[360px] w-full resize-y font-mono text-xs leading-relaxed rounded-2xl p-4 bg-muted/20 border-border/70 focus-visible:ring-emerald-500/50"
                disabled={isRunning || uploading}
              />

              <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
                <span>
                  {cvText.trim().length.toLocaleString()} characters
                  {cvText.trim().length > 0 && cvText.trim().length < 20 && (
                    <span className="ml-2 text-amber-600 dark:text-amber-400 font-medium">
                      · minimum 20 characters required
                    </span>
                  )}
                </span>
                {cvText.trim().length > 0 && (
                  <button
                    onClick={() => setCvText("")}
                    className="text-xs text-muted-foreground hover:text-destructive underline"
                  >
                    Clear text
                  </button>
                )}
              </div>
            </div>

            {/* Main Launch Button */}
            <div className="pt-6 mt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground">
                Runs live Google &amp; LinkedIn market search + AI company matching.
              </div>

              <Button
                onClick={handleRun}
                disabled={!canRun}
                className="h-11 px-6 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md rounded-xl gap-2 self-stretch sm:self-auto transition-all"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing &amp; Matching…
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Launch AI Job Matcher
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Past History Accordion */}
          <div className="pt-2">
            <RunHistory key={historyKey} onSelectRun={handleSelectHistory} />
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- VIEW 2: RESEARCH & RESULTS DASHBOARD (FULL WIDTH) */}
      {viewMode === "dashboard" && (
        <div className="w-full space-y-6 animate-in fade-in duration-300">
          {/* Top Navigation Bar with Back Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToInput}
                className="h-9 px-3 text-xs font-semibold gap-1.5 rounded-xl border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-700 text-foreground shadow-2xs"
              >
                <ArrowLeft className="h-4 w-4" />
                Upload Another CV / Modify
              </Button>

              <div className="hidden md:flex items-center gap-2">
                <span className="h-4 w-px bg-border" />
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    isRunning
                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 animate-pulse"
                      : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                  )}
                >
                  {isRunning ? "Agent Running: Phase " + agent.activePhase : "Analysis Complete"}
                </Badge>
              </div>
            </div>

            {/* Dashboard Action Controls */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLiveLog(!showLiveLog)}
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1"
              >
                <Terminal className="h-3.5 w-3.5" />
                <span>Live Logs</span>
                {showLiveLog ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>

              {agent.report && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyReport}
                    className="h-8 px-2.5 text-xs gap-1 rounded-lg"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadReport}
                    className="h-8 px-2.5 text-xs gap-1 rounded-lg"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>.md</span>
                  </Button>
                </>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Reset
              </Button>
            </div>
          </div>

          {/* Stepper Progress */}
          <div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-xs">
            <Stepper phases={agent.phases} active={isRunning} />

            {/* Collapsible Live Agent Terminal Log */}
            {(showLiveLog || isRunning) && agent.logs.length > 0 && (
              <div className="mt-4 rounded-xl border bg-zinc-950 p-3.5 font-mono text-xs text-zinc-200">
                <div className="mb-2 flex items-center justify-between text-[11px] text-zinc-400 border-b border-zinc-800 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="h-3.5 w-3.5 text-emerald-400" /> Live Execution Stream
                  </span>
                  <span className="text-[10px]">{agent.logs.length} events logged</span>
                </div>
                <ScrollArea className="h-32 w-full pr-3">
                  <div className="space-y-1">
                    {agent.logs.map((log, i) => (
                      <div key={i} className="flex items-start gap-2 leading-relaxed">
                        <span className="shrink-0 text-emerald-500 font-bold">[{PHASE_LABEL[log.phase]}]:</span>
                        <span className="text-zinc-300">{log.message}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>

          {/* Agent Error Banner */}
          {agent.error && (
            <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-5 text-sm text-destructive shadow-xs">
              <div className="flex items-center gap-2 font-bold mb-1">
                <AlertCircle className="h-5 w-5" /> Agent Error
              </div>
              <p className="text-xs leading-relaxed">{agent.error}</p>
            </div>
          )}

          {/* Full-Width Report & Job Cards Dashboard */}
          {agent.report && (
            <div className="space-y-6">
              <ReportView markdown={agent.report} />
            </div>
          )}

          {/* Running Placeholder State */}
          {isRunning && !agent.report && (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed p-12 text-center bg-muted/10 space-y-4">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
                <Loader2 className="h-7 w-7 text-emerald-600 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">
                  AI Agent is Researching Market Opportunities…
                </h3>
                <p className="text-xs text-muted-foreground max-w-md">
                  Analyzing skills, querying live Google &amp; LinkedIn databases, and compiling company job matches.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
