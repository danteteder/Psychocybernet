"use client";

import type { Task, Business, TaskStatus } from "@/shared/db/types";
import { Checkbox } from "@/shared/ui/Checkbox";
import { Badge } from "@/shared/ui/Badge";
import { Trash2 } from "lucide-react";
import { useState, type KeyboardEvent } from "react";

// Horizontal day row: day label on left, tasks as lined entries on right
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
  const [newTitle, setNewTitle] = useState("");
  const [editing, setEditing] = useState(false);
  const dayIndex = (date.getDay() + 6) % 7;

  function handleSubmit() {
    if (!newTitle.trim()) return;
    onAddTask(newTitle.trim(), formatDateStr(date));
    setNewTitle("");
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); handleSubmit(); }
    if (e.key === "Escape") { setNewTitle(""); setEditing(false); }
  }

  function getBusiness(task: Task): Business | undefined {
    return businesses.find((b) => b.id === task.business_id);
  }

  return (
    <div className="flex flex-1 min-h-0 border-b border-border/60">
      {/* Day label */}
      <div
        className={`flex w-24 shrink-0 items-start pt-2.5 pl-5
                    ${isToday ? "text-active" : "text-text-muted/70"}`}
      >
        <span className="text-[11px] tracking-wide">{DAY_NAMES[dayIndex]}</span>
      </div>

      {/* Task lines area */}
      <div className="flex-1 border-l border-border/40 min-h-[48px]">
        {/* Existing tasks as lined entries */}
        {tasks.map((task) => {
          const isDone = task.status === "done";
          const biz = getBusiness(task);
          return (
            <div
              key={task.id}
              className={`group flex items-center gap-2 border-b border-border/20
                          px-3 h-7 transition-colors hover:bg-hover
                          ${isDone ? "opacity-30" : ""}`}
            >
              <span className={`flex-1 text-[12px] ${isDone ? "line-through" : ""}`}>
                {task.title}
              </span>
              {biz && <Badge code={biz.short_code} />}
              <button
                onClick={() => onDeleteTask(task.id)}
                className="text-text-muted opacity-0 group-hover:opacity-100
                           hover:text-text transition-all"
              >
                <Trash2 size={10} strokeWidth={1.5} />
              </button>
            </div>
          );
        })}

        {/* Editable line for adding tasks */}
        <div
          className="flex items-center px-3 h-7 border-b border-border/20 cursor-text"
          onClick={() => setEditing(true)}
        >
          {editing ? (
            <input
              autoFocus
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => { if (!newTitle.trim()) setEditing(false); }}
              className="flex-1 bg-transparent text-[12px] placeholder:text-text-muted/30
                         focus:outline-none"
              placeholder="..."
            />
          ) : (
            <span className="text-[12px] text-text-muted/20">...</span>
          )}
        </div>
      </div>
    </div>
  );
}
