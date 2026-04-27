"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Task, Profile, TaskStatus } from "@/shared/db/types";

// Hook: fetch all employees (profiles with role='employee')
export function useEmployees() {
  const [employees, setEmployees] = useState<Profile[]>([]);

  useEffect(() => {
    async function fetch() {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "employee")
        .order("display_name");

      if (data) setEmployees(data as Profile[]);
    }
    fetch();
  }, []);

  return employees;
}

// Hook: fetch tasks assigned to employees, grouped by status
export function useTeamTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);

    // Fetch tasks that have an assigned_to (employee tasks)
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .not("assigned_to", "is", null)
      .order("position", { ascending: true });

    if (data) setTasks(data as Task[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Group tasks by status for Kanban columns
  const columns: Record<string, Task[]> = {
    todo: tasks.filter((t) => t.status === "todo"),
    in_progress: tasks.filter((t) => t.status === "in_progress"),
    done: tasks.filter((t) => t.status === "done"),
  };

  return { tasks, columns, loading, refetch: fetchTasks };
}

// Hook: team task CRUD operations
export function useTeamTaskActions(onSuccess?: () => void) {
  const supabase = createClient();

  const assignTask = useCallback(
    async (task: {
      title: string;
      assigned_to: string;
      business_id?: string;
      scheduled_date?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("tasks").insert({
        ...task,
        created_by: user.id,
        status: "todo",
      });

      onSuccess?.();
    },
    [supabase, onSuccess]
  );

  const updateTaskStatus = useCallback(
    async (id: string, status: TaskStatus) => {
      const updates: Record<string, unknown> = { status };
      if (status === "done") updates.completed_at = new Date().toISOString();

      await supabase.from("tasks").update(updates).eq("id", id);
      onSuccess?.();
    },
    [supabase, onSuccess]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      await supabase.from("tasks").delete().eq("id", id);
      onSuccess?.();
    },
    [supabase, onSuccess]
  );

  return { assignTask, updateTaskStatus, deleteTask };
}
