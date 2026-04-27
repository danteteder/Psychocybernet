"use client";

import { useMonthTaskDensity } from "./hooks";

// Month overview: calendar grid showing task density per day
// Darker squares = more tasks (like GitHub contribution graph)
interface MonthGridProps {
  year: number;
  month: number; // 1-based
}

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

// Density to opacity mapping
function densityOpacity(count: number): string {
  if (count === 0) return "bg-bg-subtle";
  if (count <= 1) return "bg-border";
  if (count <= 3) return "bg-text-muted";
  return "bg-active";
}

export function MonthGrid({ year, month }: MonthGridProps) {
  const density = useMonthTaskDensity(year, month);

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0).getDate();
  // Monday-based: Mon=0, Sun=6
  const startDow = (firstDay.getDay() + 6) % 7;

  const monthName = firstDay.toLocaleDateString("en-US", { month: "long" });

  // Create grid cells: empty cells before first day + actual days
  const cells: Array<{ day: number | null; date: string }> = [];

  // Empty leading cells
  for (let i = 0; i < startDow; i++) {
    cells.push({ day: null, date: "" });
  }

  // Day cells
  for (let d = 1; d <= lastDay; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, date: dateStr });
  }

  return (
    <div className="space-y-2">
      {/* Month label */}
      <h3 className="text-xs font-medium uppercase tracking-widest">{monthName}</h3>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_LABELS.map((label, i) => (
          <span key={i} className="text-center text-[10px] text-text-muted">
            {label}
          </span>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (cell.day === null) {
            return <div key={i} className="aspect-square" />;
          }

          const count = density[cell.date] || 0;
          const today = new Date().toISOString().split("T")[0];
          const isToday = cell.date === today;

          return (
            <div
              key={i}
              title={`${cell.date}: ${count} task${count !== 1 ? "s" : ""}`}
              className={`flex aspect-square items-center justify-center rounded-sm text-[10px]
                          transition-colors ${densityOpacity(count)}
                          ${isToday ? "ring-1 ring-active" : ""}
                          ${count > 0 ? "text-bg" : "text-text-muted"}`}
            >
              {cell.day}
            </div>
          );
        })}
      </div>
    </div>
  );
}
