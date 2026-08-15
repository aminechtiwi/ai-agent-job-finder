import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { CandidateProfile, SearchHit } from "@/lib/agent/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/recruiter/runs/[id]
 * Returns the full run: CV text, parsed profile, queries, search hits, report.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const row = await db.agentRun.findUnique({ where: { id } });
  if (!row) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  let profile: CandidateProfile | null = null;
  if (row.profile) {
    try {
      profile = JSON.parse(row.profile) as CandidateProfile;
    } catch {
      profile = null;
    }
  }

  let searchQueries: string[] = [];
  if (row.searchQueries) {
    try {
      searchQueries = JSON.parse(row.searchQueries) as string[];
    } catch {
      searchQueries = [];
    }
  }

  let searchHits: SearchHit[] = [];
  if (row.searchResults) {
    try {
      searchHits = JSON.parse(row.searchResults) as SearchHit[];
    } catch {
      searchHits = [];
    }
  }

  return NextResponse.json({
    run: {
      id: row.id,
      candidateName: row.candidateName,
      cvText: row.cvText,
      profile,
      searchQueries,
      searchHits,
      report: row.report,
      status: row.status,
      error: row.error,
      durationMs: row.durationMs,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    },
  });
}

/**
 * DELETE /api/recruiter/runs/[id]
 * Deletes a single run.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await db.agentRun.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
