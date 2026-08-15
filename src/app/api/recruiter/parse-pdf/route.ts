import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/recruiter/parse-pdf
 * Accepts a multipart form upload with a single PDF file,
 * extracts its text content, and returns it as JSON.
 *
 * Body: FormData with field "file" containing a .pdf file.
 * Response: { text: string }
 */
export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return Response.json(
      { error: "Invalid form data. Send a multipart/form-data request." },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return Response.json(
      { error: 'Missing "file" field. Upload a PDF file.' },
      { status: 400 },
    );
  }

  // Validate file type.
  if (
    file.type !== "application/pdf" &&
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    return Response.json(
      { error: "Only PDF files are supported." },
      { status: 400 },
    );
  }

  // Cap file size at 10 MB.
  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return Response.json(
      { error: "File too large. Maximum size is 10 MB." },
      { status: 400 },
    );
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Dynamic import to keep the module server-only.
    const pdfParse = (await import("pdf-parse")).default;
    const parsed = await pdfParse(buffer);

    const text = (parsed.text ?? "").trim();
    if (text.length < 20) {
      return Response.json(
        {
          error:
            "Could not extract enough text from this PDF. The file may be scanned/image-based. Try pasting the CV text manually.",
        },
        { status: 422 },
      );
    }

    return Response.json({ text });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json(
      { error: `Failed to parse PDF: ${message}` },
      { status: 500 },
    );
  }
}
