"use client";

import { useState } from "react";
import { Trash2, Check, X } from "lucide-react";
import { Badge } from "@/shared/ui/Badge";
import type { Goal, Business, GoalStatus } from "@/shared/db/types";

// Minimal goal card with status indicator and business badge
interface GoalCardProps {
  goal: Goal;
  business?: Business;
  onStatusChange: (id: string, status: GoalStatus) => void;
  onDelete: (id: string) => void;
}

// Status shapes: circle for active, filled for achieved, X for dropped
function GoalStatusIcon({ status }: { status: GoalStatus }) {
  if (status === "achieved") {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-active text-bg">
        <Check size={10} strokeWidth={2} />
      </span>
    );
  }
  if (status === "dropped") {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-done text-done">
        <X size={10} strokeWidth={2} />
      </span>
    );
  }
  // Active: empty circle
  return <span className="inline-block h-5 w-5 rounded-full border border-active" />;
}

export function GoalCard({ goal, business, onStatusChange, onDelete }: GoalCardProps) {
  const [hovered, setHovered] = useState(false);

  function cycleStatus() {
    const next: Record<GoalStatus, GoalStatus> = {
      active: "achieved",
      achieved: "dropped",
      dropped: "active",
    };
    onStatusChange(goal.id, next[goal.status]);
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`flex items-start gap-3 rounded border border-border p-3 transition-colors
                  hover:bg-hover ${goal.status === "dropped" ? "opacity-40" : ""}`}
    >
      {/* Status icon (click to cycle) */}
      <button onClick={cycleStatus} className="mt-0.5 shrink-0">
        <GoalStatusIcon status={goal.status} />
      </button>

      {/* Goal content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${goal.status === "achieved" ? "line-through" : ""}`}>
          {goal.title}
        </p>
        {goal.description && (
          <p className="mt-1 text-xs text-text-muted line-clamp-2">{goal.description}</p>
        )}
      </div>

      {/* Business badge */}
      {business && <Badge code={business.short_code} className="mt-0.5" />}

      {/* Delete on hover */}
      {hovered && (
        <button
          onClick={() => onDelete(goal.id)}
          className="mt-0.5 text-text-muted hover:text-text transition-colors"
        >
          <Trash2 size={12} strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}
