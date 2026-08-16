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
  Globe,
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
    coreCompetencies: string[];
  };
  matches: Array<{
    title: string;
    company: string;
    location?: string;
    whyItMatches: string;
    skillsToHighlight: string[];
    url?: string;
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
        {/* Top Summary Section */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-gradient-to-br from-background to-muted/20 border-emerald-500/20 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-emerald-700 dark:text-emerald-400">
                <Briefcase className="h-4 w-4" /> Assessed Candidate Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Primary Domain</span>
                <span className="font-semibold">{parsed.summary.domain}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-muted-foreground">Target Seniority</span>
                <span className="font-semibold">{parsed.summary.seniority}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-background to-muted/20 border-emerald-500/20 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-emerald-700 dark:text-emerald-400">
                <Sparkles className="h-4 w-4" /> Top Core Competencies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {parsed.summary.coreCompetencies.map((skill, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Job Matches Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold tracking-tight">Top Matched Job Openings</h3>
              <Badge
                variant="outline"
                className="text-[10px] uppercase tracking-wider font-semibold border-emerald-500/30 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20"
              >
                Live Market Data
              </Badge>
            </div>
          </div>

          <div className="grid gap-4">
            {parsed.matches.map((match, i) => {
              const query = [match.title, match.company !== "Industry Standard Role" ? match.company : ""]
                .filter(Boolean)
                .join(" ");
              const enc = encodeURIComponent(query || match.title);

              const linkedInUrl = `https://www.linkedin.com/jobs/search/?keywords=${enc}&f_TPR=r2592000`;
              const googleJobsUrl = `https://www.google.com/search?q=${encodeURIComponent(query + " jobs")}&ibp=htl;jobs`;
              const indeedUrl = `https://www.indeed.com/jobs?q=${enc}`;
              const glassdoorUrl = `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodeURIComponent(match.title)}`;

              const primaryUrl =
                match.url && !match.url.includes("linkedin.com/jobs/search")
                  ? match.url
                  : linkedInUrl;

              return (
                <Card
                  key={i}
                  className="group overflow-hidden transition-all hover:shadow-md hover:border-emerald-500/40 relative border-border/80"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500/30 group-hover:bg-emerald-500 transition-colors" />
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4">
                      {/* Title + Company Header */}
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <h4 className="text-xl font-bold leading-tight text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                            {match.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5 font-medium text-foreground/90">
                              <Building2 className="h-4 w-4 text-emerald-600" />
                              {match.company || "Verified Hiring Company"}
                            </span>
                            <span className="flex items-center gap-1 text-xs">
                              <MapPin className="h-3.5 w-3.5" />
                              {match.location || "Remote / Worldwide"}
                            </span>
                          </div>
                        </div>

                        {/* Primary View / Apply Button */}
                        <div className="shrink-0 flex items-center gap-2">
                          <Button
                            asChild
                            className="w-full md:w-auto shadow-sm gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <a href={primaryUrl} target="_blank" rel="noopener noreferrer">
                              Apply / View Openings <ArrowUpRight className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>

                      {/* Why it matches */}
                      <div className="bg-muted/40 rounded-lg p-3.5 text-sm leading-relaxed border border-border/60">
                        <p className="text-foreground/90">
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                            Candidate Match Rationale:
                          </span>{" "}
                          {match.whyItMatches}
                        </p>
                      </div>

                      {/* Skills Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1">
                          Matching Skills:
                        </span>
                        {match.skillsToHighlight.map((skill, j) => (
                          <span
                            key={j}
                            className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                      {/* Multi-Platform Direct Job Search Buttons */}
                      <div className="pt-2 border-t flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground font-medium mr-1">
                          Direct Job Boards:
                        </span>
                        <a
                          href={linkedInUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 transition-colors"
                        >
                          LinkedIn Jobs <ExternalLink className="h-3 w-3" />
                        </a>
                        <a
                          href={googleJobsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 transition-colors"
                        >
                          Google for Jobs <Search className="h-3 w-3" />
                        </a>
                        <a
                          href={indeedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 transition-colors"
                        >
                          Indeed <ExternalLink className="h-3 w-3" />
                        </a>
                        <a
                          href={glassdoorUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 transition-colors"
                        >
                          Glassdoor <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Strategic Recommendations */}
        <Card className="bg-muted/30 border-dashed border-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-emerald-600" /> Strategic Career & Resume Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h5 className="font-semibold mb-2">High-Impact Keywords to Add to CV:</h5>
              <div className="flex flex-wrap gap-2">
                {parsed.recommendations.keywordsToAdd.map((kw, i) => (
                  <Badge key={i} variant="outline" className="border-emerald-500/30 font-medium">
                    + {kw}
                  </Badge>
                ))}
              </div>
            </div>
            {parsed.recommendations.upskilling && (
              <div className="flex items-start gap-2 bg-background p-3 rounded-md border border-border/50">
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-muted-foreground">
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
