"use client";

import { useFocusSession, useIncompleteTasks, useFocusStats } from "./hooks";
import { FocusTimer } from "./FocusTimer";
import { getRandomTip } from "./tips";
import { StatusDot } from "@/shared/ui/StatusDot";
import { ArrowRight, RotateCcw, X, Minus, Plus } from "lucide-react";
import { useMemo } from "react";

// Full focus ritual page
// Flow: select task -> configure duration -> see tip -> focus (timer) -> reflect -> complete
export function FocusRitual() {
  const {
    step,
    selectedTask,
    duration,
    setDuration,
    timeLeft,
    reflection,
    setReflection,
    selectTask,
    skipTaskSelection,
    startSession,
    completeSession,
    resetSession,
    abortSession,
  } = useFocusSession();

  const tasks = useIncompleteTasks();
  const { totalMinutes, sessionCount } = useFocusStats();

  // Get a random tip when entering the configure step
  const tip = useMemo(() => getRandomTip(), [step]);

  // ── Step 1: Select a task ──
  if (step === "select") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-8 p-8">
        <h1 className="text-sm font-medium uppercase tracking-widest">
          What will you focus on?
        </h1>

        {/* Task list */}
        <div className="w-full max-w-md space-y-1">
          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => selectTask(task)}
              className="flex w-full items-center gap-3 rounded px-3 py-2 text-left
                         transition-colors hover:bg-hover"
            >
              <StatusDot status={task.status} size={10} />
              <span className="text-sm">{task.title}</span>
            </button>
          ))}

          {tasks.length === 0 && (
            <p className="text-center text-sm text-text-muted">
              No open tasks. Add some on the weekly planner.
            </p>
          )}
        </div>

        {/* Skip: focus without a task */}
        <button
          onClick={skipTaskSelection}
          className="text-xs text-text-muted hover:text-text transition-colors"
        >
          Focus without a specific task
        </button>

        {/* Today's stats */}
        {sessionCount > 0 && (
          <p className="text-xs text-text-muted">
            Today: {sessionCount} session{sessionCount > 1 ? "s" : ""} · {totalMinutes} min
          </p>
        )}
      </div>
    );
  }

  // ── Step 2: Configure duration ──
  if (step === "configure") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-8 p-8">
        {/* Selected task */}
        {selectedTask && (
          <p className="text-sm text-text-muted">{selectedTask.title}</p>
        )}

        <h1 className="text-sm font-medium uppercase tracking-widest">
          Set your focus duration
        </h1>

        {/* Duration selector */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setDuration(Math.max(5, duration - 5))}
            className="p-2 text-text-muted hover:text-text transition-colors"
          >
            <Minus size={18} strokeWidth={1.5} />
          </button>
          <span className="text-5xl font-extralight tracking-widest">
            {duration}
          </span>
          <button
            onClick={() => setDuration(Math.min(120, duration + 5))}
            className="p-2 text-text-muted hover:text-text transition-colors"
          >
            <Plus size={18} strokeWidth={1.5} />
          </button>
        </div>
        <p className="text-xs text-text-muted">minutes</p>

        {/* James Clear tip */}
        <blockquote className="max-w-sm text-center text-xs italic text-text-muted leading-relaxed">
          &ldquo;{tip}&rdquo;
        </blockquote>

        {/* Start button */}
        <button
          onClick={startSession}
          className="flex items-center gap-2 border border-active px-6 py-2.5 text-sm
                     font-medium uppercase tracking-widest transition-colors
                     hover:bg-active hover:text-bg"
        >
          Begin
          <ArrowRight size={14} strokeWidth={1.5} />
        </button>
      </div>
    );
  }

  // ── Step 3: Focusing (timer running) ──
  if (step === "focusing") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 p-8">
        {/* Task name */}
        {selectedTask && (
          <p className="text-xs text-text-muted uppercase tracking-wider">
            {selectedTask.title}
          </p>
        )}

        {/* Timer */}
        <FocusTimer timeLeft={timeLeft} totalMinutes={duration} />

        {/* Abort button (small, unobtrusive) */}
        <button
          onClick={abortSession}
          className="mt-4 flex items-center gap-1 text-xs text-text-muted
                     hover:text-text transition-colors"
        >
          <X size={12} strokeWidth={1.5} />
          End early
        </button>
      </div>
    );
  }

  // ── Step 4: Reflect ──
  if (step === "reflect") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 p-8">
        <h1 className="text-sm font-medium uppercase tracking-widest">
          Session complete
        </h1>

        <p className="text-xs text-text-muted">
          {duration} minutes of focused work. Well done.
        </p>

        {/* Reflection input */}
        <div className="w-full max-w-sm">
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="What did you accomplish?"
            className="w-full resize-none border-b border-border bg-transparent px-0 py-2
                       text-sm placeholder:text-text-muted focus:border-active focus:outline-none
                       transition-colors"
            rows={3}
          />
        </div>

        <button
          onClick={completeSession}
          className="flex items-center gap-2 border border-active px-6 py-2.5 text-sm
                     font-medium uppercase tracking-widest transition-colors
                     hover:bg-active hover:text-bg"
        >
          Save & Finish
          <ArrowRight size={14} strokeWidth={1.5} />
        </button>
      </div>
    );
  }

  // ── Step 5: Complete ──
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-8">
      <div className="h-16 w-16 rounded-full bg-active" />

      <h1 className="text-sm font-medium uppercase tracking-widest">
        Logged
      </h1>

      <p className="text-xs text-text-muted">
        {duration} min focus session saved.
      </p>

      <button
        onClick={resetSession}
        className="flex items-center gap-2 text-xs text-text-muted
                   hover:text-text transition-colors"
      >
        <RotateCcw size={12} strokeWidth={1.5} />
        Start another
      </button>
    </div>
  );
}
