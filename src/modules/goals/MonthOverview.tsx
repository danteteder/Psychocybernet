"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MonthGrid } from "./MonthGrid";

// Full monthly overview page
// Shows the current month's calendar grid with task density
export function MonthOverview() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-based

  function prevMonth() {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  const monthName = new Date(year, month - 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <button
          onClick={prevMonth}
          className="p-1 text-text-muted hover:text-text transition-colors"
        >
          <ChevronLeft size={18} strokeWidth={1.5} />
        </button>

        <div className="text-center">
          <h1 className="text-sm font-medium tracking-wide uppercase">
            Monthly Overview
          </h1>
          <p className="text-xs text-text-muted mt-0.5">{monthName}</p>
        </div>

        <button
          onClick={nextMonth}
          className="p-1 text-text-muted hover:text-text transition-colors"
        >
          <ChevronRight size={18} strokeWidth={1.5} />
        </button>
      </div>

      {/* Month grid (large, centered) */}
      <div className="flex flex-1 items-start justify-center p-8">
        <div className="w-full max-w-lg">
          <MonthGrid year={year} month={month} />
        </div>
      </div>
    </div>
  );
}
