"use client";

// AI Command Center: main interface for interacting with Hermes
// Shows status, command input, quick actions, and task history

import { useCallback, useEffect, useState } from "react";
import { StatusIndicator } from "./StatusIndicator";
import { CommandInput } from "./CommandInput";
import { TaskQueue } from "./TaskQueue";
import { QuickActions } from "./QuickActions";
import { getTaskHistory, type HermesTask } from "@/lib/hermes";
import { ExternalLink } from "lucide-react";
import { getSettings } from "@/lib/hermes";

export function AgentPage() {
  const [tasks, setTasks] = useState<HermesTask[]>([]);

  // Load history on mount
  useEffect(() => {
    setTasks(getTaskHistory());
  }, []);

  const handleTaskCreated = useCallback((task: HermesTask) => {
    setTasks((prev) => [...prev, task]);
  }, []);

  function openHermesUI() {
    const { baseUrl } = getSettings();
    window.open(baseUrl, "_blank");
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/60">
        <div className="flex items-center gap-3">
          <h1 className="text-[11px] font-medium tracking-[0.3em] uppercase text-text-muted/70">
            Hermes
          </h1>
          <StatusIndicator showLabel />
        </div>

        <button
          onClick={openHermesUI}
          className="flex items-center gap-1.5 text-[10px] text-text-muted/50
                     hover:text-text transition-colors"
          title="Open Hermes Gateway UI"
        >
          <ExternalLink size={11} />
          Open UI
        </button>
      </div>

      {/* Quick actions */}
      <div className="px-5 py-3 border-b border-border/30">
        <QuickActions onTaskCreated={handleTaskCreated} />
      </div>

      {/* Task history */}
      <TaskQueue tasks={tasks} />

      {/* Command input pinned to bottom */}
      <div className="border-t border-border/60 px-5 py-3">
        <CommandInput onTaskCreated={handleTaskCreated} />
      </div>
    </div>
  );
}
