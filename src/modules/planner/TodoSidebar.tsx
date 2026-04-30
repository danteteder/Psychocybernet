"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Checkbox } from "@/shared/ui/Checkbox";
import { Badge } from "@/shared/ui/Badge";
import { Trash2, Zap } from "lucide-react";
import type { Task, Business, TaskStatus } from "@/shared/db/types";
import { sendCommand } from "@/lib/hermes";

// Right page of the planner: "To do" checklist (top half) + "Notes" (bottom half)
// With ruled lines matching the physical planner
interface TodoSidebarProps {
  businesses: Business[];
}

// Line height for ruled lines (matches physical planner spacing)
const LINE_H = "h-7";
const LINE_BORDER = "border-b border-border/30";

export function TodoSidebar({ businesses }: TodoSidebarProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [subtasks, setSubtasks] = useState<{id: string, title: string, done: boolean}[]>([]);
  const supabase = createClient();

  const fetchTodos = useCallback(async () => {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .is("scheduled_date", null)
      .order("position", { ascending: true });
    if (data) setTasks(data as Task[]);
  }, [supabase]);

  const fetchNotes = useCallback(async () => {
    const { data } = await supabase
      .from("notes")
      .select("*")
      .eq("source", "manual")
      .is("task_id", null)
      .order("created_at", { ascending: false })
      .limit(1);
    if (data && data.length > 0) setNotes(data[0].content);
  }, [supabase]);

  async function handleBreakdownTask(task: Task) {
    if (expandedTask === task.id) {
      setExpandedTask(null);
      setSubtasks([]);
      return;
    }
    
    setExpandedTask(task.id);
    await sendCommand(`Break down "${task.title}" into 3-5 simple, actionable subtasks. Return as a numbered list.`);
    // For now, showing placeholder - will integrate with actual AI response
    setSubtasks([
      { id: "sub-1", title: "Research and gather requirements", done: false },
      { id: "sub-2", title: "Execute first step (15 min)", done: false },
      { id: "sub-3", title: "Review and adjust", done: false },
    ]);
  }

  useEffect(() => { fetchTodos(); fetchNotes(); }, [fetchTodos, fetchNotes]);

  async function handleAddTodo() {
    if (!newTitle.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("tasks").insert({ title: newTitle.trim(), created_by: user.id, status: "todo" });
    setNewTitle("");
    setAdding(false);
    fetchTodos();
  }

  async function handleToggle(task: Task) {
    const newStatus: TaskStatus = task.status === "done" ? "todo" : "done";
    const updates: Record<string, unknown> = { status: newStatus };
    if (newStatus === "done") updates.completed_at = new Date().toISOString();
    await supabase.from("tasks").update(updates).eq("id", task.id);
    fetchTodos();
  }

  async function handleDelete(id: string) {
    await supabase.from("tasks").delete().eq("id", id);
    fetchTodos();
  }

  async function saveNotes() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notes").delete().eq("user_id", user.id).eq("source", "manual").is("task_id", null);
    if (notes.trim()) {
      await supabase.from("notes").insert({ user_id: user.id, content: notes.trim(), source: "manual" });
    }
    setNotesSaved(true);
  }

  function getBusiness(task: Task): Business | undefined {
    return businesses.find((b) => b.id === task.business_id);
  }

  // Fixed number of visible lines for the checklist area (like the planner image shows ~10 lines)
  const todoLines = 10;
  const emptySlots = Math.max(0, todoLines - tasks.length - 1);

  return (
    <div className="flex w-full flex-col lg:w-[45%] lg:border-l border-border/60">
      {/* ── TO DO section (top half) ── */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-5 pt-4 pb-2">
          <h2 className="text-[11px] font-medium tracking-[0.3em] uppercase text-text-muted/70">
            To do
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto border-t border-border/60">
          {/* Filled checklist rows */}
          {tasks.map((task) => {
            const isDone = task.status === "done";
            const biz = getBusiness(task);
            const isExpanded = expandedTask === task.id;
            return (
              <div key={task.id}>
                <div
                  className={`group flex items-center gap-3 px-5 ${LINE_H} ${LINE_BORDER}
                              transition-colors hover:bg-hover ${isDone ? "opacity-30" : ""}`}
                >
                  <Checkbox checked={isDone} onChange={() => handleToggle(task)} size={12} />
                  <span className={`flex-1 text-[12px] ${isDone ? "line-through" : ""}`}
                        onClick={() => handleBreakdownTask(task)}
                        style={{ cursor: !isDone ? "pointer" : "default" }}
                  >
                    {task.title}
                  </span>
                  {biz && <Badge code={biz.short_code} />}
                  {!isDone && (
                    <button
                      onClick={() => handleBreakdownTask(task)}
                      title="Break down with AI"
                      className="opacity-0 group-hover:opacity-100 hover:text-text transition-all text-text-muted"
                    >
                      <Zap size={10} strokeWidth={1.5} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="text-text-muted opacity-0 group-hover:opacity-100
                               hover:text-text transition-all"
                  >
                    <Trash2 size={10} strokeWidth={1.5} />
                  </button>
                </div>
                
                {/* Subtasks */}
                {isExpanded && subtasks.length > 0 && (
                  <div className="bg-bg-subtle/30 border-b border-border/20">
                    {subtasks.map((sub, idx) => (
                      <div key={sub.id} className="flex items-center gap-3 px-5 h-7 border-b border-border/20 pl-12">
                        <div className="w-4 h-4 rounded border border-border/40 flex items-center justify-center text-[8px]">
                          {sub.done ? "✓" : "•"}
                        </div>
                        <span className="text-[11px] text-text-muted/70">{sub.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Add new row */}
          <div
            className={`flex items-center gap-3 px-5 ${LINE_H} ${LINE_BORDER} cursor-text`}
            onClick={() => setAdding(true)}
          >
            {adding ? (
              <>
                <Checkbox checked={false} onChange={() => {}} size={12} />
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
                  className="flex-1 bg-transparent text-[12px] placeholder:text-text-muted/30
                             focus:outline-none"
                  placeholder="Add to-do..."
                />
              </>
            ) : (
              <>
                <Checkbox checked={false} onChange={() => setAdding(true)} size={12} />
                <span className="text-[12px] text-text-muted/20">...</span>
              </>
            )}
          </div>

          {/* Empty ruled lines to fill the space */}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <div key={`empty-${i}`} className={`${LINE_H} ${LINE_BORDER}`} />
          ))}
        </div>
      </div>

      {/* ── NOTES section (bottom half) ── */}
      <div className="flex-1 flex flex-col min-h-0 border-t border-border/60">
        <div className="px-5 pt-3 pb-1 flex items-center justify-between">
          <h2 className="text-[11px] font-medium tracking-[0.3em] uppercase text-text-muted/70">
            Notes
          </h2>
          {!notesSaved && (
            <span className="text-[9px] text-text-muted/40">unsaved</span>
          )}
        </div>

        {/* Lined textarea: uses background lines to simulate ruled paper */}
        <div className="flex-1 relative overflow-hidden">
          {/* Ruled line backgrounds */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className={`${LINE_H} ${LINE_BORDER}`} />
            ))}
          </div>

          {/* Actual textarea on top of ruled lines */}
          <textarea
            value={notes}
            onChange={(e) => { setNotes(e.target.value); setNotesSaved(false); }}
            onBlur={saveNotes}
            placeholder="..."
            className="relative z-10 h-full w-full resize-none bg-transparent
                       px-5 text-[12px] leading-[28px] placeholder:text-text-muted/20
                       focus:outline-none"
            style={{ lineHeight: "28px" }}
          />
        </div>
      </div>
    </div>
  );
}
