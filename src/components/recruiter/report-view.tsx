"use client";

import ReactMarkdown from "react-markdown";
import { ExternalLink, Building2, MapPin, Briefcase, Sparkles, TrendingUp, AlertCircle, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
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
    location: string;
    whyItMatches: string;
    skillsToHighlight: string[];
    url: string;
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
    // Attempt to parse the report as JSON (new structure)
    parsed = JSON.parse(markdown) as ParsedReport;
    if (parsed && parsed.matches && Array.isArray(parsed.matches)) {
      isJson = true;
    }
  } catch {
    // Fall back to treating it as raw markdown (old structure or LLM failure)
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
                <Briefcase className="h-4 w-4" /> Professional Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Domain</span>
                <span className="font-semibold">{parsed.summary.domain}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-muted-foreground">Seniority</span>
                <span className="font-semibold">{parsed.summary.seniority}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-background to-muted/20 border-emerald-500/20 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-emerald-700 dark:text-emerald-400">
                <Sparkles className="h-4 w-4" /> Core Competencies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {parsed.summary.coreCompetencies.map((skill, i) => (
                  <Badge key={i} variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Job Matches Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-bold tracking-tight">Top Job Matches</h3>
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-semibold border-emerald-500/30 text-emerald-600">
              Live Market Data
            </Badge>
          </div>
          
          <div className="grid gap-4">
            {parsed.matches.map((match, i) => (
              <Card key={i} className="group overflow-hidden transition-all hover:shadow-md hover:border-emerald-500/40 relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/20 group-hover:bg-emerald-500/60 transition-colors" />
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    
                    <div className="space-y-3 flex-1">
                      <div>
                        <h4 className="text-xl font-bold leading-tight mb-1">{match.title}</h4>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1 font-medium text-foreground/80">
                            <Building2 className="h-3.5 w-3.5" />
                            {match.company}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {match.location}
                          </span>
                        </div>
                      </div>

                      <div className="bg-muted/40 rounded-md p-3 text-sm leading-relaxed border border-border/50">
                        <p className="text-foreground/90"><span className="font-semibold text-emerald-600 dark:text-emerald-400">Why it fits:</span> {match.whyItMatches}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1">Key Skills:</span>
                        {match.skillsToHighlight.map((skill, j) => (
                          <span key={j} className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary/80 border border-border">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-start md:w-[140px] md:justify-end">
                      <Button asChild className="w-full md:w-auto shadow-sm gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                        <a href={match.url} target="_blank" rel="noopener noreferrer">
                          View Job <ArrowUpRight className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </div>

                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Strategic Recommendations */}
        <Card className="bg-muted/30 border-dashed border-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-emerald-600" /> Strategic Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h5 className="font-semibold mb-2">Keywords to Add to Resume:</h5>
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
                  <span className="font-semibold text-foreground">Upskilling Suggestion:</span> {parsed.recommendations.upskilling}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback to old Markdown renderer if it wasn't JSON
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
            <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-emerald-700 underline decoration-emerald-500/40 underline-offset-2 hover:decoration-emerald-500 dark:text-emerald-400">
              {children}
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          ),
          code: ({ children }) => <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">{children}</code>,
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
