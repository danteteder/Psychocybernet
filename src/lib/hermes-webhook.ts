// Server-side webhook utility for Hermes gateway
// Signs payloads with HMAC-SHA256 and sends via ngrok tunnel
// NOTE: This runs on Vercel (server-side), NOT client-side

import crypto from "crypto";

type WebhookRoute = "test" | "campaign-alert";

// Map route names to their env var keys
const SECRET_MAP: Record<WebhookRoute, string> = {
  "test": "HERMES_WEBHOOK_SECRET_TEST",
  "campaign-alert": "HERMES_WEBHOOK_SECRET_CAMPAIGN",
};

/** Create HMAC-SHA256 signature for a payload */
export function signPayload(payload: object, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(payload))
    .digest("hex");
}

/** Send a signed webhook to Hermes gateway via ngrok */
export async function sendWebhook(
  route: WebhookRoute,
  payload: object
): Promise<{ ok: boolean; status: number; body?: unknown }> {
  const baseUrl = process.env.HERMES_WEBHOOK_BASE;
  const secretKey = SECRET_MAP[route];
  const secret = process.env[secretKey];

  if (!baseUrl) throw new Error("HERMES_WEBHOOK_BASE not set");
  if (!secret) throw new Error(`${secretKey} not set`);

  const signature = signPayload(payload, secret);
  const url = `${baseUrl}/webhooks/${route}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Webhook-Signature": signature,
    },
    body: JSON.stringify(payload),
  });

  const body = res.ok ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    console.error(`[webhook] ${route} failed: ${res.status} ${res.statusText}`);
  }

  return { ok: res.ok, status: res.status, body };
}

/** Send a campaign alert (new lead, response, conversion, etc.) */
export async function sendCampaignAlert(data: {
  campaign_id: string;
  platform: string;
  response_type: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}) {
  return sendWebhook("campaign-alert", {
    ...data,
    timestamp: data.timestamp || new Date().toISOString(),
  });
}

/** Send a health heartbeat to the test webhook */
export async function sendHealthbeat(data: {
  status: string;
  uptime: number;
  active_campaigns?: number;
  errors?: string[];
}) {
  return sendWebhook("test", {
    ...data,
    timestamp: new Date().toISOString(),
    source: "psychocybernet",
  });
}
