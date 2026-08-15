"use client";

import ReactMarkdown from "react-markdown";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportViewProps {
  markdown: string;
  className?: string;
}

/**
 * Renders the final Phase-3 report markdown with a polished, readable style.
 * Links open in a new tab. We rely on react-markdown + custom component map
 * instead of a typography plugin so styling stays fully controlled.
 */
export function ReportView({ markdown, className }: ReportViewProps) {
  return (
    <div
      className={cn(
        "prose-agent text-sm leading-relaxed text-foreground",
        className,
      )}
    >
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="mt-0 text-xl font-bold tracking-tight text-foreground">
              {children}
            </h1>
          ),
          h3: ({ children }) => (
            <h3 className="mt-5 text-base font-semibold text-foreground">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="my-1.5 text-sm leading-relaxed text-foreground/90">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="my-2 space-y-1.5 pl-1">{children}</ul>
          ),
          li: ({ children }) => (
            <li className="relative pl-4 text-sm text-foreground/90 before:absolute before:left-0 before:top-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-emerald-500/60">
              {children}
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-foreground/80">{children}</em>
          ),
          hr: () => (
            <hr className="my-4 border-0 border-t border-border" />
          ),
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
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">
              {children}
            </code>
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
