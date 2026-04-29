"use client";

// Displays the history of Hermes tasks: pending, running, completed, failed
// Also shows queued tasks that couldn't be sent (offline mode)

import { useEffect, useState } from "react";
import { getTaskHistory, getQueue, type HermesTask } from "@/lib/hermes";
import { Loader2, Check, X, Clock } from "lucide-react";

function statusIcon(status: string) {
  switch (status) {
    case "pending": return <Clock size={12} className="text-text-muted/50" />;
    case "running": return <Loader2 size={12} className="animate-spin text-text-muted" />;
    case "completed": return <Check size={12} className="text-green-500" />;
    case "failed": return <X size={12} className="text-red-400" />;
    default: return null;
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface TaskQueueProps {
  tasks: HermesTask[];
}

export function TaskQueue({ tasks }: TaskQueueProps) {
  const [queue, setQueue] = useState<HermesTask[]>([]);

  useEffect(() => {
    setQueue(getQueue());
  }, []);

  // Merge live tasks with history, most recent first
  const allTasks = [...tasks].reverse();
  const queuedTasks = queue.filter(
    (q) => !allTasks.some((t) => t.id === q.id)
  );

  if (allTasks.length === 0 && queuedTasks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-muted/30 text-xs">
        No commands yet. Type something above.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Queued (offline) */}
      {queuedTasks.length > 0 && (
        <div className="px-4 py-2 border-b border-border/30">
          <p className="text-[10px] text-text-muted/50 uppercase tracking-wider mb-1">
            Queued (offline)
          </p>
          {queuedTasks.map((t) => (
            <TaskRow key={t.id} task={t} />
          ))}
        </div>
      )}

      {/* Task history */}
      {allTasks.map((t) => (
        <TaskRow key={t.id} task={t} />
      ))}
    </div>
  );
}

function TaskRow({ task }: { task: HermesTask }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="border-b border-border/20 px-4 py-2.5 hover:bg-hover
                 transition-colors cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center gap-2">
        {statusIcon(task.status)}
        <span className="flex-1 text-[12px] truncate">{task.command}</span>
        <span className="text-[10px] text-text-muted/40">{timeAgo(task.createdAt)}</span>
      </div>

      {/* Expanded result/error */}
      {expanded && task.result != null && (
        <pre className="mt-2 text-[11px] text-text-muted bg-bg rounded p-2
                        overflow-x-auto whitespace-pre-wrap max-h-40">
          {typeof task.result === "string"
            ? task.result
            : JSON.stringify(task.result, null, 2)}
        </pre>
      )}
      {expanded && task.error && (
        <p className="mt-2 text-[11px] text-red-400">{task.error}</p>
      )}
    </div>
  );
}
