// Shared types for the AI Recruiter Agent.

/**
 * Structured candidate profile extracted in Phase 1.
 * This is the canonical shape passed between phases.
 */
export interface CandidateProfile {
  candidateName: string | null;
  primaryDomain: string;
  seniorityLevel: string;
  yearsOfExperience: number | null;
  hardSkills: string[];
  softSkills: string[];
  /** Top 5 competencies distilled from hard + soft skills + domain. */
  coreCompetencies: string[];
  /** Plausible job-title variations that fit this profile. */
  titleVariations: string[];
  /** Industry / domain keywords useful for search query construction. */
  industryKeywords: string[];
  summary: string;
}

/** A single search result item returned by the web_search function. */
export interface SearchItem {
  title: string;
  url: string;
  snippet: string;
  host: string;
  date: string;
}

/** Results for one search query. */
export interface SearchHit {
  query: string;
  results: SearchItem[];
}

/**
 * Streaming events emitted by the agent orchestrator.
 * The API route forwards these as Server-Sent Events.
 */
export type AgentEvent =
  | { type: "phase:start"; phase: 1 | 2 | 3; label: string }
  | { type: "phase:done"; phase: 1 | 2 | 3; label: string }
  | { type: "step"; phase: 1 | 2 | 3; message: string }
  | { type: "profile"; profile: CandidateProfile }
  | { type: "queries"; queries: string[] }
  | { type: "search-hit"; hit: SearchHit }
  | { type: "report"; report: string }
  | { type: "done"; runId: string; durationMs: number }
  | { type: "error"; message: string };

/** Final persisted result of a run. */
export interface AgentRunResult {
  profile: CandidateProfile;
  queries: string[];
  searchHits: SearchHit[];
  report: string;
  durationMs: number;
}

/** Run status persisted in the database. */
export type RunStatus = "running" | "completed" | "failed";
