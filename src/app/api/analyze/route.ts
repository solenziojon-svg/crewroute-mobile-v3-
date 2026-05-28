import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// ── System Prompts ─────────────────────────────────────────────
const ESTIMATE_PROMPT = `You are a professional landscaping estimator.
Analyze this yard photo. Return ONLY valid JSON with no extra text:
{
  "square_footage": <integer>,
  "turf_type": "<Bermuda Grass|Kentucky Bluegrass|St. Augustine|Fescue|Zoysia|Mixed|Unknown>",
  "access_constraints": "<describe gates/obstacles or write: None detected>",
  "condition": "<pristine|maintained|neglected|overgrown|severely_overgrown>"
}`;

const AUDIT_PROMPT = `You are a professional landscaping job quality auditor.
Analyze this completed job photo. Return ONLY valid JSON with no extra text:
{
  "score": <integer 1-10>,
  "status": "<verified|acceptable|needs_attention|failed>",
  "notes": "<one sentence>",
  "work_completed": ["<service>"],
  "upsell_detected": <true|false>,
  "upsell_description": "<string or empty>",
  "upsell_value": <integer or 0>,
  "client_message": "<2-3 sentence professional SMS to client>",
  "flags": ["<operator alert>"]
}`;

// ── Pricing Engine ─────────────────────────────────────────────
const COND: Record<string, number> = {
  pristine: 1.0,
  maintained: 1.05,
  neglected: 1.15,
  overgrown: 1.2,
  severely_overgrown: 1.35,
};

function calcPrice(sqft: number, condition: string, access: string) {
  const c = access.toLowerCase();
  const heavy = ["locked", "gate", "narrow", "36-inch", "restricted"];
  const fric = heavy.some((k) => c.includes(k)) ? 1.35 : 1.0;
  const mult = COND[condition] ?? 1.05;
  const hours = (sqft / 1600) * mult * fric;
  const price = Math.round((hours * 65) / 0.65);
  return { hours: +hours.toFixed(2), suggested_price: price };
}

function makeJobId(): string {
  const d = new Date();
  return `JOB-${d.getMonth() + 1}${String(d.getDate()).padStart(2, "0")}-${Math.floor(Math.random() * 9000) + 1000}`;
}

// ── Main Handler ───────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is missing in Vercel Environment Variables." },
      { status: 500 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const photo = formData.get("photo") as File | null;
  const mode = (formData.get("mode") as string) || "estimate";

  if (!photo) {
    return NextResponse.json({ error: "No photo provided." }, { status: 400 });
  }

  if (photo.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Photo too large (max 10MB)." }, { status: 413 });
  }

  // Convert image to base64 (safe method)
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
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: base64,
            },
          },
          {
            type: "text",
            text: "Analyze the image and return only the JSON object.",
          },
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
      console.error("[CrewRoute] Anthropic Error:", errorText);
      return NextResponse.json({ error: `Anthropic API error: ${response.status}` }, { status: 502 });
    }

    const data = await response.json();
    const rawText = data?.content?.[0]?.text || "";

    if (!rawText) {
      return NextResponse.json({ error: "Empty response from Claude." }, { status: 502 });
    }

    // Clean any markdown code fences
    const cleaned = rawText.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(cleaned);

    if (mode === "estimate") {
      const sqft = Number(parsed.square_footage ?? 0);
      const condition = String(parsed.condition ?? "maintained");
      const access = String(parsed.access_constraints ?? "");
      const pricing = calcPrice(sqft, condition, access);
      return NextResponse.json({ job_id: makeJobId(), mode: "estimate", ...parsed, ...pricing });
    }

    return NextResponse.json({ job_id: makeJobId(), mode: "audit", ...parsed });
  } catch (err: any) {
    console.error("[CrewRoute] Handler Error:", err);
    return NextResponse.json({ error: err.message || "Analysis failed" }, { status: 500 });
  }
}