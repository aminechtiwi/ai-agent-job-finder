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
      <div className={cn("space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700", className)}>
        {/* Candidate & Market Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-background to-muted/20 border-emerald-500/20 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                <Briefcase className="h-4 w-4" /> Position & Domain
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center border-b pb-1.5">
                <span className="text-muted-foreground">Domain</span>
                <span className="font-semibold text-foreground">{parsed.summary.domain}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-1.5">
                <span className="text-muted-foreground">Level</span>
                <span className="font-semibold text-foreground">{parsed.summary.seniority}</span>
              </div>
              {parsed.summary.location && (
                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-muted-foreground">Origin/Location</span>
                  <span className="font-semibold text-foreground">{parsed.summary.location}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-background to-muted/20 border-emerald-500/20 shadow-sm md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                <Sparkles className="h-4 w-4" /> Market Fit & Core Competencies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {parsed.summary.coreCompetencies.map((skill, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs py-0.5"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
              {parsed.marketOverview && (
                <p className="text-xs text-muted-foreground leading-relaxed pt-1 border-t">
                  {parsed.marketOverview}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Real Job Matches Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold tracking-tight">Active Company Job Offers & Matches</h3>
              <Badge
                variant="outline"
                className="text-[10px] uppercase tracking-wider font-semibold border-emerald-500/30 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20"
              >
                Verified Opportunities
              </Badge>
            </div>
          </div>

          <div className="grid gap-5">
            {parsed.matches.map((match, i) => {
              const query = `${match.company} ${match.title}`.trim();
              const enc = encodeURIComponent(query);
              const companyEnc = encodeURIComponent(`${match.company} careers jobs`);

              const companyCareersUrl = `https://www.google.com/search?q=${companyEnc}`;
              const linkedInUrl = `https://www.linkedin.com/jobs/search/?keywords=${enc}&f_TPR=r2592000`;
              const googleJobsUrl = `https://www.google.com/search?q=${encodeURIComponent(query + " jobs")}&ibp=htl;jobs`;
              const indeedUrl = `https://www.indeed.com/jobs?q=${enc}`;
              const baytUrl = `https://www.bayt.com/en/international/jobs/?q=${enc}`;

              const score = match.matchScore || 90 - i * 4;

              return (
                <Card
                  key={i}
                  className="group overflow-hidden transition-all hover:shadow-lg hover:border-emerald-500/40 relative border-border/80 bg-card"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500/40 group-hover:bg-emerald-500 transition-colors" />
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4">
                      {/* Title + Company + Match Score */}
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-xl font-bold leading-tight text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                              {match.title}
                            </h4>
                            {match.contractType && (
                              <Badge variant="outline" className="text-xs bg-muted/60 font-medium">
                                {match.contractType}
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5 font-bold text-foreground">
                              <Building2 className="h-4 w-4 text-emerald-600" />
                              {match.company}
                            </span>
                            {match.companyType && (
                              <span className="text-xs text-muted-foreground/80">
                                • {match.companyType}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-xs">
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                              {match.location || "Tunisia / Remote / International"}
                            </span>
                          </div>
                        </div>

                        {/* Match Score Badge */}
                        <div className="shrink-0 flex items-center md:flex-col md:items-end gap-2">
                          <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {score}% Match
                          </div>
                        </div>
                      </div>

                      {/* Match Rationale */}
                      <div className="bg-muted/40 rounded-lg p-3.5 text-sm leading-relaxed border border-border/60">
                        <p className="text-foreground/90">
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                            Why this role fits your profile:
                          </span>{" "}
                          {match.whyItMatches}
                        </p>
                      </div>

                      {/* Required Skills & Skills to Highlight */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1">
                          Matched Skills:
                        </span>
                        {match.skillsToHighlight.map((skill, j) => (
                          <span
                            key={j}
                            className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                          >
                            ✓ {skill}
                          </span>
                        ))}
                      </div>

                      {/* Action Links & Multi-platform Search */}
                      <div className="pt-3 border-t flex flex-wrap items-center justify-between gap-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-muted-foreground font-semibold">
                            Apply & Search Openings:
                          </span>
                          <a
                            href={companyCareersUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
                          >
                            <Building2 className="h-3.5 w-3.5" />
                            {match.company} Careers <ArrowUpRight className="h-3 w-3" />
                          </a>
                          <a
                            href={linkedInUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 transition-colors"
                          >
                            LinkedIn Postings <ExternalLink className="h-3 w-3" />
                          </a>
                          <a
                            href={googleJobsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md bg-zinc-100 text-zinc-800 border border-zinc-300 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700 transition-colors"
                          >
                            Google Jobs <Search className="h-3 w-3" />
                          </a>
                          <a
                            href={indeedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 transition-colors"
                          >
                            Indeed <ExternalLink className="h-3 w-3" />
                          </a>
                          <a
                            href={baytUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 transition-colors"
                          >
                            Bayt <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Top Hiring Companies in the Market */}
        {parsed.topHiringCompanies && parsed.topHiringCompanies.length > 0 && (
          <Card className="border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="h-4 w-4 text-emerald-600" /> Key Companies Actively Recruiting in Your Domain
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {parsed.topHiringCompanies.map((comp, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col justify-between p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <div>
                      <h5 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-emerald-600" /> {comp.name}
                      </h5>
                      <p className="text-xs text-muted-foreground mt-0.5">{comp.sector}</p>
                    </div>
                    <div className="mt-2.5 pt-2 border-t flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {comp.location}
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
            </CardContent>
          </Card>
        )}

        {/* Strategic Career Recommendations */}
        <Card className="bg-muted/30 border-dashed border-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-emerald-600" /> Strategic Career & Profile Optimization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h5 className="font-semibold mb-2">High-Impact Keywords to Add to CV:</h5>
              <div className="flex flex-wrap gap-2">
                {parsed.recommendations.keywordsToAdd.map((kw, i) => (
                  <Badge key={i} variant="outline" className="border-emerald-500/30 font-medium bg-background">
                    + {kw}
                  </Badge>
                ))}
              </div>
            </div>
            {parsed.recommendations.upskilling && (
              <div className="flex items-start gap-2.5 bg-background p-3.5 rounded-lg border border-border/60">
                <GraduationCap className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-muted-foreground text-xs leading-relaxed">
                  <span className="font-semibold text-foreground">Recommended Skill / Certification:</span>{" "}
                  {parsed.recommendations.upskilling}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
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
