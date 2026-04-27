"use client";

import { WeekGrid } from "./WeekGrid";
import { TodoSidebar } from "./TodoSidebar";
import { useBusinesses } from "./hooks";

// Two-page planner spread (responsive):
// Desktop: left page (55%) = weekly rows, right page (45%) = to-do + notes
// Mobile: stacked vertically (week on top, to-do + notes below)
export function WeekPage() {
  const businesses = useBusinesses();

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Left page: weekly planner */}
      <div className="flex-1 min-h-0 lg:w-[55%] overflow-hidden">
        <WeekGrid />
      </div>

      {/* Right page: to-do + notes */}
      <TodoSidebar businesses={businesses} />
    </div>
  );
}
