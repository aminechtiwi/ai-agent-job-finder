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
  let trimmed = raw.trim();

  // Strip leading/trailing markdown code blocks if any
  trimmed = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();

  // 1. Try direct parse
  try {
    return JSON.parse(trimmed);
  } catch {
    // continue
  }

  // 2. Extract between first '{' and last '}'
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    try {
      return JSON.parse(trimmed.slice(first, last + 1));
    } catch {
      // continue
    }
  }

  // 3. Extract between first '[' and last ']' if array
  const firstArr = trimmed.indexOf("[");
  const lastArr = trimmed.lastIndexOf("]");
  if (firstArr !== -1 && lastArr !== -1 && lastArr > firstArr) {
    try {
      return JSON.parse(trimmed.slice(firstArr, lastArr + 1));
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
    location:
      typeof obj.location === "string" && obj.location.trim()
        ? obj.location.trim()
        : null,
    targetLocations: strArr(obj.targetLocations),
    targetCompanies: strArr(obj.targetCompanies),
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
 * Build targeted search queries across specific companies, regions, and job portals.
 */
function buildSearchQueries(profile: CandidateProfile): string[] {
  const titles = profile.titleVariations.slice(0, 3);
  const primaryTitle = titles[0] || "Engineer";
  const domain = profile.primaryDomain;
  const skills = profile.hardSkills.slice(0, 3).join(" ");
  const loc = profile.location ? ` ${profile.location}` : "";
  const targetCompanies = profile.targetCompanies?.slice(0, 3) || [];

  const queries: string[] = [
    `${primaryTitle} hiring job vacancies${loc}`,
    `${primaryTitle} ${skills} careers job openings`,
  ];

  if (targetCompanies.length > 0) {
    queries.push(`${targetCompanies.join(" OR ")} ${primaryTitle} careers`);
  } else {
    queries.push(`${domain} top companies hiring ${primaryTitle}`);
  }

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
        { role: "system", content: PHASE1_SYSTEM_PROMPT },
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
        { role: "system", content: PHASE3_SYSTEM_PROMPT },
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

    // Strip reasoning model <think>...</think> blocks
    report = report.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

    // Strip leading markdown fence if the model wrapped the whole report.
    if (report.startsWith("```")) {
      report = report.replace(/^```(?:json|markdown)?\s*/i, "").replace(/```\s*$/i, "").trim();
    }

    // If the model output prose/brainstorming before JSON, extract just the JSON part
    const jsonStart = report.indexOf("{");
    if (jsonStart > 0) {
      // There's text before the first {, strip it
      report = report.slice(jsonStart);
    }
    // Ensure it ends at the last }
    const jsonEnd = report.lastIndexOf("}");
    if (jsonEnd !== -1 && jsonEnd < report.length - 1) {
      report = report.slice(0, jsonEnd + 1);
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
