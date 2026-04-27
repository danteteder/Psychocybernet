"use client";

import { useState } from "react";
import { Plus, UserPlus } from "lucide-react";
import { TaskColumn } from "./TaskColumn";
import { useTeamTasks, useTeamTaskActions, useEmployees } from "./hooks";
import type { TaskStatus } from "@/shared/db/types";

// 3-column Kanban board for employee task management
// Owner sees all employee tasks; employees see only their own (via RLS)
export function KanbanBoard() {
  const { columns, loading, refetch } = useTeamTasks();
  const { assignTask, updateTaskStatus, deleteTask } = useTeamTaskActions(refetch);
  const employees = useEmployees();

  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");

  function handleAdd() {
    if (!newTitle.trim() || !selectedEmployee) return;
    assignTask({ title: newTitle.trim(), assigned_to: selectedEmployee });
    setNewTitle("");
    setSelectedEmployee("");
    setAdding(false);
  }

  function handleStatusChange(id: string, status: TaskStatus) {
    updateTaskStatus(id, status);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h1 className="text-sm font-medium tracking-wide uppercase">Team</h1>

        <div className="flex items-center gap-2">
          {/* Employee count */}
          <span className="text-xs text-text-muted">
            {employees.length} member{employees.length !== 1 ? "s" : ""}
          </span>

          {/* Add task button */}
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs
                       text-text-muted hover:bg-hover hover:text-text transition-colors"
          >
            <Plus size={14} strokeWidth={1.5} />
            Assign task
          </button>
        </div>
      </div>

      {/* Add task form */}
      {adding && (
        <div className="flex items-center gap-2 border-b border-border px-4 py-2">
          <input
            autoFocus
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") setAdding(false);
            }}
            placeholder="Task title..."
            className="flex-1 border-b border-border bg-transparent px-0 py-1 text-sm
                       placeholder:text-text-muted focus:border-active focus:outline-none"
          />

          {/* Employee selector */}
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="border-b border-border bg-transparent px-0 py-1 text-sm
                       text-text-muted focus:border-active focus:outline-none"
          >
            <option value="">Assign to...</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.display_name || emp.id.slice(0, 8)}
              </option>
            ))}
          </select>

          <button
            onClick={handleAdd}
            className="text-xs text-text-muted hover:text-text transition-colors"
          >
            Add
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex-1 flex items-center justify-center text-text-muted text-sm">
          ...
        </div>
      )}

      {/* 3-column Kanban */}
      {!loading && (
        <div className="grid flex-1 grid-cols-3 divide-x divide-border overflow-hidden">
          <TaskColumn
            title="To Do"
            status="todo"
            tasks={columns.todo}
            onStatusChange={handleStatusChange}
            onDelete={(id) => deleteTask(id)}
          />
          <TaskColumn
            title="In Progress"
            status="in_progress"
            tasks={columns.in_progress}
            onStatusChange={handleStatusChange}
            onDelete={(id) => deleteTask(id)}
          />
          <TaskColumn
            title="Done"
            status="done"
            tasks={columns.done}
            onStatusChange={handleStatusChange}
            onDelete={(id) => deleteTask(id)}
          />
        </div>
      )}

      {/* Empty state for when no employees exist yet */}
      {!loading && employees.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-text-muted">
          <UserPlus size={24} strokeWidth={1} />
          <p className="text-sm">No team members yet</p>
          <p className="text-xs">Create employee accounts in Supabase to get started</p>
        </div>
      )}
    </div>
  );
}
