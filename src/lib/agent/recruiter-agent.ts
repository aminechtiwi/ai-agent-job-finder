import { createAIClient, type AIClient } from "./ai-client";
import { db } from "@/lib/db";
import {
  PHASE1_SYSTEM_PROMPT,
  PHASE1_USER_PROMPT,
  PHASE3_SYSTEM_PROMPT,
  PHASE3_USER_PROMPT,
} from "./prompts";
import type {
  AgentEvent,
  CandidateProfile,
  SearchHit,
  SearchItem,
} from "./types";

/**
 * Extract a JSON object from an LLM response that may be wrapped in
 * markdown code fences or contain stray prose. Returns null if no JSON
 * object can be located.
 */
function extractJson(raw: string): unknown | null {
  if (!raw) return null;
  const trimmed = raw.trim();

  // Fast path: already valid JSON.
  try {
    return JSON.parse(trimmed);
  } catch {
    // continue
  }

  // Strip markdown code fences if present.
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {
      // continue
    }
  }

  // Fallback: grab the first {...} block.
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    try {
      return JSON.parse(trimmed.slice(first, last + 1));
    } catch {
      // continue
    }
  }

  return null;
}

/** Validate / coerce the parsed Phase-1 JSON into a CandidateProfile. */
function coerceProfile(parsed: unknown): CandidateProfile {
  const obj = (parsed ?? {}) as Record<string, unknown>;
  const strArr = (v: unknown): string[] =>
    Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean) : [];

  const yearsRaw = obj.yearsOfExperience;
  const years =
    typeof yearsRaw === "number"
      ? yearsRaw
      : typeof yearsRaw === "string"
        ? Number.parseInt(yearsRaw, 10)
        : null;

  const hardSkills = strArr(obj.hardSkills);
  const softSkills = strArr(obj.softSkills);

  // Ensure coreCompetencies has exactly 5 items, backfilling from hard skills.
  let core = strArr(obj.coreCompetencies);
  if (core.length < 5) {
    const pool = [...hardSkills, ...softSkills].filter(
      (s) => !core.includes(s),
    );
    while (core.length < 5 && pool.length) {
      core.push(pool.shift() as string);
    }
  }
  core = core.slice(0, 5);

  return {
    candidateName:
      typeof obj.candidateName === "string" && obj.candidateName.trim()
        ? obj.candidateName.trim()
        : null,
    primaryDomain:
      typeof obj.primaryDomain === "string" && obj.primaryDomain.trim()
        ? obj.primaryDomain.trim()
        : "Unspecified",
    seniorityLevel:
      typeof obj.seniorityLevel === "string" && obj.seniorityLevel.trim()
        ? obj.seniorityLevel.trim()
        : "Mid",
    yearsOfExperience: Number.isFinite(years) ? years : null,
    hardSkills,
    softSkills,
    coreCompetencies: core,
    titleVariations: strArr(obj.titleVariations),
    industryKeywords: strArr(obj.industryKeywords),
    summary:
      typeof obj.summary === "string" && obj.summary.trim()
        ? obj.summary.trim()
        : "",
  };
}

/**
 * Build targeted search queries (Google + LinkedIn style) from the profile.
 * Mirrors the operator's example: site:linkedin.com "Senior Product Manager" AND "SaaS".
 */
function buildSearchQueries(profile: CandidateProfile): string[] {
  const titles = profile.titleVariations.slice(0, 3);
  const domain = profile.primaryDomain;
  const kw = profile.industryKeywords.slice(0, 2);
  const seniority = profile.seniorityLevel;

  const queries: string[] = [];

  // LinkedIn-targeted queries per title variation.
  for (const title of titles) {
    queries.push(
      `site:linkedin.com/jobs "${title}" ${kw.map((k) => `"${k}"`).join(" ")}`.trim(),
    );
  }

  // A broad Google query for hiring trends / market demand.
  queries.push(
    `${seniority} ${titles[0] ?? ""} ${domain} job openings hiring trends ${kw[0] ?? ""}`.trim(),
  );

  // A skills-focused query to surface required tech stacks.
  const topSkills = profile.hardSkills.slice(0, 3).join(" ");
  if (topSkills) {
    queries.push(
      `${titles[0] ?? seniority} required skills ${topSkills} ${domain}`.trim(),
    );
  }

  // De-duplicate while preserving order.
  return [...new Set(queries.filter(Boolean))];
}

