import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const photo = formData.get("photo") as File;
    const mode = formData.get("mode") as string || "estimate";

    if (!photo) {
      return NextResponse.json({ error: "No photo provided" }, { status: 400 });
    }

    // Convert photo to base64
    const bytes = await photo.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    const systemPrompt = mode === "estimate"
      ? `You are a professional landscaping estimator. Analyze this yard photo and return ONLY valid JSON with these fields:
{
  "square_footage": <number>,
  "turf_type": "<string>",
  "condition": "<pristine | maintained | neglected | overgrown>",
  "access_constraints": "<string or None detected>",
  "notes": "<string>"
}`
      : `You are a professional landscaping quality auditor. Analyze this completed job photo and return ONLY valid JSON with these fields:
{
  "quality_score": <number 1-10>,
  "status": "<excellent | good | fair | poor>",
  "work_completed": ["<item1>", "<item2>"],
  "issues_found": ["<issue1>", "<issue2>"],
  "notes": "<string>"
}`;

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: photo.type as "image/jpeg" | "image/png",
                data: base64,
              },
            },
            {
              type: "text",
              text: "Analyze this photo and return only the JSON object.",
            },
          ],
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "{}";
    
    // Try to parse JSON from the response
    let jsonResponse;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      jsonResponse = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: text };
    } catch {
      jsonResponse = { raw_response: text };
    }

    return NextResponse.json({
      ...jsonResponse,
      mode,
      job_id: `JOB-${Date.now()}`,
    });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze photo" },
      { status: 500 }
    );
  }
}