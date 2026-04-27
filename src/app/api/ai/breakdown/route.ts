import { NextResponse } from "next/server";
import { chat } from "@/lib/ai/deepseek";
import { TASK_BREAKDOWN_PROMPT } from "@/lib/ai/prompts";

// POST /api/ai/breakdown
// Takes a task/goal description, returns an array of subtasks
export async function POST(request: Request) {
  try {
    const { task } = await request.json();

    if (!task || typeof task !== "string") {
      return NextResponse.json(
        { error: "Missing 'task' field" },
        { status: 400 }
      );
    }

    const response = await chat([
      { role: "system", content: TASK_BREAKDOWN_PROMPT },
      { role: "user", content: task },
    ]);

    // Parse the JSON array from the response
    const subtasks = JSON.parse(response);

    return NextResponse.json({ subtasks });
  } catch (error) {
    console.error("AI breakdown error:", error);
    return NextResponse.json(
      { error: "Failed to break down task" },
      { status: 500 }
    );
  }
}
