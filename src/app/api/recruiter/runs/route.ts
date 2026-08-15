import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { CandidateProfile } from "@/lib/agent/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/recruiter/runs
 * Returns all runs (newest first) with a lightweight profile slice for cards.
 */
export async function GET() {
  const rows = await db.agentRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      candidateName: true,
      profile: true,
      status: true,
      durationMs: true,
      error: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const runs = rows.map((r) => {
    let primaryDomain = "—";
    let seniorityLevel = "—";
    let coreCompetencies: string[] = [];
    if (r.profile) {
      try {
        const p = JSON.parse(r.profile) as CandidateProfile;
        primaryDomain = p.primaryDomain ?? primaryDomain;
        seniorityLevel = p.seniorityLevel ?? seniorityLevel;
        coreCompetencies = p.coreCompetencies ?? [];
      } catch {
        // ignore malformed profile
      }
    }
    return {
      id: r.id,
      candidateName: r.candidateName,
      status: r.status,
      durationMs: r.durationMs,
      error: r.error,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      primaryDomain,
      seniorityLevel,
      coreCompetencies,
    };
  });

  return NextResponse.json({ runs });
}

/**
 * DELETE /api/recruiter/runs?all=true  → clear entire history.
 */
export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const all = url.searchParams.get("all") === "true";
  if (!all) {
    return NextResponse.json(
      { error: "Use DELETE /api/recruiter/runs?all=true to clear history." },
      { status: 400 },
    );
  }
  await db.agentRun.deleteMany({});
  return NextResponse.json({ ok: true });
}
