"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { QuarterView } from "./QuarterView";
import { MonthGrid } from "./MonthGrid";

// Yearly overview: 4 quarter columns with goals + mini month grids
export function YearOverview() {
  const [year, setYear] = useState(new Date().getFullYear());

  // All 12 months for the mini month grids
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <button
          onClick={() => setYear((y) => y - 1)}
          className="p-1 text-text-muted hover:text-text transition-colors"
        >
          <ChevronLeft size={18} strokeWidth={1.5} />
        </button>

        <div className="text-center">
          <h1 className="text-sm font-medium tracking-wide uppercase">
            Yearly Goals
          </h1>
          <p className="text-xs text-text-muted mt-0.5">{year}</p>
        </div>

        <button
          onClick={() => setYear((y) => y + 1)}
          className="p-1 text-text-muted hover:text-text transition-colors"
        >
          <ChevronRight size={18} strokeWidth={1.5} />
        </button>
      </div>

      {/* Quarterly goals in a 4-column grid */}
      <div className="grid grid-cols-1 gap-6 border-b border-border p-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((q) => (
          <QuarterView key={q} quarter={q} year={year} />
        ))}
      </div>

      {/* Mini month grids (3 per row, 4 rows) */}
      <div className="p-6">
        <h2 className="mb-4 text-xs font-medium uppercase tracking-widest text-text-muted">
          Task Density
        </h2>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {months.map((m) => (
            <MonthGrid key={m} year={year} month={m} />
          ))}
        </div>
      </div>
    </div>
  );
}
