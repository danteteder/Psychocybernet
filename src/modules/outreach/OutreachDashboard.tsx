"use client";

// Outreach Dashboard: Real-time campaign tracking + warm leads queue
// Email stats from Instantly API, LinkedIn from Browser Use logs, warm leads from Supabase

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchCampaigns, aggregateCampaignStats, type InstantlyCampaign } from "@/lib/instantly";
import { sendCommand } from "@/lib/hermes";
import { Mail, MessageSquare, Phone, Upload, Download, RefreshCw, Check, AlertTriangle } from "lucide-react";
import type { WarmLead } from "@/shared/db/types";

export function OutreachDashboard() {
  const [campaigns, setCampaigns] = useState<InstantlyCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [warmLeads, setWarmLeads] = useState<WarmLead[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const supabase = createClient();

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch Instantly campaigns
      const instantlyCampaigns = await fetchCampaigns();
      setCampaigns(instantlyCampaigns);

      // Fetch warm leads (last 100, pending first)
      const { data: leads } = await supabase
        .from("warm_leads")
        .select("*")
        .order("replied_at", { ascending: false })
        .limit(100);

      if (leads) setWarmLeads(leads);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchAllData();
    
    // Poll every 30 seconds for new warm leads
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  }

  async function handleAssignLead(leadId: string) {
    // For now, just log - later will assign to logged-in user
    await sendCommand(`Assign warm lead ${leadId} to sales rep`);
    fetchAllData();
  }

  async function handleMarkCalled(leadId: string) {
    await supabase
      .from("warm_leads")
      .update({ call_status: "called" })
      .eq("id", leadId);
    fetchAllData();
  }

  const stats = aggregateCampaignStats(campaigns);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/60">
        <div className="flex items-center gap-3">
          <h1 className="text-[11px] font-medium tracking-[0.3em] uppercase text-text-muted/70">
            Nordspike Outreach
          </h1>
          {loading ? (
            <div className="w-2 h-2 rounded-full bg-text-muted animate-pulse" />
          ) : (
            <div className="flex items-center gap-1 text-[10px] text-green-500">
              <Check size={9} />
              <span>Live</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-[10px] text-text-muted hover:text-text
                       disabled:opacity-30 transition-colors"
          >
            <RefreshCw size={11} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Loading..." : "Refresh"}
          </button>
          
          <button
            onClick={() => sendCommand("Upload CSV with 20K Estonia leads and start email verification")}
            className="flex items-center gap-1.5 text-[10px] bg-text text-bg px-2 py-1 rounded
                       hover:opacity-90 transition-opacity"
          >
            <Upload size={11} />
            Upload CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <RefreshCw size={24} className="animate-spin text-text-muted" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          
          {/* Email Stats (Instantly) */}
          <div className="border border-border/60 rounded-lg p-4 bg-bg-subtle/30">
            <div className="flex items-center gap-2 mb-3">
              <Mail size={14} className="text-blue-500" />
              <h3 className="text-xs font-medium">📧 Email Campaign (Instantly)</h3>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="text-[9px] text-text-muted/40 uppercase">Sent Today</div>
                <div className="text-xl font-light">{stats.sent.toLocaleString()}</div>
                <div className="text-[9px] text-text-muted/40">/ 2,000 goal</div>
              </div>
              <div>
                <div className="text-[9px] text-text-muted/40 uppercase">Replies</div>
                <div className="text-xl font-light text-green-500">{stats.replies.toLocaleString()}</div>
                <div className="text-[9px] text-text-muted/40">{stats.replyRate}% rate</div>
              </div>
              <div>
                <div className="text-[9px] text-text-muted/40 uppercase">Bounces</div>
                <div className="text-xl font-light">{stats.bounces.toLocaleString()}</div>
                <div className="text-[9px] text-text-muted/40">{stats.bounceRate}%</div>
              </div>
              <div>
                <div className="text-[9px] text-text-muted/40 uppercase">Active Campaigns</div>
                <div className="text-xl font-light">{stats.activeCampaigns}</div>
                <div className="text-[9px] text-text-muted/40">/ 12 accounts</div>
              </div>
            </div>

            {parseFloat(stats.bounceRate) > 3 && (
              <div className="mt-3 flex items-center gap-2 text-[10px] text-amber-500 bg-amber-400/10 px-3 py-1.5 rounded">
                <AlertTriangle size={10} />
                High bounce rate detected - consider pausing campaigns
              </div>
            )}
          </div>

          {/* LinkedIn Stats (Browser Use) - Placeholder for now */}
          <div className="border border-border/60 rounded-lg p-4 bg-bg-subtle/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare size={14} className="text-blue-500" />
                <h3 className="text-xs font-medium">💼 LinkedIn Outreach</h3>
              </div>
              <span className="text-[9px] text-text-muted/40">
                Browser Use script pending setup
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-[9px] text-text-muted/40 uppercase">Invites Sent</div>
                <div className="text-xl font-light">0 / 20</div>
                <div className="text-[9px] text-text-muted/40">today</div>
              </div>
              <div>
                <div className="text-[9px] text-text-muted/40 uppercase">Accept Rate</div>
                <div className="text-xl font-light">—</div>
                <div className="text-[9px] text-text-muted/40">target 50%</div>
              </div>
              <div>
                <div className="text-[9px] text-text-muted/40 uppercase">Replies</div>
                <div className="text-xl font-light">0</div>
                <div className="text-[9px] text-text-muted/40">from invites</div>
              </div>
            </div>

            <button
              onClick={() => sendCommand("Start LinkedIn outreach: 20 invites today with human-like pacing using Browser Use")}
              className="mt-3 text-[10px] bg-blue-400/10 text-blue-500 px-3 py-1.5 rounded
                         hover:bg-blue-400/20 transition-colors"
            >
              ⚡ Start LinkedIn Automation
            </button>
          </div>

          {/* Warm Leads Queue */}
          <div className="border border-border/60 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-green-500" />
                <h3 className="text-xs font-medium">📞 Warm Leads (Call Within 10 Min)</h3>
              </div>
              <span className="text-[9px] text-text-muted/40">
                {warmLeads.filter(l => l.call_status === "pending").length} pending
              </span>
            </div>

            {warmLeads.length === 0 ? (
              <div className="text-[10px] text-text-muted/40 text-center py-8">
                No warm leads yet — replies will appear here within 10 minutes
              </div>
            ) : (
              <div className="space-y-1">
                {warmLeads.slice(0, 20).map((lead) => {
                  const minutesAgo = Math.floor(
                    (Date.now() - new Date(lead.replied_at).getTime()) / 60000
                  );
                  
                  return (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between px-3 py-2 border-b border-border/20
                                 hover:bg-hover transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">{lead.first_name}</span>
                          <span className="text-[9px] text-text-muted/50">{lead.company}</span>
                          {lead.source === "linkedin" && (
                            <span className="text-[8px] bg-blue-400/10 text-blue-500 px-1 rounded">
                              LinkedIn
                            </span>
                          )}
                        </div>
                        <div className="text-[9px] text-text-muted/40">
                          {lead.email} • {minutesAgo} min ago
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {lead.call_status === "pending" ? (
                          <>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                              minutesAgo > 30 
                                ? "text-red-400 bg-red-400/10" 
                                : "text-amber-500 bg-amber-400/10"
                            }`}>
                              {minutesAgo > 30 ? "OVERDUE" : "Needs call"}
                            </span>
                            <button
                              onClick={() => handleMarkCalled(lead.id)}
                              className="text-[10px] bg-text text-bg px-2 py-1 rounded
                                         hover:opacity-90 transition-opacity"
                            >
                              Mark Called
                            </button>
                          </>
                        ) : (
                          <span className="text-[9px] text-green-500 flex items-center gap-1">
                            <Check size={9} />
                            {lead.call_status === "meeting_booked" ? "Meeting ✓" : "Called"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {warmLeads.length > 20 && (
              <div className="mt-2 text-[9px] text-text-muted/40 text-center">
                +{warmLeads.length - 20} more leads (showing 20)
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
