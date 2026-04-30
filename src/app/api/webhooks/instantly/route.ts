// Instantly webhook endpoint for instant reply notifications
// Instantly sends POST here when a reply is received

import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Expected payload from Instantly:
    // {
    //   "event": "reply",
    //   "campaign_id": "...",
    //   "email": "prospect@example.com",
    //   "subject": "Re: ...",
    //   "message": "...",
    //   "lead_name": "Kristjan",
    //   "lead_company": "TechFlow",
    //   "received_at": "2026-04-30T14:23:00Z"
    // }

    const { event, email, subject, message, lead_name, lead_company, received_at } = body;

    if (event !== "reply") {
      return new Response(JSON.stringify({ status: "ok", skipped: true }), { status: 200 });
    }

    // Create Supabase client
    const supabase = await createClient();

    // Insert warm lead
    const { data: lead, error: insertError } = await supabase
      .from("warm_leads")
      .insert({
        email: email,
        first_name: lead_name || email.split("@")[0],
        company: lead_company || "Unknown",
        linkedin_url: null, // Will be enriched later
        source: "email",
        replied_at: received_at || new Date().toISOString(),
        call_status: "pending",
        assigned_to: null, // Auto-assign later or leave unassigned
      })
      .select()
      .single();

    if (insertError) {
      // Check if it's a duplicate (email already exists)
      if (insertError.code === "23505") {
        // Update existing lead's replied_at
        await supabase
          .from("warm_leads")
          .update({ 
            replied_at: received_at || new Date().toISOString(),
            call_status: "pending" // Re-open if was already called
          })
          .eq("email", email);
      } else {
        console.error("Failed to insert warm lead:", insertError);
        return new Response(JSON.stringify({ error: insertError.message }), { status: 500 });
      }
    }

    // Send Telegram alert to Dante + brother
    // This calls the Telegram webhook API
    const telegramAlert = {
      type: "outbound_reply",
      priority: "high",
      message: `📧 New email reply received!\n\nFrom: ${lead_name} (${email})\nCompany: ${lead_company}\nSubject: ${subject}\nTime: ${new Date(received_at).toLocaleString("et-EE")}\n\n⏱️ Call within 10 minutes!`,
      lead_email: email,
      lead_name: lead_name,
    };

    // Fire-and-forget to Telegram webhook
    fetch("/api/webhooks/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(telegramAlert),
    }).catch(err => console.error("Failed to send Telegram alert:", err));

    return new Response(JSON.stringify({ 
      status: "ok", 
      lead_id: lead?.id,
      alert_sent: true 
    }), { status: 200 });

  } catch (error) {
    console.error("Instantly webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}
