import { NextResponse } from "next/server";

// Instantly API proxy
// Fetches campaign stats from the Instantly API
// Keeps the API key server-side only

const INSTANTLY_API_URL = "https://api.instantly.ai/api/v1";

// GET /api/instantly?endpoint=campaigns
// Proxies requests to the Instantly API
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get("endpoint") || "campaigns";

  const apiKey = process.env.INSTANTLY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Instantly API key not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `${INSTANTLY_API_URL}/${endpoint}?api_key=${apiKey}`,
      {
        headers: { "Content-Type": "application/json" },
        // Cache for 5 minutes to avoid hitting rate limits
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Instantly API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Instantly proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch from Instantly" },
      { status: 500 }
    );
  }
}
