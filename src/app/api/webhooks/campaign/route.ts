// Campaign alert API route: forwards campaign events to Hermes → Telegram
// POST /api/webhooks/campaign
// Body: { campaign_id, platform, response_type, metadata? }

import { NextResponse, type NextRequest } from "next/server";
import { sendCampaignAlert } from "@/lib/hermes-webhook";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.campaign_id || !body.platform || !body.response_type) {
      return NextResponse.json(
        { error: "Missing required fields: campaign_id, platform, response_type" },
        { status: 400 }
      );
    }

    const result = await sendCampaignAlert({
      campaign_id: body.campaign_id,
      platform: body.platform,
      response_type: body.response_type,
      timestamp: body.timestamp,
      metadata: body.metadata,
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
