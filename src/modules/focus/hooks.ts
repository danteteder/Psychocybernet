"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { FocusSession, Task } from "@/shared/db/types";

// Focus session states
export type FocusStep = "select" | "configure" | "focusing" | "reflect" | "complete";

// Hook: manage focus session lifecycle
export function useFocusSession() {
  const [step, setStep] = useState<FocusStep>("select");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [duration, setDuration] = useState(25); // default 25 min
  const [timeLeft, setTimeLeft] = useState(0); // seconds remaining
  const [isRunning, setIsRunning] = useState(false);
  const [reflection, setReflection] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);

  const supabase = createClient();

  // Timer countdown
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setIsRunning(false);
          setStep("reflect");
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  // Step 1: Select a task
  const selectTask = useCallback((task: Task) => {
    setSelectedTask(task);
    setStep("configure");
  }, []);

  // Step 1b: Skip task selection (focus without a specific task)
  const skipTaskSelection = useCallback(() => {
    setSelectedTask(null);
    setStep("configure");
  }, []);

  // Step 2: Start the timer and log session start
  const startSession = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Create the session in the database
    const { data } = await supabase
      .from("focus_sessions")
      .insert({
        user_id: user.id,
        task_id: selectedTask?.id ?? null,
        duration_minutes: duration,
        started_at: new Date().toISOString(),
        completed: false,
      })
      .select("id")
      .single();

    if (data) setSessionId(data.id);

    setTimeLeft(duration * 60);
    setIsRunning(true);
    setStep("focusing");
  }, [supabase, selectedTask, duration]);

  // Step 3: Complete the session with reflection
  const completeSession = useCallback(async () => {
    if (!sessionId) return;

    await supabase
      .from("focus_sessions")
      .update({
        ended_at: new Date().toISOString(),
        completed: true,
        reflection: reflection || null,
      })
      .eq("id", sessionId);

    // If a task was selected, mark it as done
    if (selectedTask) {
      await supabase
        .from("tasks")
        .update({ status: "done", completed_at: new Date().toISOString() })
        .eq("id", selectedTask.id);
    }

    setStep("complete");
  }, [supabase, sessionId, reflection, selectedTask]);

  // Reset everything for a new session
  const resetSession = useCallback(() => {
    setStep("select");
    setSelectedTask(null);
    setDuration(25);
    setTimeLeft(0);
    setIsRunning(false);
    setReflection("");
    setSessionId(null);
  }, []);

  // Abort the current session
  const abortSession = useCallback(async () => {
    if (sessionId) {
      await supabase
        .from("focus_sessions")
        .update({ ended_at: new Date().toISOString(), completed: false })
        .eq("id", sessionId);
    }
    resetSession();
  }, [supabase, sessionId, resetSession]);

  return {
    step,
    selectedTask,
    duration,
    setDuration,
    timeLeft,
    isRunning,
    reflection,
    setReflection,
    selectTask,
    skipTaskSelection,
    startSession,
    completeSession,
    resetSession,
    abortSession,
  };
}

// Hook: fetch available (incomplete) tasks for task selection
export function useIncompleteTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    async function fetch() {
      const supabase = createClient();
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .in("status", ["todo", "in_progress"])
        .order("priority", { ascending: true })
        .limit(20);

      if (data) setTasks(data as Task[]);
    }
    fetch();
  }, []);

  return tasks;
}

// Hook: fetch today's focus session stats
export function useFocusStats() {
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);

  useEffect(() => {
    async function fetch() {
      const supabase = createClient();
      const today = new Date().toISOString().split("T")[0];

      const { data } = await supabase
        .from("focus_sessions")
        .select("duration_minutes")
        .eq("completed", true)
        .gte("started_at", `${today}T00:00:00`);

      if (data) {
        setSessionCount(data.length);
        setTotalMinutes(
          data.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
        );
      }
    }
    fetch();
  }, []);

  return { totalMinutes, sessionCount };
}
