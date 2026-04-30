// Instantly API client for campaign management and reply tracking
// Uses localStorage config from IntegrationsForm

const INSTANTLY_API_BASE = "https://app.instantly.ai/api/v1";

function getInstantlyApiKey(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("psycho_integrations");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.instantlyApiKey || null;
  } catch {
    return null;
  }
}

export interface InstantlyCampaign {
  id: string;
  name: string;
  status: "active" | "paused" | "completed";
  sent_count: number;
  reply_count: number;
  bounce_count: number;
  spam_count: number;
  open_rate: number;
  reply_rate: number;
  bounce_rate: number;
}

export interface InstantlyReply {
  id: string;
  campaign_id: string;
  email: string;
  subject: string;
  message: string;
  received_at: string;
  lead_name: string;
  lead_company?: string;
}

export async function fetchCampaigns(): Promise<InstantlyCampaign[]> {
  const apiKey = getInstantlyApiKey();
  if (!apiKey) {
    console.warn("No Instantly API key found");
    return [];
  }

  try {
    const response = await fetch(`${INSTANTLY_API_BASE}/campaigns`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Instantly API error: ${response.status}`);
    }

    const data = await response.json();
    return data.campaigns || [];
  } catch (error) {
    console.error("Failed to fetch Instantly campaigns:", error);
    return [];
  }
}

export async function fetchReplies(): Promise<InstantlyReply[]> {
  const apiKey = getInstantlyApiKey();
  if (!apiKey) {
    console.warn("No Instantly API key found");
    return [];
  }

  try {
    const response = await fetch(`${INSTANTLY_API_BASE}/replies`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Instantly API error: ${response.status}`);
    }

    const data = await response.json();
    return data.replies || [];
  } catch (error) {
    console.error("Failed to fetch Instantly replies:", error);
    return [];
  }
}

// Aggregate stats from all campaigns
export function aggregateCampaignStats(campaigns: InstantlyCampaign[]) {
  const totalSent = campaigns.reduce((sum, c) => sum + c.sent_count, 0);
  const totalReplies = campaigns.reduce((sum, c) => sum + c.reply_count, 0);
  const totalBounces = campaigns.reduce((sum, c) => sum + c.bounce_count, 0);
  const totalSpam = campaigns.reduce((sum, c) => sum + c.spam_count, 0);

  return {
    sent: totalSent,
    replies: totalReplies,
    bounces: totalBounces,
    spam: totalSpam,
    replyRate: totalSent > 0 ? ((totalReplies / totalSent) * 100).toFixed(1) : "0.0",
    bounceRate: totalSent > 0 ? ((totalBounces / totalSent) * 100).toFixed(1) : "0.0",
    spamRate: totalSent > 0 ? ((totalSpam / totalSent) * 100).toFixed(2) : "0.00",
    activeCampaigns: campaigns.filter(c => c.status === "active").length,
  };
}
