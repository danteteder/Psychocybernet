"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TaskQuickAdd } from "./TaskQuickAdd";
import { StatusDot } from "@/shared/ui/StatusDot";
import { Badge } from "@/shared/ui/Badge";
import { Trash2 } from "lucide-react";
import type { Task, Business, TaskStatus } from "@/shared/db/types";

// Right sidebar: general to-do list (unscheduled tasks) + notes section
// Matches the right page of the planner image: "To do" + "Notes"
interface TodoSidebarProps {
  businesses: Business[];
}

const nextStatus: Record<TaskStatus, TaskStatus> = {
  todo: "in_progress",
  in_progress: "done",
  done: "todo",
  cancelled: "todo",
};

export function TodoSidebar({ businesses }: TodoSidebarProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(true);
  const supabase = createClient();

  // Fetch unscheduled tasks (no scheduled_date = general to-do list)
  const fetchTodos = useCallback(async () => {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .is("scheduled_date", null)
      .order("position", { ascending: true });

    if (data) setTasks(data as Task[]);
  }, [supabase]);

  // Fetch user's notes (latest note)
  const fetchNotes = useCallback(async () => {
    const { data } = await supabase
      .from("notes")
      .select("*")
      .eq("source", "manual")
      .is("task_id", null)
      .order("created_at", { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      setNotes(data[0].content);
    }
  }, [supabase]);

  useEffect(() => {
    fetchTodos();
    fetchNotes();
  }, [fetchTodos, fetchNotes]);

  async function handleAddTodo(title: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("tasks").insert({
      title,
      created_by: user.id,
      status: "todo",
    });
    fetchTodos();
  }

  async function handleStatusChange(id: string, status: TaskStatus) {
    const updates: Partial<Task> = { status };
    if (status === "done") updates.completed_at = new Date().toISOString();

    await supabase.from("tasks").update(updates).eq("id", id);
    fetchTodos();
  }

  async function handleDelete(id: string) {
    await supabase.from("tasks").delete().eq("id", id);
    fetchTodos();
  }

  // Auto-save notes with debounce
  async function handleNotesChange(value: string) {
    setNotes(value);
    setNotesSaved(false);
  }

  // Save notes on blur
  async function saveNotes() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Upsert: delete old general note, insert new one
    await supabase
      .from("notes")
      .delete()
      .eq("user_id", user.id)
      .eq("source", "manual")
      .is("task_id", null);

    if (notes.trim()) {
      await supabase.from("notes").insert({
        user_id: user.id,
        content: notes.trim(),
        source: "manual",
      });
    }
    setNotesSaved(true);
  }

  function getBusiness(task: Task): Business | undefined {
    return businesses.find((b) => b.id === task.business_id);
  }

  return (
    <div className="flex w-72 flex-col border-l border-border">
      {/* To-do header */}
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-medium tracking-wide uppercase">To do</h2>
      </div>

      {/* To-do list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {tasks.map((task) => {
          const isDone = task.status === "done";
          return (
            <div
              key={task.id}
              className={`group flex items-center gap-2 rounded px-2 py-1.5
                          hover:bg-hover transition-colors ${isDone ? "opacity-40" : ""}`}
            >
              <StatusDot
                status={task.status}
                size={12}
                onClick={() => handleStatusChange(task.id, nextStatus[task.status])}
              />
              <span className={`flex-1 text-sm ${isDone ? "line-through text-done" : ""}`}>
                {task.title}
              </span>
              {getBusiness(task) && <Badge code={getBusiness(task)!.short_code} />}
              <button
                onClick={() => handleDelete(task.id)}
                className="text-text-muted hover:text-text opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={12} strokeWidth={1.5} />
              </button>
            </div>
          );
        })}

        {/* Quick-add for to-do list */}
        <TaskQuickAdd onAdd={handleAddTodo} placeholder="Add to-do..." />
      </div>

      {/* Notes section */}
      <div className="border-t border-border">
        <div className="flex items-center justify-between px-4 py-2">
          <h2 className="text-sm font-medium tracking-wide uppercase">Notes</h2>
          {!notesSaved && (
            <span className="text-[10px] text-text-muted">unsaved</span>
          )}
        </div>
        <textarea
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          onBlur={saveNotes}
          placeholder="Write notes here..."
          className="h-32 w-full resize-none bg-transparent px-4 pb-3 text-sm
                     placeholder:text-text-muted focus:outline-none"
        />
      </div>
    </div>
  );
}
