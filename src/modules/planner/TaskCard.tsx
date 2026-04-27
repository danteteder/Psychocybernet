"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { StatusDot } from "@/shared/ui/StatusDot";
import { Badge } from "@/shared/ui/Badge";
import type { Task, Business, TaskStatus } from "@/shared/db/types";

// Minimal task card: status dot + title + business badge
// Actions appear on hover (delete, etc.)
interface TaskCardProps {
  task: Task;
  business?: Business;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
}

// Cycle through statuses: todo -> in_progress -> done -> todo
const nextStatus: Record<TaskStatus, TaskStatus> = {
  todo: "in_progress",
  in_progress: "done",
  done: "todo",
  cancelled: "todo",
};

export function TaskCard({ task, business, onStatusChange, onDelete }: TaskCardProps) {
  const [hovered, setHovered] = useState(false);
  const isDone = task.status === "done";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group flex items-center gap-2 rounded px-2 py-1.5 transition-colors
                  hover:bg-hover ${isDone ? "opacity-40" : ""}`}
    >
      {/* Status dot: click to cycle status */}
      <StatusDot
        status={task.status}
        onClick={() => onStatusChange(task.id, nextStatus[task.status])}
        size={12}
      />

      {/* Task title */}
      <span className={`flex-1 text-sm ${isDone ? "line-through text-done" : ""}`}>
        {task.title}
      </span>

      {/* Business badge (if linked) */}
      {business && <Badge code={business.short_code} />}

      {/* Delete button: visible on hover only */}
      {hovered && (
        <button
          onClick={() => onDelete(task.id)}
          className="text-text-muted hover:text-text transition-colors"
        >
          <Trash2 size={12} strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}
