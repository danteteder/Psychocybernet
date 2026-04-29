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

/** Create HMAC-SHA256 hex signature from raw body string */
export function signBody(rawBody: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(rawBody)
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

  // Sign the exact same string that gets sent as the body
  const rawBody = JSON.stringify(payload);
  const signature = signBody(rawBody, secret);
  const url = `${baseUrl}/webhooks/${route}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Webhook-Signature": signature,
    },
    body: rawBody,
  });

  // Hermes returns 202 (accepted) on success
  const isOk = res.status >= 200 && res.status < 300;
  const body = isOk ? await res.json().catch(() => null) : null;

  if (!isOk) {
    const errText = await res.text().catch(() => "");
    console.error(`[webhook] ${route} failed: ${res.status} ${errText}`);
  }

  return { ok: isOk, status: res.status, body };
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