/** Build the compact search-context block fed to Phase 3. */
function buildSearchContext(hits: SearchHit[]): string {
  return hits
    .map((hit, i) => {
      const items = hit.results
        .slice(0, 5)
        .map(
          (r, j) =>
            `  ${j + 1}. ${r.title}\n     URL: ${r.url}\n     ${r.snippet}`,
        )
        .join("\n");
      return `Query ${i + 1}: ${hit.query}\nResults:\n${items || "  (no results)"}`;
    })
    .join("\n\n");
}

/**
 * Run the full 3-phase recruiter agent as an async generator.
 * Yields AgentEvent objects that the API route forwards as SSE.
 *
 * @param cvText      Raw CV text from the user.
 * @param runId       Database row id for this run (already created).
 * @param onPersist   Callback used to persist intermediate + final state to DB.
 */
export async function* runRecruiterAgent(
  cvText: string,
  runId: string,
  onPersist: (patch: {
    candidateName?: string | null;
    profile?: string;
    searchQueries?: string;
    searchResults?: string;
    report?: string;
    status?: string;
    error?: string | null;
    durationMs?: number;
  }) => Promise<void>,
): AsyncGenerator<AgentEvent, void, unknown> {
  const startedAt = Date.now();
  let ai: AIClient;

  try {
    ai = await createAIClient();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    yield { type: "error", message: `Failed to initialise AI SDK: ${message}` };
    await onPersist({ status: "failed", error: message });
    return;
  }

  // ---------------------------------------------------------------- Phase 1
  yield { type: "phase:start", phase: 1, label: "CV Extraction & Parsing" };
  yield {
    type: "step",
    phase: 1,
    message: "Sending CV to the LLM for structured extraction…",
  };

  let profile: CandidateProfile;
  try {
    const completion = await ai.chat.completions.create({
      messages: [
        { role: "assistant", content: PHASE1_SYSTEM_PROMPT },
        { role: "user", content: PHASE1_USER_PROMPT(cvText) },
      ],
      thinking: { type: "disabled" },
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const parsed = extractJson(raw);
    if (!parsed || typeof parsed !== "object") {
      throw new Error("LLM did not return a parseable JSON profile.");
    }
    profile = coerceProfile(parsed);

    yield {
      type: "step",
      phase: 1,
      message: `Identified ${profile.hardSkills.length} hard skills, seniority "${profile.seniorityLevel}", domain "${profile.primaryDomain}".`,
    };
    yield { type: "profile", profile };

    await onPersist({
      candidateName: profile.candidateName,
      profile: JSON.stringify(profile),
    });

    yield { type: "phase:done", phase: 1, label: "CV Extraction & Parsing" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    yield { type: "error", message: `Phase 1 failed: ${message}` };
    await onPersist({ status: "failed", error: `Phase 1: ${message}` });
    return;
  }

  // ---------------------------------------------------------------- Phase 2
  yield { type: "phase:start", phase: 2, label: "Google & LinkedIn Live Web Research" };

  const queries = buildSearchQueries(profile);
  yield { type: "queries", queries };
  await onPersist({ searchQueries: JSON.stringify(queries) });

  yield {
    type: "step",
    phase: 2,
    message: `Executing ${queries.length} targeted search queries in parallel…`,
  };

  const hits: SearchHit[] = [];
  try {
    const settled = await Promise.allSettled(
      queries.map(async (query, idx): Promise<SearchHit> => {
        // Stagger parallel searches to avoid 429 rate-limiting from the
        // web_search provider. Each query starts ~600ms after the previous.
        await new Promise((r) => setTimeout(r, idx * 600));

        // One retry with backoff for transient 429s.
        let results: unknown;
        try {
          results = await ai.functions.invoke("web_search", {
            query,
            num: 8,
          });
        } catch (firstErr) {
          const msg =
            firstErr instanceof Error ? firstErr.message : String(firstErr);
          if (/429|too many requests/i.test(msg)) {
            await new Promise((r) => setTimeout(r, 1500));
            results = await ai.functions.invoke("web_search", {
              query,
              num: 8,
            });
          } else {
            throw firstErr;
          }
        }

        const items: SearchItem[] = Array.isArray(results)
          ? results.map((r: Record<string, unknown>) => ({
              title: String(r.name ?? r.title ?? ""),
              url: String(r.url ?? ""),
              snippet: String(r.snippet ?? ""),
              host: String(r.host_name ?? r.host ?? ""),
              date: String(r.date ?? ""),
            }))
          : [];
        return { query, results: items };
      }),
    );

    for (let i = 0; i < settled.length; i++) {
      const s = settled[i];
      if (s.status === "fulfilled") {
        hits.push(s.value);
        yield {
          type: "search-hit",
          hit: s.value,
        };
        yield {
          type: "step",
          phase: 2,
          message: `Query ${i + 1}/${queries.length} → ${s.value.results.length} results.`,
        };
      } else {
        const reason = s.reason instanceof Error ? s.reason.message : String(s.reason);
        hits.push({ query: queries[i], results: [] });
        yield {
          type: "step",
          phase: 2,
          message: `Query ${i + 1}/${queries.length} failed (${reason}). Continuing.`,
        };
      }
    }

    await onPersist({ searchResults: JSON.stringify(hits) });
    yield { type: "phase:done", phase: 2, label: "Google & LinkedIn Live Web Research" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    yield { type: "error", message: `Phase 2 failed: ${message}` };
    await onPersist({ status: "failed", error: `Phase 2: ${message}` });
    return;
  }

  // ---------------------------------------------------------------- Phase 3
  yield { type: "phase:start", phase: 3, label: "Evaluation & Mapping" };
  yield {
    type: "step",
    phase: 3,
    message: "Synthesising job matches against live market data…",
  };

  let report: string;
  try {
    const searchContext = buildSearchContext(hits);
    const completion = await ai.chat.completions.create({
      messages: [
        { role: "assistant", content: PHASE3_SYSTEM_PROMPT },
        {
          role: "user",
          content: PHASE3_USER_PROMPT(
            JSON.stringify(profile, null, 2),
            searchContext,
          ),
        },
      ],
      thinking: { type: "disabled" },
    });

    report = (completion.choices[0]?.message?.content ?? "").trim();
    if (!report) {
      throw new Error("LLM returned an empty report.");
    }

    // Strip a leading markdown fence if the model wrapped the whole report.
    if (report.startsWith("```")) {
      report = report.replace(/^```(?:markdown)?\s*/i, "").replace(/```\s*$/i, "").trim();
    }

    yield { type: "report", report };
    yield { type: "phase:done", phase: 3, label: "Evaluation & Mapping" };

    const durationMs = Date.now() - startedAt;
    await onPersist({ report, status: "completed", durationMs });
    yield { type: "done", runId, durationMs };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    yield { type: "error", message: `Phase 3 failed: ${message}` };
    await onPersist({ status: "failed", error: `Phase 3: ${message}` });
  }
}

/** Convenience: load a finished (or partial) run from the DB for re-display. */
export async function loadRun(runId: string) {
  const row = await db.agentRun.findUnique({ where: { id: runId } });
  if (!row) return null;
  return row;
}
