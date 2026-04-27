"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayColumn } from "./DayColumn";
import { useWeekTasks, useBusinesses, useTaskActions, formatDate } from "./hooks";
import type { TaskStatus } from "@/shared/db/types";

// 7-column week grid: the main planner view
// Matches the weekly planner image layout
export function WeekGrid() {
  const [weekOffset, setWeekOffset] = useState(0);
  const { tasks, loading, weekDates, monday, refetch } = useWeekTasks(weekOffset);
  const businesses = useBusinesses();
  const { addTask, updateTask, deleteTask } = useTaskActions(refetch);

  const today = new Date();
  const todayStr = formatDate(today);

  // Group tasks by scheduled_date
  function tasksForDate(date: Date) {
    const dateStr = formatDate(date);
    return tasks.filter((t) => t.scheduled_date === dateStr);
  }

  // Format the week range for the header (e.g., "Apr 21 - Apr 27, 2026")
  function weekRangeLabel(): string {
    const start = weekDates[0];
    const end = weekDates[6];
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    const startStr = start.toLocaleDateString("en-US", opts);
    const endStr = end.toLocaleDateString("en-US", { ...opts, year: "numeric" });
    return `${startStr} — ${endStr}`;
  }

  function handleAddTask(title: string, date: string) {
    addTask({ title, scheduled_date: date });
  }

  function handleStatusChange(id: string, status: TaskStatus) {
    updateTask(id, { status });
  }

  function handleDeleteTask(id: string) {
    deleteTask(id);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Week header with navigation */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <button
          onClick={() => setWeekOffset((o) => o - 1)}
          className="p-1 text-text-muted hover:text-text transition-colors"
        >
          <ChevronLeft size={18} strokeWidth={1.5} />
        </button>

        <div className="text-center">
          <h1 className="text-sm font-medium tracking-wide uppercase">
            Weekly Planner
          </h1>
          <p className="text-xs text-text-muted mt-0.5">{weekRangeLabel()}</p>
        </div>

        <button
          onClick={() => setWeekOffset((o) => o + 1)}
          className="p-1 text-text-muted hover:text-text transition-colors"
        >
          <ChevronRight size={18} strokeWidth={1.5} />
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex-1 flex items-center justify-center text-text-muted text-sm">
          ...
        </div>
      )}

      {/* 7-column grid */}
      {!loading && (
        <div className="flex flex-1 overflow-hidden">
          {weekDates.map((date) => (
            <DayColumn
              key={date.toISOString()}
              date={date}
              tasks={tasksForDate(date)}
              businesses={businesses}
              isToday={formatDate(date) === todayStr}
              onAddTask={handleAddTask}
              onStatusChange={handleStatusChange}
              onDeleteTask={handleDeleteTask}
            />
          ))}
        </div>
      )}
    </div>
  );
}
