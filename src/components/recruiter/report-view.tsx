"use client";

import { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import {
  ExternalLink,
  Building2,
  MapPin,
  Briefcase,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  Search,
  CheckCircle2,
  Layers,
  GraduationCap,
  SlidersHorizontal,
  Filter,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ReportViewProps {
  markdown: string;
  className?: string;
}

interface ParsedReport {
  summary: {
    domain: string;
    seniority: string;
    location?: string;
    coreCompetencies: string[];
  };
  marketOverview?: string;
  matches: Array<{
    title: string;
    company: string;
    companyType?: string;
    location?: string;
    contractType?: string;
    matchScore?: number;
    whyItMatches: string;
    keyRequirements?: string[];
    skillsToHighlight: string[];
    url?: string;
  }>;
  topHiringCompanies?: Array<{
    name: string;
    sector: string;
    location: string;
  }>;
  recommendations: {
    keywordsToAdd: string[];
    upskilling: string;
  };
}

function extractReportJson(raw: string): ParsedReport | null {
  if (!raw) return null;
  const text = raw.trim();

  // 1. Direct parse
  try {
    const res = JSON.parse(text) as ParsedReport;
    if (res && res.matches && Array.isArray(res.matches)) return res;
  } catch {}

  // 2. Strip code fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    try {
      const res = JSON.parse(fenceMatch[1].trim()) as ParsedReport;
      if (res && res.matches && Array.isArray(res.matches)) return res;
    } catch {}
  }

  // 3. Find outermost { and }
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last > first) {
    try {
      const res = JSON.parse(text.slice(first, last + 1)) as ParsedReport;
      if (res && res.matches && Array.isArray(res.matches)) return res;
    } catch {}
  }

  return null;
}

