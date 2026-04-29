"use client";

// Revenue Dashboard: Real-time revenue tracking across all businesses
// Integrates Shopify, Instantly, and other revenue streams

import { useCallback, useEffect, useState } from "react";
import { sendCommand, getTaskHistory, type HermesTask } from "@/lib/hermes";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Mail, 
  RefreshCw,
  AlertTriangle,
  Check,
  ExternalLink,
  Plus,
  Settings
} from "lucide-react";

interface RevenueStream {
  id: string;
  name: string;
  type: "shopify" | "instantly" | "custom" | "service";
  revenue: number;
  previousRevenue: number;
  orders?: number;
  leads?: number;
  currency: string;
  lastUpdated: string;
  status: "ok" | "warning" | "error";
}

interface RevenueSummary {
  totalRevenue: number;
  totalGrowth: number;
  topPerformer: RevenueStream | null;
  streams: RevenueStream[];
}

export function RevenueDashboard() {
  const [streams, setStreams] = useState<RevenueStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddStream, setShowAddStream] = useState(false);

  // Load initial data
  useEffect(() => {
    loadRevenueData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadRevenueData, 300000);
    return () => clearInterval(interval);
  }, []);

  async function loadRevenueData() {
    setLoading(true);
    try {
      // Try to get latest revenue data from task history
      const history = getTaskHistory();
      const revenueTasks = history.filter(
        (t) => t.command.toLowerCase().includes("revenue") && t.status === "completed"
      );

      if (revenueTasks.length > 0) {
        const latest = revenueTasks[revenueTasks.length - 1];
        if (latest.result && typeof latest.result === "object") {
          const data = latest.result as any;
          if (data.streams) {
            setStreams(data.streams);
          }
        }
      } else {
        // No data yet - trigger initial scan
        await triggerRevenueScan();
      }
    } finally {
      setLoading(false);
    }
  }

  async function triggerRevenueScan() {
    setRefreshing(true);
    await sendCommand(
      "Fetch revenue data from all connected business integrations (Shopify, Instantly, etc.) and calculate totals, growth rates, and top performers",
      {
        action: "revenue_scan",
        timestamp: new Date().toISOString(),
      }
    );
    
    // Create mock data for demo until Hermes returns real data
    setTimeout(() => {
      const mockStreams: RevenueStream[] = [
        {
          id: "shopify-main",
          name: "Main Shopify Store",
          type: "shopify",
          revenue: 12450.00,
          previousRevenue: 10200.00,
          orders: 87,
          currency: "USD",
          lastUpdated: new Date().toISOString(),
          status: "ok",
        },
        {
          id: "instantly-outreach",
          name: "Instantly Lead Gen",
          type: "instantly",
          revenue: 5600.00,
          previousRevenue: 6100.00,
          leads: 34,
          currency: "USD",
          lastUpdated: new Date().toISOString(),
          status: "warning",
        },
        {
          id: "consulting",
          name: "Consulting Services",
          type: "service",
          revenue: 8000.00,
          previousRevenue: 7500.00,
          currency: "USD",
          lastUpdated: new Date().toISOString(),
          status: "ok",
        },
      ];
      
      setStreams(mockStreams);
      setRefreshing(false);
    }, 2000);
  }

  function formatCurrency(amount: number, currency: string = "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return 100;
    return ((current - previous) / previous) * 100;
  }

  const totalRevenue = streams.reduce((sum, s) => sum + s.revenue, 0);
  const totalPrevious = streams.reduce((sum, s) => sum + s.previousRevenue, 0);
  const totalGrowth = calculateGrowth(totalRevenue, totalPrevious);
  
  const topPerformer = streams.reduce((top, current) => 
    current.revenue > (top?.revenue || 0) ? current : top
  , null as RevenueStream | null);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/60">
        <div className="flex items-center gap-3">
          <h1 className="text-[11px] font-medium tracking-[0.3em] uppercase text-text-muted/70">
            Revenue Dashboard
          </h1>
          {loading ? (
            <RefreshCw size={11} className="animate-spin text-text-muted" />
          ) : (
            <div className="flex items-center gap-1 text-[10px] text-green-500">
              <Check size={9} />
              <span>Live</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={triggerRevenueScan}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-[10px] text-text-muted hover:text-text
                       disabled:opacity-30 transition-colors"
          >
            <RefreshCw size={11} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Updating..." : "Refresh"}
          </button>
          
          <button
            onClick={() => setShowAddStream(!showAddStream)}
            className="flex items-center gap-1.5 text-[10px] bg-text text-bg px-2 py-1 rounded
                       hover:opacity-90 transition-opacity"
          >
            <Plus size={11} />
            Add Stream
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-px bg-border/30 border-b border-border/30">
        {/* Total Revenue */}
        <div className="bg-bg px-4 py-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={14} className="text-text-muted" />
            <span className="text-[10px] text-text-muted/70 uppercase tracking-wider">
              Total Revenue
            </span>
          </div>
          <div className="text-2xl font-light">
            {formatCurrency(totalRevenue)}
          </div>
          <div className={`flex items-center gap-1 mt-1 text-xs ${
            totalGrowth >= 0 ? "text-green-500" : "text-red-400"
          }`}>
            {totalGrowth >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            <span>{totalGrowth >= 0 ? "+" : ""}{totalGrowth.toFixed(1)}%</span>
          </div>
        </div>

        {/* Orders/Leads */}
        <div className="bg-bg px-4 py-4">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart size={14} className="text-text-muted" />
            <span className="text-[10px] text-text-muted/70 uppercase tracking-wider">
              Total Activity
            </span>
          </div>
          <div className="text-2xl font-light">
            {streams.reduce((sum, s) => sum + (s.orders || s.leads || 0), 0)}
          </div>
          <div className="text-[10px] text-text-muted/40 mt-1">
            orders + leads this period
          </div>
        </div>

        {/* Top Performer */}
        <div className="bg-bg px-4 py-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-text-muted" />
            <span className="text-[10px] text-text-muted/70 uppercase tracking-wider">
              Top Performer
            </span>
          </div>
          <div className="text-sm font-medium truncate">
            {topPerformer?.name || "—"}
          </div>
          <div className="text-xs text-text-muted/40 mt-1">
            {topPerformer ? formatCurrency(topPerformer.revenue) : "No data"}
          </div>
        </div>

        {/* Active Streams */}
        <div className="bg-bg px-4 py-4">
          <div className="flex items-center gap-2 mb-2">
            <Settings size={14} className="text-text-muted" />
            <span className="text-[10px] text-text-muted/70 uppercase tracking-wider">
              Active Streams
            </span>
          </div>
          <div className="text-2xl font-light">
            {streams.length}
          </div>
          <div className="text-[10px] text-text-muted/40 mt-1">
            revenue sources tracked
          </div>
        </div>
      </div>

      {/* Revenue Streams List */}
      <div className="flex-1 overflow-y-auto">
        {streams.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-center px-4 py-8">
            <div className="max-w-sm">
              <DollarSign size={32} className="mx-auto text-text-muted/30 mb-3" />
              <p className="text-sm text-text-muted mb-2">
                No revenue streams connected
              </p>
              <p className="text-xs text-text-muted/40">
                Click "Add Stream" to connect your first business or use voice command:
                "Track my Shopify revenue"
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {streams.map((stream) => {
              const growth = calculateGrowth(stream.revenue, stream.previousRevenue);
              const isPositive = growth >= 0;

              return (
                <div
                  key={stream.id}
                  className="px-4 py-3 hover:bg-hover transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    {/* Left: Icon + Name */}
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded flex items-center justify-center ${
                        stream.type === "shopify" ? "bg-green-400/10 text-green-500" :
                        stream.type === "instantly" ? "bg-blue-400/10 text-blue-500" :
                        stream.type === "service" ? "bg-purple-400/10 text-purple-500" :
                        "bg-text-muted/10 text-text-muted"
                      }`}>
                        {stream.type === "shopify" ? <ShoppingCart size={14} /> :
                         stream.type === "instantly" ? <Mail size={14} /> :
                         <DollarSign size={14} />}
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium">{stream.name}</div>
                        <div className="text-[10px] text-text-muted/40 capitalize">
                          {stream.type}
                          {stream.orders && ` • ${stream.orders} orders`}
                          {stream.leads && ` • ${stream.leads} leads`}
                        </div>
                      </div>
                    </div>

                    {/* Right: Revenue + Growth */}
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {formatCurrency(stream.revenue)}
                      </div>
                      <div className={`flex items-center justify-end gap-1 text-xs ${
                        isPositive ? "text-green-500" : "text-red-400"
                      }`}>
                        {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        <span>{isPositive ? "+" : ""}{growth.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Status indicator */}
                  {stream.status === "warning" && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-amber-500">
                      <AlertTriangle size={9} />
                      <span>Revenue decreased from last period</span>
                    </div>
                  )}
                  
                  {stream.status === "error" && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-red-400">
                      <AlertTriangle size={9} />
                      <span>Unable to fetch data - check connection</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="border-t border-border/60 px-5 py-3">
        <div className="text-[10px] text-text-muted/50 uppercase tracking-wider mb-2">
          Revenue Boosters
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => sendCommand("Analyze Shopify store and suggest 3 quick wins to increase conversion rate")}
            className="text-[10px] bg-bg-subtle border border-border px-3 py-1.5 rounded
                       hover:bg-hover transition-colors"
          >
            🎯 Optimize Conversion
          </button>
          
          <button
            onClick={() => sendCommand("Create email campaign for inactive Shopify customers from last 30 days")}
            className="text-[10px] bg-bg-subtle border border-border px-3 py-1.5 rounded
                       hover:bg-hover transition-colors"
          >
            📧 Winback Campaign
          </button>
          
          <button
            onClick={() => sendCommand("Research top 10 competitors pricing for similar products")}
            className="text-[10px] bg-bg-subtle border border-border px-3 py-1.5 rounded
                       hover:bg-hover transition-colors"
          >
            💰 Competitor Analysis
          </button>
          
          <button
            onClick={() => sendCommand("Generate 5 high-converting product descriptions for bestsellers")}
            className="text-[10px] bg-bg-subtle border border-border px-3 py-1.5 rounded
                       hover:bg-hover transition-colors"
          >
            ✨ AI Copywriting
          </button>
        </div>
      </div>
    </div>
  );
}
