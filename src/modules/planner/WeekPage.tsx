"use client";

import { WeekGrid } from "./WeekGrid";
import { TodoSidebar } from "./TodoSidebar";
import { useBusinesses } from "./hooks";

// Full weekly planner page: two-page spread layout
// Left page: days as horizontal rows (Mon-Sun)
// Right page: to-do checklist + notes
// Mirrors the physical planner image
export function WeekPage() {
  const businesses = useBusinesses();

  return (
    <div className="flex h-full">
      {/* Left page: weekly planner rows */}
      <div className="flex-1 overflow-hidden">
        <WeekGrid />
      </div>

      {/* Right page: to-do + notes */}
      <TodoSidebar businesses={businesses} />
    </div>
  );
}
