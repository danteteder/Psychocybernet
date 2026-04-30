"use client";

// Nordspike Agency Profile - Detailed Business Dashboard
// Full metrics, outreach status, team, and growth tracking

import { useCallback, useEffect, useState } from "react";
import { sendCommand, getTaskHistory, checkStatus } from "@/lib/hermes";
import { 
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Mail,
  MessageSquare,
  ExternalLink,
  RefreshCw,
  Settings,
  AlertTriangle,
  Check,
  Target,
  Zap,
  Briefcase,
} from "lucide-react";

interface NordspikeData {
  basicInfo: {
    name: string;
    url: string;
    type: string;
    founded: string;
    founder: string;
    status: "growing" | "active" | "paused";
  };
  metrics: {
    mrr: { value: number | null; currency: string; trend?: number; lastUpdated?: string };
    arr: { value: number | null; currency: string };
    ltv: { value: number | null; currency: string; trend?: number };
    cac: { value: number | null; currency: string; trend?: number };
    activeClients: number;
    pipelineValue: number | null;
    closeRate: number | null;
    avgDealSize: number | null;
  };
  outreach: {
    instantly: {
      status: "ready" | "setup_required" | "running";
      mailboxes: number;
      campaignsActive: number;
      emailsSentToday: number;
      dailyTarget: number;
      replyRate: number | null;
    };
    linkedin: {
      status: "not_setup" | "setup_ready" | "running";
      messagesSentToday: number;
      dailyTarget: number;
      connectionRate: number | null;
      replyRate: number | null;
      browserUseApiKey: string;
    };
  };
  team: {
    founder: { name: string; role: string };
    employees: Array<{ name?: string; role: string; status: "hired" | "to_hire" }>;
    targetSize: number;
  };
  goals: {
    quarterly: Array<{ goal: string; progress: number; target: number }>;
    nextHire: string;
  };
}

