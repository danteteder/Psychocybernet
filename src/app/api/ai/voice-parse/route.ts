import { NextResponse } from "next/server";
import { chat } from "@/lib/ai/deepseek";
import { VOICE_PARSE_PROMPT } from "@/lib/ai/prompts";

// POST /api/ai/voice-parse
// Takes a voice transcript, returns a structured task object
export async function POST(request: Request) {
  try {
    const { transcript } = await request.json();

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json(
        { error: "Missing 'transcript' field" },
        { status: 400 }
      );
    }

    // Include today's date so the AI can calculate relative days
    const today = new Date().toISOString().split("T")[0];
    const prompt = `Today is ${today}. Parse this spoken text:\n"${transcript}"`;

    const response = await chat([
      { role: "system", content: VOICE_PARSE_PROMPT },
      { role: "user", content: prompt },
    ]);

    // Parse the structured task from the response
    const parsed = JSON.parse(response);

    return NextResponse.json({ task: parsed });
  } catch (error) {
    console.error("Voice parse error:", error);
    return NextResponse.json(
      { error: "Failed to parse voice input" },
      { status: 500 }
    );
  }
}
