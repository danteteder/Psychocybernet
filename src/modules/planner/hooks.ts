"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Task, Business } from "@/shared/db/types";

// Returns the Monday of the week containing the given date
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // Adjust: Sunday (0) becomes 6, others shift by -1
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Format a date as YYYY-MM-DD for Supabase queries
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Get an array of 7 dates starting from Monday
function getWeekDates(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
}

// Hook: fetches tasks for a given week
export function useWeekTasks(weekOffset: number = 0) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const monday = getMonday(today);
  monday.setDate(monday.getDate() + weekOffset * 7);
  const weekDates = getWeekDates(monday);

  const startDate = formatDate(weekDates[0]);
  const endDate = formatDate(weekDates[6]);

  const fetchTasks = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .gte("scheduled_date", startDate)
      .lte("scheduled_date", endDate)
      .order("position", { ascending: true });

    if (!error && data) {
      setTasks(data as Task[]);
    }
    setLoading(false);
  }, [startDate, endDate]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return { tasks, loading, weekDates, monday, refetch: fetchTasks };
}

// Hook: fetches all businesses for the current user
export function useBusinesses() {
  const [businesses, setBusinesses] = useState<Business[]>([]);

  useEffect(() => {
    async function fetch() {
      const supabase = createClient();
      const { data } = await supabase
        .from("businesses")
        .select("*")
        .order("name");

      if (data) setBusinesses(data as Business[]);
    }
    fetch();
  }, []);

  return businesses;
}

// Hook: CRUD operations for tasks
export function useTaskActions(onSuccess?: () => void) {
  const supabase = createClient();

  const addTask = useCallback(
    async (task: {
      title: string;
      scheduled_date?: string;
      business_id?: string;
      priority?: number;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("tasks").insert({
        ...task,
        created_by: user.id,
        status: "todo",
      });

      if (!error) onSuccess?.();
    },
    [supabase, onSuccess]
  );

  const updateTask = useCallback(
    async (id: string, updates: Partial<Task>) => {
      // Auto-set completed_at when marking done
      if (updates.status === "done") {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id);

      if (!error) onSuccess?.();
    },
    [supabase, onSuccess]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (!error) onSuccess?.();
    },
    [supabase, onSuccess]
  );

  return { addTask, updateTask, deleteTask };
}

export { getMonday, formatDate, getWeekDates };
