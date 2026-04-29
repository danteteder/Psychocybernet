// Error alert API route: forwards platform errors to Hermes → Telegram
// POST /api/webhooks/errors
// Body: { error, source?, stack?, severity? }

import { NextResponse, type NextRequest } from "next/server";
import { sendWebhook } from "@/lib/hermes-webhook";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.error) {
      return NextResponse.json({ error: "Missing 'error' field" }, { status: 400 });
    }

    const result = await sendWebhook("campaign-alert", {
      type: "platform_error",
      error: body.error,
      source: body.source || "psychocybernet",
      stack: body.stack || null,
      severity: body.severity || "error",
      timestamp: new Date().toISOString(),
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
