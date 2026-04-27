"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayRow } from "./DayRow";
import { useWeekTasks, useBusinesses, useTaskActions, formatDate } from "./hooks";
import type { TaskStatus } from "@/shared/db/types";

// Weekly planner: days as horizontal rows (matches the physical planner layout)
// Monday at top, Sunday at bottom. Each row shows the day name + tasks.
export function WeekGrid() {
  const [weekOffset, setWeekOffset] = useState(0);
  const { tasks, loading, weekDates, refetch } = useWeekTasks(weekOffset);
  const businesses = useBusinesses();
  const { addTask, updateTask, deleteTask } = useTaskActions(refetch);

  const today = new Date();
  const todayStr = formatDate(today);

  function tasksForDate(date: Date) {
    const dateStr = formatDate(date);
    return tasks.filter((t) => t.scheduled_date === dateStr);
  }

  // Week range label (e.g., "Apr 21 — Apr 27, 2026")
  function weekRangeLabel(): string {
    const start = weekDates[0];
    const end = weekDates[6];
    if (!start || !end) return "";
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
      {/* Header with nav arrows */}
      <div className="flex items-center justify-between px-6 py-4">
        <button
          onClick={() => setWeekOffset((o) => o - 1)}
          className="p-1 text-text-muted hover:text-text transition-colors"
        >
          <ChevronLeft size={16} strokeWidth={1.5} />
        </button>

        <div className="text-center">
          <h1 className="text-xs font-medium tracking-[0.25em] uppercase text-text-muted">
            Weekly planner
          </h1>
          <p className="text-[11px] text-text-muted/60 mt-1">{weekRangeLabel()}</p>
        </div>

        <button
          onClick={() => setWeekOffset((o) => o + 1)}
          className="p-1 text-text-muted hover:text-text transition-colors"
        >
          <ChevronRight size={16} strokeWidth={1.5} />
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex-1 flex items-center justify-center text-text-muted text-sm">
          ...
        </div>
      )}

      {/* Day rows: Monday through Sunday, stacked vertically */}
      {!loading && (
        <div className="flex-1 flex flex-col overflow-y-auto">
          {weekDates.map((date) => (
            <DayRow
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
