"use client";

import type { Task, Business, TaskStatus } from "@/shared/db/types";
import { TaskCard } from "./TaskCard";
import { TaskQuickAdd } from "./TaskQuickAdd";

// Single day column in the weekly planner
// Shows day name, date, and a list of tasks
interface DayColumnProps {
  date: Date;
  tasks: Task[];
  businesses: Business[];
  isToday: boolean;
  onAddTask: (title: string, date: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onDeleteTask: (id: string) => void;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Format date as "27" (just the day number)
function dayNumber(date: Date): string {
  return date.getDate().toString();
}

// Format as YYYY-MM-DD for the database
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function DayColumn({
  date,
  tasks,
  businesses,
  isToday,
  onAddTask,
  onStatusChange,
  onDeleteTask,
}: DayColumnProps) {
  const dayIndex = (date.getDay() + 6) % 7; // Monday = 0

  // Find the business object for a given task
  function getBusiness(task: Task): Business | undefined {
    return businesses.find((b) => b.id === task.business_id);
  }

  return (
    <div className="flex flex-col border-r border-border last:border-r-0 min-w-0">
      {/* Day header */}
      <div
        className={`flex items-baseline gap-1.5 border-b border-border px-3 py-2
                    ${isToday ? "bg-active text-bg" : ""}`}
      >
        <span className="text-xs font-medium uppercase tracking-wider">
          {DAY_NAMES[dayIndex]}
        </span>
        <span className={`text-lg font-light ${isToday ? "" : "text-text-muted"}`}>
          {dayNumber(date)}
        </span>
      </div>

      {/* Tasks list */}
      <div className="flex-1 space-y-0.5 p-1 overflow-y-auto">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            business={getBusiness(task)}
            onStatusChange={onStatusChange}
            onDelete={onDeleteTask}
          />
        ))}
      </div>

      {/* Quick-add at the bottom of each day */}
      <div className="border-t border-border p-1">
        <TaskQuickAdd
          onAdd={(title) => onAddTask(title, formatDate(date))}
          placeholder="+"
        />
      </div>
    </div>
  );
}
