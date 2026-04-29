"use client";

// Shopify store health monitor
// Connects to Hermes which runs browser automation to scan the store

import { useCallback, useEffect, useState } from "react";
import { sendCommand, getTaskHistory, type HermesTask } from "@/lib/hermes";
import { StatusIndicator } from "@/modules/hermes/StatusIndicator";
import { RefreshCw, AlertTriangle, Check, Clock, ExternalLink } from "lucide-react";

interface ScanResult {
  url: string;
  status: "ok" | "issue" | "error";
  message: string;
  timestamp: string;
}

export function ShopifyMonitor() {
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [storeUrl, setStoreUrl] = useState("");

  // Load last scan results from task history
  useEffect(() => {
    const history = getTaskHistory();
    const shopifyTasks = history.filter(
      (t) => t.command.toLowerCase().includes("shopify") && t.status === "completed"
    );
    if (shopifyTasks.length > 0) {
      const latest = shopifyTasks[shopifyTasks.length - 1];
      setLastScan(latest.completedAt || latest.createdAt);
      if (Array.isArray(latest.result)) {
        setResults(latest.result as ScanResult[]);
      }
    }
  }, []);

  const triggerScan = useCallback(async () => {
    setScanning(true);
    const url = storeUrl || "your Shopify store";
    await sendCommand(`Scan all pages on ${url} for broken links, missing images, and SEO issues`, {
      action: "shopify_scan",
      storeUrl: storeUrl || undefined,
    });
    // Poll for completion (Hermes will process async)
    setScanning(false);
    setLastScan(new Date().toISOString());
  }, [storeUrl]);

  const issueCount = results.filter((r) => r.status !== "ok").length;
  const okCount = results.filter((r) => r.status === "ok").length;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/60">
        <div className="flex items-center gap-3">
          <h1 className="text-[11px] font-medium tracking-[0.3em] uppercase text-text-muted/70">
            Shopify
          </h1>
          <StatusIndicator />
        </div>

        <button
          onClick={triggerScan}
          disabled={scanning}
          className="flex items-center gap-1.5 text-[10px] text-text-muted hover:text-text
                     disabled:opacity-30 transition-colors"
        >
          <RefreshCw size={11} className={scanning ? "animate-spin" : ""} />
          {scanning ? "Scanning..." : "Scan Now"}
        </button>
      </div>

      {/* Store URL config */}
      <div className="flex items-center gap-2 px-5 py-2 border-b border-border/30">
        <input
          type="text"
          value={storeUrl}
          onChange={(e) => setStoreUrl(e.target.value)}
          placeholder="Store URL (e.g. mystore.myshopify.com)"
          className="flex-1 bg-transparent text-[12px] placeholder:text-text-muted/30 focus:outline-none"
        />
        {storeUrl && (
          <a
            href={`https://${storeUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-muted/50 hover:text-text transition-colors"
          >
            <ExternalLink size={11} />
          </a>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-px bg-border/30 border-b border-border/30">
        <div className="bg-bg px-4 py-3 text-center">
          <div className="text-lg font-light">{results.length}</div>
          <div className="text-[10px] text-text-muted/50 uppercase tracking-wider">Pages</div>
        </div>
        <div className="bg-bg px-4 py-3 text-center">
          <div className="text-lg font-light text-green-500/80">{okCount}</div>
          <div className="text-[10px] text-text-muted/50 uppercase tracking-wider">OK</div>
        </div>
        <div className="bg-bg px-4 py-3 text-center">
          <div className={`text-lg font-light ${issueCount > 0 ? "text-red-400" : "text-text-muted/30"}`}>
            {issueCount}
          </div>
          <div className="text-[10px] text-text-muted/50 uppercase tracking-wider">Issues</div>
        </div>
      </div>

      {/* Last scan time */}
      {lastScan && (
        <div className="flex items-center gap-1.5 px-5 py-2 text-[10px] text-text-muted/40">
          <Clock size={10} />
          Last scan: {new Date(lastScan).toLocaleString()}
        </div>
      )}

      {/* Results list */}
      <div className="flex-1 overflow-y-auto">
        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-text-muted/30">
            <p className="text-xs">No scan results yet</p>
            <p className="text-[10px]">Click &quot;Scan Now&quot; to check your store</p>
          </div>
        ) : (
          results.map((r, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 px-5 py-2 border-b border-border/20
                         hover:bg-hover transition-colors"
            >
              {r.status === "ok" ? (
                <Check size={12} className="text-green-500/60 mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle size={12} className="text-red-400 mt-0.5 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] truncate">{r.url}</p>
                <p className="text-[10px] text-text-muted/50">{r.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
