// Heartbeat API route: sends health check to Hermes gateway
// Called by Vercel cron or manually: GET /api/webhooks/heartbeat

import { NextResponse } from "next/server";
import { sendHealthbeat } from "@/lib/hermes-webhook";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await sendHealthbeat({
      status: "healthy",
      uptime: process.uptime(),
      active_campaigns: 0,
      errors: [],
    });

    return NextResponse.json({
      sent: true,
      hermes: { ok: result.ok, status: result.status },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ sent: false, error: message }, { status: 500 });
  }
}
