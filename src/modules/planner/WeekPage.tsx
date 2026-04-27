"use client";

import { WeekGrid } from "./WeekGrid";
import { TodoSidebar } from "./TodoSidebar";
import { useBusinesses } from "./hooks";

// Full weekly planner page layout
// Left: 7-column week grid | Right: to-do list + notes
// Mirrors the physical planner image the user provided
export function WeekPage() {
  const businesses = useBusinesses();

  return (
    <div className="flex h-full">
      {/* Left side: weekly planner grid */}
      <div className="flex-1 overflow-hidden">
        <WeekGrid />
      </div>

      {/* Right side: to-do list + notes */}
      <TodoSidebar businesses={businesses} />
    </div>
  );
}
