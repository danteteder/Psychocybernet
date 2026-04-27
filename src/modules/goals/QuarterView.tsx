"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { GoalCard } from "./GoalCard";
import { useGoals, useGoalActions, useBusinesses } from "./hooks";
import type { GoalStatus, Business } from "@/shared/db/types";

// Quarter section: shows goals for Q1-Q4 of a given year
interface QuarterViewProps {
  quarter: number;
  year: number;
}

export function QuarterView({ quarter, year }: QuarterViewProps) {
  const { goals, refetch } = useGoals(year, quarter);
  const { addGoal, updateGoal, deleteGoal } = useGoalActions(refetch);
  const businesses = useBusinesses();
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  function getBusiness(businessId: string | null): Business | undefined {
    return businesses.find((b) => b.id === businessId) ?? undefined;
  }

  function handleStatusChange(id: string, status: GoalStatus) {
    updateGoal(id, { status });
  }

  function handleAdd() {
    if (!newTitle.trim()) return;
    addGoal({ title: newTitle.trim(), quarter, year });
    setNewTitle("");
    setAdding(false);
  }

  return (
    <div className="space-y-2">
      {/* Quarter header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium uppercase tracking-widest text-text-muted">
          Q{quarter}
        </h3>
        <button
          onClick={() => setAdding(true)}
          className="p-1 text-text-muted hover:text-text transition-colors"
        >
          <Plus size={14} strokeWidth={1.5} />
        </button>
      </div>

      {/* Goals */}
      <div className="space-y-1.5">
        {goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            business={getBusiness(goal.business_id)}
            onStatusChange={handleStatusChange}
            onDelete={(id) => deleteGoal(id)}
          />
        ))}

        {goals.length === 0 && !adding && (
          <p className="py-4 text-center text-xs text-text-muted">No goals set</p>
        )}
      </div>

      {/* Quick-add inline */}
      {adding && (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") setAdding(false);
            }}
            placeholder="Goal title..."
            className="flex-1 border-b border-border bg-transparent px-0 py-2 text-sm
                       placeholder:text-text-muted focus:border-active focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}
