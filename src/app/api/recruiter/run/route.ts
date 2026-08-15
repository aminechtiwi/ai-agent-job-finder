import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { runRecruiterAgent } from "@/lib/agent/recruiter-agent";
import type { AgentEvent } from "@/lib/agent/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/recruiter/run
 * Body: { "cvText": string }
 *
 * Creates an AgentRun row, then streams the 3-phase agent execution
 * as Server-Sent Events. Each event is one AgentEvent JSON payload.
 */
export async function POST(req: NextRequest) {
  let body: { cvText?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const cvText = typeof body.cvText === "string" ? body.cvText.trim() : "";
  if (cvText.length < 20) {
    return new Response(
      JSON.stringify({
        error: "CV text is too short. Please paste at least 20 characters.",
      }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }

  // Create the run row up-front so the client gets a runId immediately.
  const run = await db.agentRun.create({
    data: { cvText, status: "running" },
  });

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: AgentEvent) => {
        const payload = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      // Tell the client which run this is straight away.
      controller.enqueue(
        encoder.encode(
          `event: run:start\ndata: ${JSON.stringify({ runId: run.id })}\n\n`,
        ),
      );

      const onPersist = async (patch: {
        candidateName?: string | null;
        profile?: string;
        searchQueries?: string;
        searchResults?: string;
        report?: string;
        status?: string;
        error?: string | null;
        durationMs?: number;
      }) => {
        try {
          await db.agentRun.update({ where: { id: run.id }, data: patch });
        } catch {
          // Persistence errors must not kill the stream.
        }
      };

      try {
        for await (const event of runRecruiterAgent(cvText, run.id, onPersist)) {
          send(event);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        send({ type: "error", message: `Agent crashed: ${message}` });
        try {
          await db.agentRun.update({
            where: { id: run.id },
            data: { status: "failed", error: message },
          });
        } catch {
          // ignore
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}
