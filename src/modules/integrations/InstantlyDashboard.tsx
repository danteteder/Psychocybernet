"use client";

import { useEffect, useState } from "react";
import { Mail, Send, Users, AlertCircle } from "lucide-react";

// Campaign data from Instantly API
interface Campaign {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

// Instantly email campaign overview widget
// Shows a summary of active campaigns
export function InstantlyDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const res = await fetch("/api/instantly?endpoint=campaigns");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        // Instantly returns campaigns in an array (or object with campaigns key)
        const list = Array.isArray(data) ? data : data.campaigns || [];
        setCampaigns(list);
      } catch {
        setError("Could not load campaigns");
      } finally {
        setLoading(false);
      }
    }
    fetchCampaigns();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-text-muted">
        ...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-text-muted">
        <AlertCircle size={14} strokeWidth={1.5} />
        {error}
      </div>
    );
  }

  const active = campaigns.filter((c) => c.status === "active").length;
  const paused = campaigns.filter((c) => c.status === "paused").length;

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-center gap-2 rounded border border-border p-3">
          <Send size={14} strokeWidth={1.5} className="text-text-muted" />
          <div>
            <p className="text-lg font-light">{campaigns.length}</p>
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Total</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded border border-border p-3">
          <Mail size={14} strokeWidth={1.5} className="text-text-muted" />
          <div>
            <p className="text-lg font-light">{active}</p>
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Active</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded border border-border p-3">
          <Users size={14} strokeWidth={1.5} className="text-text-muted" />
          <div>
            <p className="text-lg font-light">{paused}</p>
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Paused</p>
          </div>
        </div>
      </div>

      {/* Campaign list */}
      <div className="space-y-1">
        {campaigns.slice(0, 10).map((campaign) => (
          <div
            key={campaign.id}
            className="flex items-center justify-between rounded px-3 py-2 hover:bg-hover transition-colors"
          >
            <span className="text-sm">{campaign.name}</span>
            <span
              className={`text-[10px] uppercase tracking-wider
                ${campaign.status === "active" ? "text-text" : "text-text-muted"}`}
            >
              {campaign.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
