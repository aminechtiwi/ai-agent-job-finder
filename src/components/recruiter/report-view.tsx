"use client";

import ReactMarkdown from "react-markdown";
import {
  ExternalLink,
  Building2,
  MapPin,
  Briefcase,
  Sparkles,
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  Search,
  CheckCircle2,
  Layers,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export function ReportView({ markdown, className }: ReportViewProps) {
  let parsed: ParsedReport | null = null;
  let isJson = false;

  try {
    parsed = JSON.parse(markdown) as ParsedReport;
    if (parsed && parsed.matches && Array.isArray(parsed.matches)) {
      isJson = true;
    }
  } catch {
    isJson = false;
  }

  if (isJson && parsed) {
    return (
      <div className={cn("space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500", className)}>
        {/* Candidate & Market Overview Card */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border bg-background/80 p-3.5 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2">
              <Briefcase className="h-3.5 w-3.5" /> Candidate Level & Domain
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Domain:</span>
                <span className="font-medium text-foreground">{parsed.summary.domain}</span>
              </div>
              <div className="flex justify-between border-b pb-1 pt-0.5">
                <span className="text-muted-foreground">Seniority:</span>
                <span className="font-medium text-foreground">{parsed.summary.seniority}</span>
              </div>
              {parsed.summary.location && (
                <div className="flex justify-between pt-0.5">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-medium text-foreground">{parsed.summary.location}</span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-background/80 p-3.5 shadow-xs sm:col-span-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2">
              <Sparkles className="h-3.5 w-3.5" /> Core Competencies & Market Fit
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {parsed.summary.coreCompetencies.map((skill, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] py-0 px-2"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
              {parsed.marketOverview && (
                <p className="text-xs text-muted-foreground leading-relaxed pt-1.5 border-t">
                  {parsed.marketOverview}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Real Job Matches Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>Top Matched Job Opportunities</span>
              <Badge variant="secondary" className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-semibold">
                {parsed.matches.length} Matches Found
              </Badge>
            </h3>
          </div>

          <div className="space-y-4">
            {parsed.matches.map((match, i) => {
              const query = `${match.company} ${match.title}`.trim();
              const enc = encodeURIComponent(query);
              const companyEnc = encodeURIComponent(`${match.company} careers jobs`);

              const companyCareersUrl = `https://www.google.com/search?q=${companyEnc}`;
              const linkedInUrl = `https://www.linkedin.com/jobs/search/?keywords=${enc}&f_TPR=r2592000`;
              const googleJobsUrl = `https://www.google.com/search?q=${encodeURIComponent(query + " jobs")}&ibp=htl;jobs`;
              const indeedUrl = `https://www.indeed.com/jobs?q=${enc}`;
              const baytUrl = `https://www.bayt.com/en/international/jobs/?q=${enc}`;

              const score = match.matchScore || 92 - i * 4;

              return (
                <div
                  key={i}
                  className="group rounded-xl border border-border/80 bg-background/90 p-4 sm:p-5 shadow-xs transition-all hover:border-emerald-500/40 hover:shadow-md relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500/40 group-hover:bg-emerald-500 transition-colors" />

                  <div className="flex flex-col gap-3 pl-1">
                    {/* Header Row: Title + Contract Badge + Match Score */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base sm:text-lg font-bold leading-snug text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                            {match.title}
                          </h4>
                          {match.contractType && (
                            <Badge variant="outline" className="text-[11px] bg-muted/50 font-normal shrink-0">
                              {match.contractType}
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 font-semibold text-foreground">
                            <Building2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            {match.company}
                          </span>
                          {match.companyType && (
                            <span className="text-muted-foreground/80 hidden sm:inline">
                              • {match.companyType}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {match.location || "Tunisia / Remote / Worldwide"}
                          </span>
                        </div>
                      </div>

                      {/* Match Score Badge: Fixed with whitespace-nowrap and shrink-0 so it NEVER truncates */}
                      <div className="shrink-0">
                        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                          {score}% Match
                        </span>
                      </div>
                    </div>

                    {/* Match Rationale */}
                    <div className="rounded-lg bg-muted/40 p-3 text-xs leading-relaxed border border-border/50">
                      <p className="text-foreground/90">
                        <strong className="font-semibold text-emerald-700 dark:text-emerald-400">
                          Why this fits your profile:
                        </strong>{" "}
                        {match.whyItMatches}
                      </p>
                    </div>

                    {/* Skills Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mr-1">
                        Matched Skills:
                      </span>
                      {match.skillsToHighlight.map((skill, j) => (
                        <span
                          key={j}
                          className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border/60"
                        >
                          ✓ {skill}
                        </span>
                      ))}
                    </div>

                    {/* Clean Multi-Platform Actions Bar */}
                    <div className="mt-1 pt-3 border-t flex flex-wrap items-center justify-between gap-2">
                      {/* Primary Action Button */}
                      <a
                        href={companyCareersUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors shrink-0"
                      >
                        <Building2 className="h-3.5 w-3.5" />
                        {match.company} Careers
                        <ArrowUpRight className="h-3 w-3" />
                      </a>

                      {/* Secondary Job Board Links */}
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <a
                          href={linkedInUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-colors"
                        >
                          LinkedIn <ExternalLink className="h-3 w-3" />
                        </a>
                        <a
                          href={googleJobsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-500/20 border border-zinc-500/20 transition-colors"
                        >
                          Google Jobs <Search className="h-3 w-3" />
                        </a>
                        <a
                          href={indeedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 transition-colors"
                        >
                          Indeed <ExternalLink className="h-3 w-3" />
                        </a>
                        <a
                          href={baytUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 border border-amber-500/20 transition-colors"
                        >
                          Bayt <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Key Companies Section */}
        {parsed.topHiringCompanies && parsed.topHiringCompanies.length > 0 && (
          <div className="rounded-xl border bg-background/80 p-4 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5 mb-3">
              <Layers className="h-3.5 w-3.5 text-emerald-600" /> Key Companies Actively Recruiting in Your Domain
            </h4>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {parsed.topHiringCompanies.map((comp, idx) => (
                <div
                  key={idx}
                  className="flex flex-col justify-between p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors text-xs"
                >
                  <div>
                    <h5 className="font-bold text-foreground flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> {comp.name}
                    </h5>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{comp.sector}</p>
                  </div>
                  <div className="mt-2 pt-2 border-t flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0" /> {comp.location}
                    </span>
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(comp.name + " careers jobs")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-0.5"
                    >
                      Careers <ArrowUpRight className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strategic Career Recommendations */}
        <div className="rounded-xl border border-dashed bg-muted/20 p-4 space-y-3 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-foreground">
            <TrendingUp className="h-4 w-4 text-emerald-600" /> Strategic Career & Resume Optimization
          </div>

          <div>
            <span className="font-semibold text-muted-foreground">High-Impact Keywords to Add to Your CV:</span>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {parsed.recommendations.keywordsToAdd.map((kw, i) => (
                <Badge key={i} variant="outline" className="border-emerald-500/30 bg-background font-medium text-[11px]">
                  + {kw}
                </Badge>
              ))}
            </div>
          </div>

          {parsed.recommendations.upskilling && (
            <div className="flex items-start gap-2 bg-background p-2.5 rounded-lg border border-border/60 text-xs">
              <GraduationCap className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
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