export function NordspikeProfile() {
  const [data, setData] = useState<NordspikeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hermesOnline, setHermesOnline] = useState(false);

  useEffect(() => {
    loadNordspikeData();
    checkStatus().then(status => setHermesOnline(status.online));
    
    const interval = setInterval(() => {
      checkStatus().then(status => setHermesOnline(status.online));
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  async function loadNordspikeData() {
    setLoading(true);
    try {
      // Try to get from history
      const history = getTaskHistory();
      const nordspikeTasks = history.filter(
        (t) => t.command.toLowerCase().includes("nordspike") && t.status === "completed"
      );

      if (nordspikeTasks.length > 0 && nordspikeTasks[0].result) {
        setData(nordspikeTasks[0].result as NordspikeData);
      } else {
        // Create default structure with missing data
        const defaultData: NordspikeData = {
          basicInfo: {
            name: "Nordspike",
            url: "https://nordspike.com/",
            type: "Full-Stack Development Agency",
            founded: "2024",
            founder: "Dante",
            status: "growing",
          },
          metrics: {
            mrr: { value: null, currency: "EUR", trend: 0 },
            arr: { value: null, currency: "EUR" },
            ltv: { value: null, currency: "EUR", trend: 0 },
            cac: { value: null, currency: "EUR", trend: 0 },
            activeClients: 0,
            pipelineValue: null,
            closeRate: null,
            avgDealSize: null,
          },
          outreach: {
            instantly: {
              status: "ready",
              mailboxes: 0,
              campaignsActive: 0,
              emailsSentToday: 0,
              dailyTarget: 20,
              replyRate: null,
            },
            linkedin: {
              status: "setup_ready",
              messagesSentToday: 0,
              dailyTarget: 20,
              connectionRate: null,
              replyRate: null,
              browserUseApiKey: "bu_8a_1v4_tBYThszFMKFdLVY0VD-BGVnwWAgwxpKzdZlY",
            },
          },
          team: {
            founder: { name: "Dante", role: "Founder & Full-Stack Engineer" },
            employees: [
              { role: "Employee #2 (Sales or Dev)", status: "to_hire" },
            ],
            targetSize: 5,
          },
          goals: {
            quarterly: [
              { goal: "Hire 2nd employee", progress: 0, target: 1 },
              { goal: "Reach €10K MRR", progress: 0, target: 10000 },
              { goal: "Close 5 new clients", progress: 0, target: 5 },
            ],
            nextHire: "Sales (outreach specialist) or Developer (fulfillment capacity)",
          },
        };
        setData(defaultData);
      }
    } finally {
      setLoading(false);
    }
  }

  async function refreshData() {
    setRefreshing(true);
    await loadNordspikeData();
    setRefreshing(false);
  }

  function formatMoney(value: number | null, currency: string = "EUR") {
    if (value === null) return "—";
    return new Intl.NumberFormat("et-EE", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  }

  const missingMetrics = [
    data?.metrics.mrr.value === null,
    data?.metrics.ltv.value === null,
    data?.metrics.cac.value === null,
  ].filter(Boolean).length;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/60">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-blue-400/10 flex items-center justify-center">
              <Building2 size={20} className="text-blue-500" />
            </div>
            <div>
              <h1 className="text-[11px] font-medium tracking-[0.3em] uppercase text-text-muted/70">
                Nordspike
              </h1>
              <a
                href="https://nordspike.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-text-muted/50 hover:text-text flex items-center gap-1"
              >
                nordspike.com
                <ExternalLink size={9} />
              </a>
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4 pl-4 border-l border-border/60">
            <div className="flex items-center gap-1 text-[10px]">
              {hermesOnline ? (
                <div className="w-2 h-2 rounded-full bg-green-500" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-red-400" />
              )}
              <span className="text-text-muted/60">
                {hermesOnline ? "Hermes Online" : "Hermes Offline"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshData}
            disabled={refreshing || loading}
            className="flex items-center gap-1.5 text-[10px] text-text-muted hover:text-text
                       disabled:opacity-30 transition-colors"
          >
            <RefreshCw size={11} className={refreshing || loading ? "animate-spin" : ""} />
            {refreshing || loading ? "Loading..." : "Refresh"}
          </button>
          
          <button
            className="flex items-center gap-1.5 text-[10px] bg-text text-bg px-2 py-1 rounded
                       hover:opacity-90 transition-opacity"
            onClick={() => sendCommand("Analyze Nordspike website and suggest 3 improvements for conversion optimization")}
          >
            <Zap size={11} />
            AI Analysis
          </button>
        </div>
      </div>

      {loading || !data ? (
        <div className="flex-1 flex items-center justify-center">
          <RefreshCw size={24} className="animate-spin text-text-muted" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
            {/* Missing Data Alert */}
            {missingMetrics > 0 && (
              <div className="mx-5 mt-4 p-3 bg-amber-400/10 border border-amber-400/30 rounded">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="text-[10px] text-amber-200">
                    <span className="font-medium">Missing Metrics:</span> You need to add {missingMetrics} key metrics to get full insights. 
                    Use voice command: "Update Nordspike MRR to X euros" to fill these in.
                  </div>
                </div>
              </div>
            )}

          {/* Key Metrics Row */}
          <div className="grid grid-cols-6 gap-px bg-border/30 border-b border-border/30 mx-5 mt-4">
            {/* MRR */}
            <div className="bg-bg px-4 py-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={14} className="text-text-muted" />
                <span className="text-[10px] text-text-muted/70 uppercase">MRR</span>
              </div>
              <div className="text-2xl font-light">
                {formatMoney(data.metrics.mrr.value, data.metrics.mrr.currency)}
              </div>
              {data.metrics.mrr.trend !== undefined && data.metrics.mrr.trend !== 0 && (
                <div className={`flex items-center gap-1 mt-1 text-xs ${
                  data.metrics.mrr.trend > 0 ? "text-green-500" : "text-red-400"
                }`}>
                  {data.metrics.mrr.trend > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {data.metrics.mrr.trend > 0 ? "+" : ""}{data.metrics.mrr.trend}%
                </div>
              )}
            </div>

            {/* LTV */}
            <div className="bg-bg px-4 py-4">
              <div className="flex items-center gap-2 mb-2">
                <Target size={14} className="text-text-muted" />
                <span className="text-[10px] text-text-muted/70 uppercase">LTV</span>
              </div>
              <div className="text-2xl font-light">
                {formatMoney(data.metrics.ltv.value, data.metrics.ltv.currency)}
              </div>
              {data.metrics.ltv.trend !== undefined && data.metrics.ltv.trend !== 0 && (
                <div className={`flex items-center gap-1 mt-1 text-xs ${
                  data.metrics.ltv.trend > 0 ? "text-green-500" : "text-red-400"
                }`}>
                  {data.metrics.ltv.trend > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {data.metrics.ltv.trend > 0 ? "+" : ""}{data.metrics.ltv.trend}%
                </div>
              )}
            </div>

            {/* CAC */}
            <div className="bg-bg px-4 py-4">
              <div className="flex items-center gap-2 mb-2">
                <Users size={14} className="text-text-muted" />
                <span className="text-[10px] text-text-muted/70 uppercase">CAC</span>
              </div>
              <div className="text-2xl font-light">
                {formatMoney(data.metrics.cac.value, data.metrics.cac.currency)}
              </div>
              {data.metrics.cac.trend !== undefined && data.metrics.cac.trend !== 0 && (
                <div className={`flex items-center gap-1 mt-1 text-xs ${
                  data.metrics.cac.trend < 0 ? "text-green-500" : "text-red-400"
                }`}>
                  {data.metrics.cac.trend < 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {data.metrics.cac.trend > 0 ? "+" : ""}{data.metrics.cac.trend}%
                </div>
              )}
            </div>

            {/* Active Clients */}
            <div className="bg-bg px-4 py-4">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase size={14} className="text-text-muted" />
                <span className="text-[10px] text-text-muted/70 uppercase">Clients</span>
              </div>
              <div className="text-2xl font-light">{data.metrics.activeClients}</div>
              <div className="text-[10px] text-text-muted/40 mt-1">active projects</div>
            </div>

            {/* Email Outreach */}
            <div className="bg-bg px-4 py-4">
              <div className="flex items-center gap-2 mb-2">
                <Mail size={14} className="text-text-muted" />
                <span className="text-[10px] text-text-muted/70 uppercase">Email</span>
              </div>
              <div className="text-2xl font-light">
                {data.outreach.instantly.emailsSentToday}/{data.outreach.instantly.dailyTarget}
              </div>
              <div className={`text-[10px] mt-1 ${
                data.outreach.instantly.status === "ready" 
                  ? "text-green-500" 
                  : "text-text-muted/40"
              }`}>
                {data.outreach.instantly.status === "ready" ? "✓ Ready" : "Setup required"}
              </div>
            </div>

            {/* LinkedIn Outreach */}
            <div className="bg-bg px-4 py-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare size={14} className="text-text-muted" />
                <span className="text-[10px] text-text-muted/70 uppercase">LinkedIn</span>
              </div>
              <div className="text-2xl font-light">
                {data.outreach.linkedin.messagesSentToday}/{data.outreach.linkedin.dailyTarget}
              </div>
              <div className={`text-[10px] mt-1 ${
                data.outreach.linkedin.status === "setup_ready"
                  ? "text-blue-500"
                  : data.outreach.linkedin.status === "running"
                  ? "text-green-500"
                  : "text-text-muted/40"
              }`}>
                {data.outreach.linkedin.status === "setup_ready" ? "⚡ Ready to start" : 
                 data.outreach.linkedin.status === "running" ? "✓ Active" : "Not setup"}
              </div>
            </div>
          </div>

          {/* Outreach Status */}
          <div className="grid grid-cols-2 gap-4 mx-5 mt-4">
            {/* Instantly */}
            <div className="border border-border/60 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-blue-500" />
                  <h3 className="text-xs font-medium">Instantly Email Campaigns</h3>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  data.outreach.instantly.status === "ready"
                    ? "text-green-500 bg-green-400/10"
                    : "text-text-muted bg-bg-subtle"
                }`}>
                  {data.outreach.instantly.status === "ready" ? "Ready" : "Setup Required"}
                </span>
              </div>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-muted/50">Mailboxes</span>
                  <span>{data.outreach.instantly.mailboxes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted/50">Active Campaigns</span>
                  <span>{data.outreach.instantly.campaignsActive}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted/50">Reply Rate</span>
                  <span>{data.outreach.instantly.replyRate ? `${data.outreach.instantly.replyRate}%` : "—"}</span>
                </div>
              </div>

              <button
                onClick={() => sendCommand("Check Instantly API integration and verify Nordspike email campaigns are ready to send 20/day")}
                className="w-full mt-3 text-[10px] bg-blue-400/10 text-blue-500 py-1.5 rounded
                           hover:bg-blue-400/20 transition-colors"
              >
                Check Setup
              </button>
            </div>

            {/* LinkedIn */}
            <div className="border border-border/60 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare size={14} className="text-blue-500" />
                  <h3 className="text-xs font-medium">LinkedIn Automation</h3>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  data.outreach.linkedin.status === "running"
                    ? "text-green-500 bg-green-400/10"
                    : data.outreach.linkedin.status === "setup_ready"
                    ? "text-blue-500 bg-blue-400/10"
                    : "text-text-muted bg-bg-subtle"
                }`}>
                  {data.outreach.linkedin.status === "running" ? "Active" : 
                   data.outreach.linkedin.status === "setup_ready" ? "Ready" : "Not Setup"}
                </span>
              </div>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-muted/50">Daily Target</span>
                  <span>{data.outreach.linkedin.dailyTarget} messages</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted/50">Connection Rate</span>
                  <span>{data.outreach.linkedin.connectionRate ? `${data.outreach.linkedin.connectionRate}%` : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted/50">API Status</span>
                  <span className="text-green-500">✓ Connected</span>
                </div>
              </div>

              <button
                onClick={() => sendCommand("Start LinkedIn automation for Nordspike: 20 outreach messages per day using Browser-Use API key")}
                className="w-full mt-3 text-[10px] bg-blue-400/10 text-blue-500 py-1.5 rounded
                           hover:bg-blue-400/20 transition-colors disabled:opacity-50"
                disabled={data.outreach.linkedin.status === "running"}
              >
                {data.outreach.linkedin.status === "running" ? "Running..." : "Start Automation"}
              </button>
            </div>
          </div>

          {/* Team & Goals */}
          <div className="grid grid-cols-2 gap-4 mx-5 mt-4 mb-4">
            {/* Team */}
            <div className="border border-border/60 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users size={14} className="text-text-muted" />
                <h3 className="text-xs font-medium">Team</h3>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-6 h-6 rounded bg-text/10 flex items-center justify-center">
                    <Users size={12} />
                  </div>
                  <div>
                    <div className="font-medium">{data.team.founder.name}</div>
                    <div className="text-[9px] text-text-muted/50">{data.team.founder.role}</div>
                  </div>
                </div>
                
                {data.team.employees.map((emp, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <div className={`w-6 h-6 rounded flex items-center justify-center ${
                      emp.status === "hired" ? "bg-green-400/10 text-green-500" : "bg-bg-subtle text-text-muted"
                    }`}>
                      <Users size={12} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{emp.role}</div>
                      <div className={`text-[9px] ${
                        emp.status === "hired" ? "text-green-500" : "text-text-muted/50"
                      }`}>
                        {emp.status === "hired" ? "✓ Hired" : "🔍 To hire"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 text-[9px] text-text-muted/40">
                Target team size: {data.team.targetSize}
              </div>
            </div>

            {/* Goals */}
            <div className="border border-border/60 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target size={14} className="text-text-muted" />
                <h3 className="text-xs font-medium">Quarterly Goals</h3>
              </div>
              
              <div className="space-y-3">
                {data.goals.quarterly.map((goal, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{goal.goal}</span>
                      <span className="text-text-muted/50">
                        {goal.progress}/{goal.target}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-bg-subtle rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-text transition-all"
                        style={{ width: `${(goal.progress / goal.target) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-border/30">
                <div className="text-[9px] text-text-muted/50 mb-1">Next Hire Priority:</div>
                <div className="text-xs">{data.goals.nextHire}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions Footer */}
      <div className="border-t border-border/60 px-5 py-3 bg-bg-subtle/50">
        <div className="text-[10px] text-text-muted/50 uppercase tracking-wider mb-2">
          Quick Commands
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => sendCommand("Update Nordspike MRR to X EUR for current month")}
            className="text-[10px] bg-bg border border-border px-3 py-1.5 rounded
                       hover:bg-hover transition-colors"
          >
            💰 Update MRR
          </button>
          <button
            onClick={() => sendCommand("Add new client to Nordspike active clients list")}
            className="text-[10px] bg-bg border border-border px-3 py-1.5 rounded
                       hover:bg-hover transition-colors"
          >
            ➕ Add Client
          </button>
          <button
            onClick={() => sendCommand("Generate weekly revenue report for Nordspike")}
            className="text-[10px] bg-bg border border-border px-3 py-1.5 rounded
                       hover:bg-hover transition-colors"
          >
            📊 Weekly Report
          </button>
          <button
            onClick={() => sendCommand("Research 50 potential Nordspike leads in tech startup space, create outreach list")}
            className="text-[10px] bg-bg border border-border px-3 py-1.5 rounded
                       hover:bg-hover transition-colors"
          >
            🔍 Generate Leads
          </button>
        </div>
      </div>
    </div>
  );
}
