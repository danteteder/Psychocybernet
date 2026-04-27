"use client";

import { useState, useRef, type KeyboardEvent } from "react";
import { Plus } from "lucide-react";

// Quick-add task input
// Click + or press Enter to add. Minimal: just a text input.
interface TaskQuickAddProps {
  onAdd: (title: string) => void;
  placeholder?: string;
}

export function TaskQuickAdd({ onAdd, placeholder = "Add task..." }: TaskQuickAddProps) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue("");
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      setValue("");
      inputRef.current?.blur();
    }
  }

  return (
    <div
      className={`flex items-center gap-1 rounded px-2 py-1 transition-colors
                  ${focused ? "bg-hover" : ""}`}
    >
      <button
        onClick={() => inputRef.current?.focus()}
        className="text-text-muted hover:text-text transition-colors"
      >
        <Plus size={14} strokeWidth={1.5} />
      </button>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm placeholder:text-text-muted
                   focus:outline-none"
      />
    </div>
  );
}
