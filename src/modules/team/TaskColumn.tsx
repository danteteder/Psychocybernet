"use client";

import { Trash2 } from "lucide-react";
import { StatusDot } from "@/shared/ui/StatusDot";
import type { Task, TaskStatus } from "@/shared/db/types";

// Kanban column: todo, in_progress, or done
interface TaskColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  onStatusChange: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
}

const COLUMN_LABELS: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

const nextStatus: Record<TaskStatus, TaskStatus> = {
  todo: "in_progress",
  in_progress: "done",
  done: "todo",
  cancelled: "todo",
};

export function TaskColumn({ status, tasks, onStatusChange, onDelete }: TaskColumnProps) {
  return (
    <div className="flex flex-col min-w-0">
      {/* Column header */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <StatusDot status={status} size={10} />
        <span className="text-xs font-medium uppercase tracking-wider">
          {COLUMN_LABELS[status]}
        </span>
        <span className="text-xs text-text-muted">{tasks.length}</span>
      </div>

      {/* Task cards */}
      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="group flex items-center gap-2 rounded border border-border
                       bg-bg px-3 py-2 transition-colors hover:bg-hover"
          >
            <StatusDot
              status={task.status}
              size={10}
              onClick={() => onStatusChange(task.id, nextStatus[task.status])}
            />
            <span className="flex-1 text-sm">{task.title}</span>
            <button
              onClick={() => onDelete(task.id)}
              className="text-text-muted opacity-0 group-hover:opacity-100
                         hover:text-text transition-all"
            >
              <Trash2 size={12} strokeWidth={1.5} />
            </button>
          </div>
        ))}

        {tasks.length === 0 && (
          <p className="py-4 text-center text-xs text-text-muted">Empty</p>
        )}
      </div>
    </div>
  );
}
