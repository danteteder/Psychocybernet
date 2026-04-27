"use client";

import type { Task, Business, TaskStatus } from "@/shared/db/types";
import { StatusDot } from "@/shared/ui/StatusDot";
import { Badge } from "@/shared/ui/Badge";
import { Trash2, Plus } from "lucide-react";
import { useState, useRef, type KeyboardEvent } from "react";

// Single day row in the weekly planner (horizontal layout)
// Day name on the left, tasks listed inline on the right
interface DayRowProps {
  date: Date;
  tasks: Task[];
  businesses: Business[];
  isToday: boolean;
  onAddTask: (title: string, date: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onDeleteTask: (id: string) => void;
}

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const nextStatus: Record<TaskStatus, TaskStatus> = {
  todo: "in_progress",
  in_progress: "done",
  done: "todo",
  cancelled: "todo",
};

function formatDateStr(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function DayRow({
  date,
  tasks,
  businesses,
  isToday,
  onAddTask,
  onStatusChange,
  onDeleteTask,
}: DayRowProps) {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dayIndex = (date.getDay() + 6) % 7; // Monday = 0

  function handleSubmit() {
    if (!newTitle.trim()) return;
    onAddTask(newTitle.trim(), formatDateStr(date));
    setNewTitle("");
    setAdding(false);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); handleSubmit(); }
    if (e.key === "Escape") { setNewTitle(""); setAdding(false); }
  }

  function getBusiness(task: Task): Business | undefined {
    return businesses.find((b) => b.id === task.business_id);
  }

  return (
    <div
      className={`flex min-h-[52px] border-b border-border transition-colors
                  ${isToday ? "bg-bg-subtle" : ""}`}
    >
      {/* Day label (left column, fixed width) */}
      <div className="flex w-28 shrink-0 items-start px-6 py-3">
        <span
          className={`text-xs tracking-wider
                      ${isToday ? "font-medium text-active" : "text-text-muted"}`}
        >
          {DAY_NAMES[dayIndex]}
        </span>
      </div>

      {/* Tasks area (right side, flexible) */}
      <div className="flex-1 py-2 pr-4">
        {/* Existing tasks */}
        {tasks.map((task) => {
          const isDone = task.status === "done";
          const biz = getBusiness(task);
          return (
            <div
              key={task.id}
              className={`group flex items-center gap-2.5 rounded px-2 py-1
                          hover:bg-hover transition-colors
                          ${isDone ? "opacity-35" : ""}`}
            >
              <StatusDot
                status={task.status}
                size={10}
                onClick={() => onStatusChange(task.id, nextStatus[task.status])}
              />
              <span className={`flex-1 text-sm ${isDone ? "line-through" : ""}`}>
                {task.title}
              </span>
              {biz && <Badge code={biz.short_code} />}
              <button
                onClick={() => onDeleteTask(task.id)}
                className="text-text-muted opacity-0 group-hover:opacity-100
                           hover:text-text transition-all"
              >
                <Trash2 size={11} strokeWidth={1.5} />
              </button>
            </div>
          );
        })}

        {/* Inline add */}
        {adding ? (
          <div className="flex items-center gap-2 px-2 py-1">
            <Plus size={10} className="text-text-muted shrink-0" />
            <input
              ref={inputRef}
              autoFocus
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => { if (!newTitle.trim()) setAdding(false); }}
              placeholder="New task..."
              className="flex-1 bg-transparent text-sm placeholder:text-text-muted/50
                         focus:outline-none"
            />
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 px-2 py-1 text-text-muted/40
                       hover:text-text-muted transition-colors"
          >
            <Plus size={10} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  );
}