export function ReportView({ markdown, className }: ReportViewProps) {
  const parsed = extractReportJson(markdown);
  const [filterType, setFilterType] = useState<"all" | "high" | "local" | "remote">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMatches = useMemo(() => {
    if (!parsed?.matches) return [];
    return parsed.matches.filter((m, idx) => {
      const score = m.matchScore || 95 - idx * 3;
      const textMatch =
        !searchQuery ||
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.skillsToHighlight.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!textMatch) return false;

      if (filterType === "high") return score >= 90;
      if (filterType === "local")
        return (
          m.location?.toLowerCase().includes("tunis") ||
          m.location?.toLowerCase().includes("local") ||
          m.location?.toLowerCase().includes("on-site")
        );
      if (filterType === "remote")
        return (
          m.location?.toLowerCase().includes("remote") ||
          m.location?.toLowerCase().includes("hybrid") ||
          m.location?.toLowerCase().includes("germany") ||
          m.location?.toLowerCase().includes("international")
        );

      return true;
    });
  }, [parsed?.matches, filterType, searchQuery]);

  if (parsed) {
    return (
      <div className={cn("space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500", className)}>
        {/* Candidate Profile Summary Banner */}
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-background to-background p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/70">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs">
                  <Briefcase className="h-4 w-4" />
                </span>
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                  {parsed.summary.domain} Profile
                </h3>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs font-semibold">
                  {parsed.summary.seniority}
                </Badge>
                {parsed.summary.location && (
                  <Badge variant="outline" className="text-xs bg-muted/60 text-muted-foreground">
                    <MapPin className="mr-1 h-3 w-3" /> {parsed.summary.location}
                  </Badge>
                )}
              </div>
              {parsed.marketOverview && (
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
                  {parsed.marketOverview}
                </p>
              )}
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground mr-1 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" /> Core Strengths:
              </span>
              {parsed.summary.coreCompetencies.map((skill, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 text-xs py-0.5 px-2"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Real Job Matches Section with Filters */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>All Matching Job Opportunities &amp; Offers</span>
                <Badge variant="secondary" className="bg-emerald-600 text-white text-xs font-bold px-2 py-0.5">
                  {parsed.matches.length} Offers
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Targeted matching across local hiring companies, multinational R&amp;D hubs, and remote positions.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("all")}
                className={cn("h-7 text-xs px-2.5 rounded-lg", filterType === "all" && "bg-emerald-600 text-white")}
              >
                All ({parsed.matches.length})
              </Button>
              <Button
                variant={filterType === "high" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("high")}
                className={cn("h-7 text-xs px-2.5 rounded-lg", filterType === "high" && "bg-emerald-600 text-white")}
              >
                90%+ Match
              </Button>
              <Button
                variant={filterType === "local" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("local")}
                className={cn("h-7 text-xs px-2.5 rounded-lg", filterType === "local" && "bg-emerald-600 text-white")}
              >
                Local Market
              </Button>
              <Button
                variant={filterType === "remote" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("remote")}
                className={cn("h-7 text-xs px-2.5 rounded-lg", filterType === "remote" && "bg-emerald-600 text-white")}
              >
                Remote / Global
              </Button>
            </div>
          </div>

          {/* Job Cards Grid */}
          <div className="grid gap-4">
            {filteredMatches.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed bg-muted/20 text-muted-foreground text-sm">
                No jobs match this specific filter. Switch to &quot;All&quot; to view all {parsed.matches.length} matching offers.
              </div>
            ) : (
              filteredMatches.map((match, i) => {
                const query = `${match.company} ${match.title}`.trim();
                const enc = encodeURIComponent(query);
                const companyEnc = encodeURIComponent(`${match.company} careers jobs`);

                const companyCareersUrl = `https://www.google.com/search?q=${companyEnc}`;
                const linkedInUrl = `https://www.linkedin.com/jobs/search/?keywords=${enc}&f_TPR=r2592000`;
                const googleJobsUrl = `https://www.google.com/search?q=${encodeURIComponent(query + " jobs")}&ibp=htl;jobs`;
                const indeedUrl = `https://www.indeed.com/jobs?q=${enc}`;
                const baytUrl = `https://www.bayt.com/en/international/jobs/?q=${enc}`;

                const score = match.matchScore || 96 - i * 3;

                return (
                  <div
                    key={i}
                    className="group rounded-2xl border border-border/90 bg-card p-5 sm:p-6 shadow-sm transition-all hover:border-emerald-500/50 hover:shadow-md relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500/40 group-hover:bg-emerald-500 transition-colors" />

                    <div className="flex flex-col gap-4 pl-1">
                      {/* Top Row: Title, Company, Match Score */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-lg sm:text-xl font-bold leading-snug text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                              {match.title}
                            </h4>
                            {match.contractType && (
                              <Badge variant="outline" className="text-xs bg-muted/50 font-normal shrink-0">
                                {match.contractType}
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5 font-bold text-foreground text-sm">
                              <Building2 className="h-4 w-4 text-emerald-600 shrink-0" />
                              {match.company}
                            </span>
                            {match.companyType && (
                              <span className="text-muted-foreground/80 hidden sm:inline">
                                • {match.companyType}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-muted-foreground font-medium">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />
                              {match.location || "Tunisia / Remote / Worldwide"}
                            </span>
                          </div>
                        </div>

                        {/* Match Score Badge (Protected from truncation) */}
                        <div className="shrink-0 self-start sm:self-auto">
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shadow-2xs">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                            {score}% Match
                          </span>
                        </div>
                      </div>

                      {/* Match Rationale */}
                      <div className="rounded-xl bg-muted/40 p-3.5 text-xs sm:text-sm leading-relaxed border border-border/60">
                        <p className="text-foreground/90">
                          <strong className="font-semibold text-emerald-700 dark:text-emerald-400">
                            Fit &amp; Rationale:
                          </strong>{" "}
                          {match.whyItMatches}
                        </p>
                      </div>

                      {/* Skills Chips */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1">
                          Matched Skills:
                        </span>
                        {match.skillsToHighlight.map((skill, j) => (
                          <span
                            key={j}
                            className="inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border/60"
                          >
                            ✓ {skill}
                          </span>
                        ))}
                      </div>

                      {/* Action Bar */}
                      <div className="pt-3 border-t flex flex-wrap items-center justify-between gap-3">
                        <a
                          href={companyCareersUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors shrink-0"
                        >
                          <Building2 className="h-4 w-4" />
                          Apply on {match.company} Careers
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </a>

                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-muted-foreground font-medium text-[11px] hidden sm:inline mr-1">
                            Direct Search:
                          </span>
                          <a
                            href={linkedInUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 font-medium transition-colors"
                          >
                            LinkedIn Jobs <ExternalLink className="h-3 w-3" />
                          </a>
                          <a
                            href={googleJobsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-500/20 border border-zinc-500/20 font-medium transition-colors"
                          >
                            Google Jobs <Search className="h-3 w-3" />
                          </a>
                          <a
                            href={indeedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 font-medium transition-colors"
                          >
                            Indeed <ExternalLink className="h-3 w-3" />
                          </a>
                          <a
                            href={baytUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 border border-amber-500/20 font-medium transition-colors"
                          >
                            Bayt <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Key Companies Directory Grid */}
        {parsed.topHiringCompanies && parsed.topHiringCompanies.length > 0 && (
          <div className="rounded-2xl border bg-card p-5 sm:p-6 shadow-sm">
            <h4 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2 mb-4">
              <Layers className="h-4 w-4 text-emerald-600" /> Active Hiring Companies in Your Domain
            </h4>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {parsed.topHiringCompanies.map((comp, idx) => (
                <div
                  key={idx}
                  className="flex flex-col justify-between p-3.5 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors text-xs"
                >
                  <div>
                    <h5 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-emerald-600 shrink-0" /> {comp.name}
                    </h5>
                    <p className="text-xs text-muted-foreground mt-0.5">{comp.sector}</p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1 font-medium">
                      <MapPin className="h-3.5 w-3.5 shrink-0" /> {comp.location}
                    </span>
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(comp.name + " careers jobs")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline flex items-center gap-0.5"
                    >
                      Careers <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strategic Career Recommendations */}
        <div className="rounded-2xl border border-dashed bg-muted/20 p-5 sm:p-6 space-y-4 text-xs sm:text-sm">
          <div className="flex items-center gap-2 font-bold text-base text-foreground">
            <TrendingUp className="h-5 w-5 text-emerald-600" /> Strategic Career &amp; Resume Optimization
          </div>

          <div>
            <span className="font-semibold text-muted-foreground block mb-2">High-Impact Keywords to Add to Your CV:</span>
            <div className="flex flex-wrap gap-2">
              {parsed.recommendations.keywordsToAdd.map((kw, i) => (
                <Badge key={i} variant="outline" className="border-emerald-500/30 bg-background font-medium text-xs px-2.5 py-1">
                  + {kw}
                </Badge>
              ))}
            </div>
          </div>

          {parsed.recommendations.upskilling && (
            <div className="flex items-start gap-3 bg-background p-4 rounded-xl border border-border/60">
              <GraduationCap className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-muted-foreground leading-relaxed">
                <strong className="font-semibold text-foreground">Recommended Skill / Certification:</strong>{" "}
                {parsed.recommendations.upskilling}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback to Markdown
  return (
    <div className={cn("prose-agent text-sm leading-relaxed text-foreground", className)}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 className="mt-0 text-xl font-bold tracking-tight text-foreground">{children}</h1>,
          h3: ({ children }) => <h3 className="mt-5 text-base font-semibold text-foreground">{children}</h3>,
          h4: ({ children }) => (
            <h4 className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {children}
            </h4>
          ),
          p: ({ children }) => <p className="my-1.5 text-sm leading-relaxed text-foreground/90">{children}</p>,
          ul: ({ children }) => <ul className="my-2 space-y-1.5 pl-1">{children}</ul>,
          li: ({ children }) => (
            <li className="relative pl-4 text-sm text-foreground/90 before:absolute before:left-0 before:top-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-emerald-500/60">
              {children}
            </li>
          ),
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic text-foreground/80">{children}</em>,
          hr: () => <hr className="my-4 border-0 border-t border-border" />,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-emerald-700 underline decoration-emerald-500/40 underline-offset-2 hover:decoration-emerald-500 dark:text-emerald-400"
            >
              {children}
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          ),
          code: ({ children }) => (
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">{children}</code>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-2 border-emerald-500/50 bg-emerald-500/5 py-2 pl-3 text-sm italic text-foreground/80">
              {children}
            </blockquote>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
