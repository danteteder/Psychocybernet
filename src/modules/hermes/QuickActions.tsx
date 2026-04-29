"use client";

// Pre-defined quick action buttons for common Hermes commands
// One tap → command sent

import { sendCommand, type HermesTask } from "@/lib/hermes";
import { ShoppingBag, BarChart3, Mail, Globe } from "lucide-react";

const ACTIONS = [
  { label: "Check Shopify", command: "Check all Shopify store pages for issues", icon: ShoppingBag },
  { label: "Daily Report", command: "Generate my daily productivity report", icon: BarChart3 },
  { label: "Scan Emails", command: "Scan my email inboxes for important messages", icon: Mail },
  { label: "Browse Task", command: "Open browser and complete the next pending task", icon: Globe },
];

interface QuickActionsProps {
  onTaskCreated: (task: HermesTask) => void;
}

export function QuickActions({ onTaskCreated }: QuickActionsProps) {
  async function handleAction(command: string) {
    const task = await sendCommand(command);
    onTaskCreated(task);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {ACTIONS.map((a) => (
        <button
          key={a.label}
          onClick={() => handleAction(a.command)}
          className="flex items-center gap-1.5 rounded border border-border px-2.5 py-1.5
                     text-[11px] text-text-muted hover:text-text hover:border-text-muted/40
                     transition-colors"
        >
          <a.icon size={12} strokeWidth={1.5} />
          {a.label}
        </button>
      ))}
    </div>
  );
}
