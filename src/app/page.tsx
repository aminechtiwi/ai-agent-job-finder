import { RecruiterConsole } from "@/components/recruiter/recruiter-console";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, Github, Globe, Radar } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      {/* ------------------------------------------------------------- HEADER */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <BrainCircuit className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold leading-tight sm:text-base">
              Autonomous Recruiter &amp; Headhunter Agent
            </h1>
            <p className="truncate text-[11px] text-muted-foreground sm:text-xs">
              CV parsing → live Google &amp; LinkedIn research → job-match report
            </p>
          </div>
          <div className="ml-auto hidden items-center gap-2 sm:flex">
            <Badge
              variant="outline"
              className="gap-1 border-emerald-500/30 text-[11px] text-emerald-700 dark:text-emerald-400"
            >
              <Radar className="h-3 w-3" />
              Live web research
            </Badge>
            <Badge
              variant="outline"
              className="gap-1 text-[11px] text-muted-foreground"
            >
              <Globe className="h-3 w-3" />
              LLM + Web Search
            </Badge>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------- MAIN */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {/* Hero strip */}
        <section className="mb-6 rounded-2xl border bg-gradient-to-br from-emerald-500/10 via-background to-background p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-lg font-bold tracking-tight sm:text-xl">
                Upload a CV (PDF or text). Get a market-ready career match report.
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                The agent runs a strict 3-phase workflow — it extracts skills &amp;
                seniority, queries live Google &amp; LinkedIn job data, then maps
                the candidate to the top 3 compatible roles. No hallucinated
                links, strict seniority alignment.
              </p>
            </div>
            <ol className="flex shrink-0 flex-wrap gap-2 text-xs">
              {[
                { n: "1", t: "Parse CV" },
                { n: "2", t: "Web research" },
                { n: "3", t: "Match & report" },
              ].map((s) => (
                <li
                  key={s.n}
                  className="flex items-center gap-1.5 rounded-lg border bg-background/70 px-2.5 py-1.5"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-600 text-[10px] font-bold text-white">
                    {s.n}
                  </span>
                  <span className="font-medium">{s.t}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <RecruiterConsole />
      </main>

      {/* ------------------------------------------------------------ FOOTER */}
      <footer className="mt-auto border-t bg-background">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p className="flex items-center gap-1.5">
            <BrainCircuit className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            Autonomous Recruiter Agent — powered by LLM + Web Search
          </p>
          <p className="flex items-center gap-1.5">
            <Github className="h-3.5 w-3.5" />
            Built with Next.js 16 &amp; Prisma
          </p>
        </div>
      </footer>
    </div>
  );
}
