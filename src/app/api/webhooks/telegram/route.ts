import { NextResponse } from "next/server";

// Telegram Webhook Handler
// Receives Hermes alerts for business events

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "6"; // Default to user's chat

interface TelegramAlert {
  type: "revenue" | "order" | "lead" | "error" | "opportunity";
  business?: string;
  title: string;
  message: string;
  amount?: number;
  priority: "low" | "medium" | "high" | "critical";
  action?: {
    label: string;
    url?: string;
    command?: string;
  };
}

/**
 * POST /api/webhooks/telegram
 * 
 * Payload:
 * {
 *   type: "revenue" | "order" | "lead" | "error" | "opportunity",
 *   business?: string,
 *   title: string,
 *   message: string,
 *   amount?: number,
 *   priority: "low" | "medium" | "high" | "critical",
 *   action?: { label, url, command }
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json() as TelegramAlert;
    
    // Validate payload
    if (!body.title || !body.message) {
      return NextResponse.json(
        { error: "Missing required fields: title, message" },
        { status: 400 }
      );
    }

    if (!TELEGRAM_BOT_TOKEN) {
      console.warn("Telegram bot token not configured");
      return NextResponse.json(
        { error: "Telegram integration not configured" },
        { status: 503 }
      );
    }

    // Format message for Telegram
    const emoji = getEmojiForType(body.type);
    const priorityEmoji = getPriorityEmoji(body.priority);
    const amountStr = body.amount ? formatMoney(body.amount) : "";
    
    let message = `
${priorityEmoji} *${emoji} ${body.title}*

${body.message}
${amountStr ? `\n💰 Amount: *${amountStr}*` : ""}
${body.business ? `\n🏢 Business: ${body.business}` : ""}

${body.action ? `👉 ${body.action.label}` : ""}
    `.trim();

    // Build inline keyboard if action exists
    const replyMarkup = body.action ? {
      inline_keyboard: [
        body.action.url ? [{
          text: body.action.label,
          url: body.action.url,
        }] : body.action.command ? [{
          text: body.action.label,
          callback_data: `cmd:${body.action.command}`,
        }] : [],
      ].filter(row => row.length > 0),
    } : undefined;

    // Send to Telegram
    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "Markdown",
        reply_markup: replyMarkup,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Telegram API error:", error);
      return NextResponse.json(
        { error: "Failed to send to Telegram", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Alert sent to Telegram" });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/telegram?test=true
 * Test endpoint
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isTest = searchParams.get("test") === "true";

  if (!isTest) {
    return NextResponse.json({ 
      status: "ok",
      configured: !!TELEGRAM_BOT_TOKEN,
      chatId: TELEGRAM_CHAT_ID ? "****" + TELEGRAM_CHAT_ID.slice(-3) : "not set"
    });
  }

  // Send test message
  const testPayload: TelegramAlert = {
    type: "revenue",
    title: "🧪 Test Alert",
    message: "This is a test notification from Psychocybernet. Your Telegram integration is working!",
    priority: "medium",
    action: {
      label: "View Dashboard",
      url: process.env.NEXT_PUBLIC_SITE_URL || "https://your-domain.com",
    },
  };

  // Create a mock request and call POST
  const mockRequest = new Request(request.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(testPayload),
  });

  return POST(mockRequest);
}

function getEmojiForType(type: TelegramAlert["type"]): string {
  switch (type) {
    case "revenue": return "💰";
    case "order": return "🛒";
    case "lead": return "📬";
    case "error": return "⚠️";
    case "opportunity": return "🚀";
    default: return "📢";
  }
}

function getPriorityEmoji(priority: TelegramAlert["priority"]): string {
  switch (priority) {
    case "critical": return "🔴";
    case "high": return "🟠";
    case "medium": return "🟡";
    case "low": return "🔵";
    default: return "⚪";
  }
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}
