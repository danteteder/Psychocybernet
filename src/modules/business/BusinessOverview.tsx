"use client";

// Business Overview Dashboard: Multi-business management
// Shows all businesses with key metrics, one-click access to details

import { useCallback, useEffect, useState } from "react";
import { sendCommand, getTaskHistory } from "@/lib/hermes";
import { 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Users,
  Mail,
  MessageSquare,
  ExternalLink,
  Plus,
  Settings,
  AlertTriangle,
  Check,
  Briefcase,
  Target,
} from "lucide-react";

interface BusinessMetric {
  name: string;
  value: string | number;
  unit?: string;
  trend?: "up" | "down" | "flat";
  change?: number;
  status?: "ok" | "warning" | "error" | "missing";
}

interface Business {
  id: string;
  name: string;
  url?: string;
  type: "agency" | "ecommerce" | "saas" | "consulting" | "other";
  status: "active" | "paused" | "growing" | "struggling";
  logo?: string;
  metrics: BusinessMetric[];
  quickStats: {
    leads?: number;
    revenue?: number;
    growth?: number;
    teamSize?: number;
  };
  lastUpdated: string;
}

export function BusinessOverview() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  // Load businesses from history or create defaults
  useEffect(() => {
    loadBusinesses();
  }, []);

  async function loadBusinesses() {
    setLoading(true);
    try {
      // Try to get from task history
      const history = getTaskHistory();
      const businessTasks = history.filter(
        (t) => t.command.toLowerCase().includes("business overview") 
                && t.status === "completed"
      );

      if (businessTasks.length > 0 && Array.isArray(businessTasks[0].result)) {
        setBusinesses(businessTasks[0].result as Business[]);
      } else {
        // Create default businesses including Nordspike with actual metrics
        const defaultBusinesses: Business[] = [
          {
            id: "nordspike",
            name: "Nordspike",
            url: "https://nordspike.com/",
            type: "agency",
            status: "growing",
            metrics: [
              { name: "MRR", value: "2,500", status: "ok", unit: "EUR" },
              { name: "Clients", value: "2", status: "ok", unit: "monthly" },
              { name: "Side Projects", value: "~500", status: "ok", unit: "EUR" },
              { name: "Email Campaign", value: "Active", status: "ok" },
              { name: "LinkedIn", value: "Setup Ready", status: "warning" },
              { name: "Upwork", value: "To Automate", status: "warning" },
            ],
            quickStats: {
              leads: 0,
              revenue: 2500,
              growth: 0,
              teamSize: 1,
            },
            lastUpdated: new Date().toISOString(),
          },
          // Placeholder for future businesses
          {
            id: "placeholder-1",
            name: "E-commerce Store",
            type: "ecommerce",
            status: "paused",
            metrics: [
              { name: "Revenue", value: "—", status: "missing", unit: "USD" },
              { name: "Orders", value: 0, status: "missing" },
              { name: "Conversion Rate", value: "—", status: "missing", unit: "%" },
            ],
            quickStats: {},
            lastUpdated: new Date().toISOString(),
          },
        ];

        setBusinesses(defaultBusinesses);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleAddBusiness() {
    await sendCommand(
      "Help me set up a new business entity in Psychocybernet. Ask me for: business name, type, key metrics to track, and any existing data sources to integrate."
    );
  }

  function getStatusColor(status: Business["status"]) {
    switch (status) {
      case "growing": return "text-green-500 bg-green-400/10";
      case "active": return "text-blue-500 bg-blue-400/10";
      case "struggling": return "text-red-400 bg-red-400/10";
      case "paused": return "text-text-muted bg-bg-subtle";
      default: return "text-text-muted";
    }
  }

  function getMetricStatusColor(status?: BusinessMetric["status"]) {
    switch (status) {
      case "ok": return "text-text";
      case "warning": return "text-amber-500";
      case "error": return "text-red-400";
      case "missing": return "text-text-muted/30";
      default: return "text-text";
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/60">
        <div className="flex items-center gap-3">
          <h1 className="text-[11px] font-medium tracking-[0.3em] uppercase text-text-muted/70">
            Business Overview
          </h1>
          {loading ? (
            <div className="w-2 h-2 rounded-full bg-text-muted animate-pulse" />
          ) : (
            <div className="flex items-center gap-1 text-[10px] text-green-500">
              <Check size={9} />
              <span>{businesses.length} businesses</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAddBusiness}
            className="flex items-center gap-1.5 text-[10px] bg-text text-bg px-2 py-1 rounded
                       hover:opacity-90 transition-opacity"
          >
            <Plus size={11} />
            Add Business
          </button>
        </div>
      </div>

      {/* Weekly Meetings & Priorities */}
      <div className="px-5 py-3 border-b border-border/30">
        <div className="grid grid-cols-2 gap-3">
          {/* This Week's Meetings */}
          <div className="border border-border/60 rounded-lg p-3 bg-bg-subtle/30">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase size={12} className="text-blue-500" />
              <h3 className="text-[10px] font-medium uppercase tracking-wider text-text-muted/70">
                This Week
              </h3>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted/60">Sales Interviews</span>
                <span className="text-text">5 candidates</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted/60">Client Calls</span>
                <span className="text-text">2 monthly clients</span>
              </div>
              <div className="text-[9px] text-text-muted/40 mt-1">
                Scheduling interviews for Technical Sales role (25% commission)
              </div>
            </div>
          </div>

          {/* Current Priorities */}
          <div className="border border-border/60 rounded-lg p-3 bg-bg-subtle/30">
            <div className="flex items-center gap-2 mb-2">
              <Target size={12} className="text-green-500" />
              <h3 className="text-[10px] font-medium uppercase tracking-wider text-text-muted/70">
                Priorities
              </h3>
            </div>
            <div className="space-y-1">
              <div className="flex items-start gap-1.5 text-[10px]">
                <div className="w-3 h-3 rounded border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={8} className="text-green-500" />
                </div>
                <span className="text-text">Email campaign to warm leads</span>
              </div>
              <div className="flex items-start gap-1.5 text-[10px]">
                <div className="w-3 h-3 rounded border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                </div>
                <span className="text-text-muted">Setup LinkedIn automation (20/day)</span>
              </div>
              <div className="flex items-start gap-1.5 text-[10px]">
                <div className="w-3 h-3 rounded border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                </div>
                <span className="text-text-muted">Setup Upwork automation for leads</span>
              </div>
              <div className="flex items-start gap-1.5 text-[10px]">
                <div className="w-3 h-3 rounded border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                </div>
                <span className="text-text-muted">Technical sales rep cold calls</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Business Grid - Card Layout (40% viewport per card) */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {businesses.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <Building2 size={32} className="mx-auto text-text-muted/30 mb-3" />
              <p className="text-sm text-text-muted mb-2">No businesses yet</p>
              <p className="text-xs text-text-muted/40">
                Click "Add Business" to get started
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {businesses.map((biz) => (
              <div
                key={biz.id}
                className="border border-border/60 rounded-xl overflow-hidden
                           hover:border-text-muted/40 transition-colors
                           w-full max-w-[720px] mx-auto"
              >
                {/* Business Header - Minimal */}
                <div className="bg-bg-subtle px-6 py-4 border-b border-border/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded flex items-center justify-center ${
                        biz.type === "agency" ? "bg-blue-400/10 text-blue-500" :
                        biz.type === "ecommerce" ? "bg-green-400/10 text-green-500" :
                        "bg-text-muted/10 text-text-muted"
                      }`}>
                        <Building2 size={20} />
                      </div>
                      
                      <div>
                        <h3 className="text-base font-light">{biz.name}</h3>
                        {biz.url && (
                          <a
                            href={biz.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-text-muted/50 hover:text-text"
                          >
                            {biz.url.replace("https://", "")}
                          </a>
                        )}
                      </div>
                    </div>
                    
                    {/* Simple Status */}
                    <span className={`text-[10px] px-2 py-1 rounded capitalize ${
                      getStatusColor(biz.status)
                    }`}>
                      {biz.status}
                    </span>
                  </div>
                </div>

                {/* Metrics - Minimal Tall Card */}
                <div className="px-6 py-5">
                  <div className="flex flex-col gap-4">
                    {biz.metrics.map((metric, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                        <div className="text-[10px] text-text-muted/60 uppercase tracking-wider">
                          {metric.name}
                        </div>
                        <div className={`text-xl font-light ${
                          getMetricStatusColor(metric.status)
                        }`}>
                          {metric.value === "—" ? (
                            <span className="text-text-muted/30">—</span>
                          ) : (
                            <>
                              {metric.value}
                              {metric.unit && (
                                <span className="text-[9px] text-text-muted/50 ml-1">
                                  {metric.unit}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions - Minimal */}
                <div className="px-4 py-2 border-t border-border/30 bg-bg-subtle/30">
                  <div className="flex items-center gap-2">
                    {biz.id === "nordspike" && (
                      <>
                        <button
                          onClick={() => sendCommand(`Check Nordspike Instantly API integration status and verify email campaigns are ready to send`)}
                          className="text-[10px] bg-blue-400/10 text-blue-500 px-2 py-1 rounded
                                     hover:bg-blue-400/20 transition-colors flex items-center gap-1"
                        >
                          <Mail size={10} />
                          Check Email Setup
                        </button>
                        <button
                          onClick={() => sendCommand(`Set up LinkedIn automation for Nordspike: 20 outreach messages per day using Browser-Use API`)}
                          className="text-[10px] bg-blue-400/10 text-blue-500 px-2 py-1 rounded
                                     hover:bg-blue-400/20 transition-colors flex items-center gap-1"
                        >
                          <MessageSquare size={10} />
                          Start LinkedIn Outreach
                        </button>
                        <button
                          onClick={() => window.location.href = "/business/nordspike"}
                          className="text-[10px] bg-bg border border-border px-2 py-1 rounded
                                     hover:bg-hover transition-colors"
                        >
                          View Full Profile →
                        </button>
                      </>
                    )}
                    
                    {biz.id !== "nordspike" && (
                      <div className="text-[10px] text-text-muted/40">
                        Business profile coming soon...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Items */}
      <div className="border-t border-border/60 px-5 py-3 bg-bg-subtle/50">
        <div className="flex items-start gap-2">
          <AlertTriangle size={12} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-[10px] text-text-muted/60">
            <span className="font-medium text-text">This Week's Focus:</span>{" "}
            Interview 5 technical sales candidates, setup LinkedIn automation (20 msgs/day), and prepare Upwork lead scraping. 
            Current MRR: €2,500 (2 clients + side projects). Voice command: "Update interviews scheduled" to track progress.
          </div>
        </div>
      </div>
    </div>
  );
}
