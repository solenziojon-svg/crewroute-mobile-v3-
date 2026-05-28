import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const ESTIMATE_PROMPT = `You are a professional landscaping estimator. Analyze this yard photo. Return ONLY valid JSON with no extra text.`;

const AUDIT_PROMPT = `You are a professional landscaping job quality auditor. Analyze this photo. Return ONLY valid JSON with no extra text.`;

export async function POST(req: NextRequest) {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is missing." }, { status: 500 });
  }

  const formData = await req.formData();
  const photo = formData.get("photo") as File | null;
  const mode = (formData.get("mode") as string) || "estimate";

  if (!photo) return NextResponse.json({ error: "No photo provided." }, { status: 400 });

  const bytes = await photo.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const mediaType = (photo.type || "image/jpeg") as "image/jpeg" | "image/png" | "image/webp";

  const systemPrompt = mode === "audit" ? AUDIT_PROMPT : ESTIMATE_PROMPT;

  const requestBody = {
    model: "claude-3-5-sonnet-20241022",
    max_tokens: mode === "audit" ? 900 : 500,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
          { type: "text", text: "Analyze the image and return only the JSON object." },
        ],
      },
    ],
  };

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `Anthropic API error: ${response.status}` }, { status: 502 });
    }

    const data = await response.json();
    const rawText = data?.content?.[0]?.text || "";
    const cleaned = rawText.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({ job_id: `JOB-${Date.now()}`, mode, ...parsed });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Analysis failed" }, { status: 500 });
  }
}