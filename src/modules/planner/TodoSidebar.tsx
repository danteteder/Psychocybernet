"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { StatusDot } from "@/shared/ui/StatusDot";
import { Badge } from "@/shared/ui/Badge";
import { Trash2, Plus } from "lucide-react";
import type { Task, Business, TaskStatus } from "@/shared/db/types";

// Right side of the planner spread: "To do" checklist + "Notes" section
// Matches the right page of the physical planner image
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
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const supabase = createClient();

  // Fetch unscheduled tasks (general to-do list)
  const fetchTodos = useCallback(async () => {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .is("scheduled_date", null)
      .order("position", { ascending: true });

    if (data) setTasks(data as Task[]);
  }, [supabase]);

  // Fetch the user's scratch notes
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

  async function handleAddTodo() {
    if (!newTitle.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("tasks").insert({
      title: newTitle.trim(),
      created_by: user.id,
      status: "todo",
    });
    setNewTitle("");
    setAdding(false);
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

  async function saveNotes() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

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
    <div className="flex w-80 flex-col border-l border-border">
      {/* ── To do ── */}
      <div className="px-6 pt-4 pb-2">
        <h2 className="text-xs font-medium tracking-[0.25em] uppercase text-text-muted">
          To do
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {/* Checklist items */}
        {tasks.map((task) => {
          const isDone = task.status === "done";
          const biz = getBusiness(task);
          return (
            <div
              key={task.id}
              className={`group flex items-center gap-2.5 border-b border-border/50
                          py-2 px-2 transition-colors hover:bg-hover
                          ${isDone ? "opacity-35" : ""}`}
            >
              <StatusDot
                status={task.status}
                size={10}
                onClick={() => handleStatusChange(task.id, nextStatus[task.status])}
              />
              <span className={`flex-1 text-sm ${isDone ? "line-through" : ""}`}>
                {task.title}
              </span>
              {biz && <Badge code={biz.short_code} />}
              <button
                onClick={() => handleDelete(task.id)}
                className="text-text-muted opacity-0 group-hover:opacity-100
                           hover:text-text transition-all"
              >
                <Trash2 size={11} strokeWidth={1.5} />
              </button>
            </div>
          );
        })}

        {/* Add to-do inline */}
        {adding ? (
          <div className="flex items-center gap-2.5 border-b border-border/50 py-2 px-2">
            <Plus size={10} className="text-text-muted shrink-0" />
            <input
              autoFocus
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); handleAddTodo(); }
                if (e.key === "Escape") { setNewTitle(""); setAdding(false); }
              }}
              onBlur={() => { if (!newTitle.trim()) setAdding(false); }}
              placeholder="New to-do..."
              className="flex-1 bg-transparent text-sm placeholder:text-text-muted/50
                         focus:outline-none"
            />
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 py-2 px-2 text-text-muted/40
                       hover:text-text-muted transition-colors"
          >
            <Plus size={10} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* ── Notes ── */}
      <div className="border-t border-border">
        <div className="flex items-center justify-between px-6 pt-3 pb-1">
          <h2 className="text-xs font-medium tracking-[0.25em] uppercase text-text-muted">
            Notes
          </h2>
          {!notesSaved && (
            <span className="text-[10px] text-text-muted/50">unsaved</span>
          )}
        </div>
        <textarea
          value={notes}
          onChange={(e) => { setNotes(e.target.value); setNotesSaved(false); }}
          onBlur={saveNotes}
          placeholder="..."
          className="h-36 w-full resize-none bg-transparent px-6 pb-4 text-sm leading-relaxed
                     placeholder:text-text-muted/30 focus:outline-none"
        />
      </div>
    </div>
  );
}
