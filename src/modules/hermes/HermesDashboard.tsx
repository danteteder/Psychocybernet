"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendCommand, checkStatus } from "@/lib/hermes";
import { Activity, Check, AlertTriangle, RefreshCw, Terminal, MessageSquare, Zap, Database, Cloud } from "lucide-react";

interface HermesStatus {
  online: boolean;
  version?: string;
}

interface SessionStats {
  totalSessions: number;
  recentSessions: number;
  totalTokens: number;
}

export function HermesDashboard() {
  const [status, setStatus] = useState<HermesStatus | null>(null);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const supabase = createClient();

  const fetchStatus = useCallback(async () => {
    try {
      // Check gateway status
      const gatewayStatus = await checkStatus();
      setStatus({
        online: gatewayStatus.online,
        version: gatewayStatus.version,
      });

      // Fetch session stats from Supabase
      const { count: totalSessions } = await supabase
        .from("activity_logs")
        .select("*", { count: "exact", head: true });

      const { count: recentSessions } = await supabase
        .from("activity_logs")
        .select("*", { count: "exact", head: true })
        .gte("created_at", new Date(Date.now() - 300000).toISOString()); // Last 5 min

      setStats({
        totalSessions: totalSessions || 0,
        recentSessions: recentSessions || 0,
        totalTokens: 0, // Would need to aggregate from sessions
      });
    } catch (error) {
      console.error("Failed to fetch Hermes status:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // Auto-refresh every 10s
    return () => clearInterval(interval);
  }, [fetchStatus]);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchStatus();
    setRefreshing(false);
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <RefreshCw size={32} className="animate-spin text-text-muted" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/60">
        <div className="flex items-center gap-3">
          <Zap size={18} className="text-blue-500" />
          <h1 className="text-[11px] font-medium tracking-[0.3em] uppercase text-text-muted/70">
            Hermes Agent Status
          </h1>
          {status?.online ? (
            <div className="flex items-center gap-1 text-[10px] text-green-500">
              <Check size={9} />
              <span>Online</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[10px] text-red-400">
              <AlertTriangle size={9} />
              <span>Offline</span>
            </div>
          )}
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-[10px] text-text-muted hover:text-text
                     disabled:opacity-30 transition-colors"
        >
          <RefreshCw size={11} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        
        {/* Gateway Status */}
        <div className="border border-border/60 rounded-lg p-4 bg-bg-subtle/30">
          <div className="flex items-center gap-2 mb-3">
            <Cloud size={14} className="text-blue-500" />
            <h3 className="text-xs font-medium">Gateway Status</h3>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-[9px] text-text-muted/40 uppercase">PID</div>
              <div className="text-lg font-light">5613</div>
            </div>
            <div>
              <div className="text-[9px] text-text-muted/40 uppercase">Active Agents</div>
              <div className="text-lg font-light">0</div>
            </div>
            <div>
              <div className="text-[9px] text-text-muted/40 uppercase">Version</div>
              <div className="text-lg font-light">1.8.15</div>
            </div>
          </div>

          {/* Platform Status */}
          <div className="mt-4 pt-4 border-t border-border/30">
            <div className="text-[9px] text-text-muted/40 uppercase mb-2">Connected Platforms</div>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded text-[9px] bg-green-400/10 text-green-500">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Telegram
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded text-[9px] bg-green-400/10 text-green-500">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Webhook
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded text-[9px] bg-green-400/10 text-green-500">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                API Server
              </div>
            </div>
          </div>
        </div>

        {/* Session Stats */}
        <div className="border border-border/60 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={14} className="text-green-500" />
            <h3 className="text-xs font-medium">Session Statistics</h3>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-[9px] text-text-muted/40 uppercase">Total Sessions</div>
              <div className="text-lg font-light">{stats?.totalSessions.toLocaleString() || "—"}</div>
            </div>
            <div>
              <div className="text-[9px] text-text-muted/40 uppercase">Last 5 Min</div>
              <div className="text-lg font-light">{stats?.recentSessions || 0}</div>
            </div>
            <div>
              <div className="text-[9px] text-text-muted/40 uppercase">Total Tokens</div>
              <div className="text-lg font-light">{stats?.totalTokens.toLocaleString() || "—"}</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="border border-border/60 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Terminal size={14} className="text-text-muted" />
            <h3 className="text-xs font-medium">Quick Actions</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => window.open("http://localhost:9119", "_blank")}
              className="flex items-center justify-center gap-1.5 text-[10px] bg-blue-400/10 text-blue-500 px-3 py-2 rounded
                         hover:bg-blue-400/20 transition-colors"
            >
              <Cloud size={11} />
              Open Full Dashboard (Port 9119)
            </button>
            
            <button
              onClick={() => sendCommand("Show me recent session history")}
              className="flex items-center justify-center gap-1.5 text-[10px] bg-text text-bg px-3 py-2 rounded
                         hover:opacity-90 transition-opacity"
            >
              <MessageSquare size={11} />
              View Recent Sessions
            </button>
            
            <button
              onClick={() => sendCommand("Show Hermes analytics and token usage for the last 7 days")}
              className="flex items-center justify-center gap-1.5 text-[10px] bg-blue-400/10 text-blue-500 px-3 py-2 rounded
                         hover:bg-blue-400/20 transition-colors"
            >
              <Activity size={11} />
              Analytics (7 days)
            </button>
            
            <button
              onClick={() => sendCommand("List all connected platforms and their status")}
              className="flex items-center justify-center gap-1.5 text-[10px] bg-bg border border-border px-3 py-2 rounded
                         hover:bg-hover transition-colors"
            >
              <Database size={11} />
              Platform Status
            </button>
          </div>
        </div>

        {/* Configuration */}
        <div className="border border-border/60 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={14} className="text-amber-500" />
            <h3 className="text-xs font-medium">Configuration</h3>
          </div>
          
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-border/20">
              <span className="text-text-muted/50">Model</span>
              <span className="text-text">qwen/qwen3.5-plus-02-15</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/20">
              <span className="text-text-muted/50">Provider</span>
              <span className="text-text">Nous (default)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/20">
              <span className="text-text-muted/50">Backend</span>
              <span className="text-text">Local (Docker)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-text-muted/50">Gateway Port</span>
              <span className="text-text">9119 (Dashboard)</span>
            </div>
          </div>
          
          <button
            onClick={() => sendCommand("Show current Hermes configuration and settings")}
            className="w-full mt-3 text-[10px] bg-bg border border-border px-3 py-1.5 rounded
                       hover:bg-hover transition-colors"
          >
            View Full Config →
          </button>
        </div>

      </div>
    </div>
  );
}
