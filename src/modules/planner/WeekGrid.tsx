"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Brain, Target, Zap } from "lucide-react";
import { DayRow } from "./DayRow";
import { useWeekTasks, useBusinesses, useTaskActions, formatDate } from "./hooks";
import { sendCommand } from "@/lib/hermes";
import type { TaskStatus } from "@/shared/db/types";

// Weekly planner left page: "Weekly planner" header + AI focus section + 7 day rows
export function WeekGrid() {
  const [weekOffset, setWeekOffset] = useState(0);
  const { tasks, loading, weekDates, refetch } = useWeekTasks(weekOffset);
  const businesses = useBusinesses();
  const { addTask, updateTask, deleteTask } = useTaskActions(

  const today = new Date();
  const todayStr = formatDate(today);

  function tasksForDate(date: Date) {
    const dateStr = formatDate(date);
    return tasks.filter((t) => t.scheduled_date === dateStr);
  }

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
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <button
          onClick={() => setWeekOffset((o) => o - 1)}
          className="p-1 text-text-muted/50 hover:text-text transition-colors"
        >
          <ChevronLeft size={14} strokeWidth={1.5} />
        </button>

        <div className="text-center">
          <h1 className="text-[11px] font-medium tracking-[0.3em] uppercase text-text-muted/70">
            Weekly planner
          </h1>
          <p className="text-[10px] text-text-muted/40 mt-0.5">{weekRangeLabel()}</p>
        </div>

        <button
          onClick={() => setWeekOffset((o) => o + 1)}
          className="p-1 text-text-muted/50 hover:text-text transition-colors"
        >
          <ChevronRight size={14} strokeWidth={1.5} />
        </button>
      </div>

      {/* AI Daily Focus Section */}
      <div className="px-5 py-3 border-b border-border/30">
        <div className="flex items-start gap-3 bg-gradient-to-r from-blue-400/5 to-purple-400/5 rounded-lg p-4 border border-border/40">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-lg bg-blue-400/10 flex items-center justify-center">
              <Brain size={18} className="text-blue-500" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-xs font-medium mb-2 text-text">
              What's your asymmetric leverage today?
            </h3>
            <p className="text-[10px] text-text-muted/60 mb-3">
              Focus on high-impact activities that compound: sales calls, automation setup, hiring decisions.
              Let AI break down your priorities into actionable tasks.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  sendCommand("Analyze my current business priorities (5 sales interviews, LinkedIn automation, Upwork scraping, email campaign) and break down today's tasks by asymmetric leverage - what gives 10x returns vs linear time investment");
                }}
                className="flex items-center gap-1.5 text-[10px] bg-blue-400/10 text-blue-500 px-3 py-1.5 rounded hover:bg-blue-400/20 transition-colors"
              >
                <Zap size={10} />
                Break down today with AI
              </button>
              <button
                onClick={() => {
                  sendCommand("Create focused tasks for today: 1) Schedule 5 technical sales interviews, 2) Setup LinkedIn automation (20 msgs/day), 3) Prepare Upwork scraping, 4) Follow up with 2 monthly clients");
                }}
                className="flex items-center gap-1.5 text-[10px] bg-text text-bg px-3 py-1.5 rounded hover:opacity-90 transition-opacity"
              >
                <Target size={10} />
                Quick: Today's priorities
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-text-muted/40 text-xs">
          ...
        </div>
      ) : (
        /* 7 day rows filling the remaining height equally */
        <div className="flex-1 flex flex-col border-t border-border/60">
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
