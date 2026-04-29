"use client";

// Calendar view: fetches events from Hermes → Google Calendar API
// Displays current week or month, with ability to create events via Hermes

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { sendCommand, type HermesTask } from "@/lib/hermes";
import { StatusIndicator } from "@/modules/hermes/StatusIndicator";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  calendar?: string;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOUR_LABELS = Array.from({ length: 14 }, (_, i) => i + 7); // 7am to 8pm

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateRange(monday: Date): string {
  const end = new Date(monday);
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${monday.toLocaleDateString("en-US", opts)} — ${end.toLocaleDateString("en-US", { ...opts, year: "numeric" })}`;
}

export function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [addingEvent, setAddingEvent] = useState(false);
  const [newEventText, setNewEventText] = useState("");

  const monday = getMonday(new Date());
  monday.setDate(monday.getDate() + weekOffset * 7);

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = monday.toISOString().split("T")[0];
      const endDate = weekDates[6].toISOString().split("T")[0];
      const task = await sendCommand(
        `Fetch Google Calendar events from ${startDate} to ${endDate}`,
        { action: "calendar_list", startDate, endDate }
      );
      // The result will come async; for now show what we have
      if (task.result && Array.isArray(task.result)) {
        setEvents(task.result as CalendarEvent[]);
      }
    } catch {
      // Hermes offline — show empty
    }
    setLoading(false);
  }, [weekOffset]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  async function handleAddEvent() {
    if (!newEventText.trim()) return;
    await sendCommand(`Create calendar event: ${newEventText.trim()}`, { action: "calendar_create" });
    setNewEventText("");
    setAddingEvent(false);
    // Refresh after a delay (Hermes needs time to process)
    setTimeout(fetchEvents, 3000);
  }

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/60">
        <div className="flex items-center gap-3">
          <button onClick={() => setWeekOffset((o) => o - 1)}
            className="p-1 text-text-muted/50 hover:text-text transition-colors">
            <ChevronLeft size={14} />
          </button>
          <div className="text-center">
            <h1 className="text-[11px] font-medium tracking-[0.3em] uppercase text-text-muted/70">
              Calendar
            </h1>
            <p className="text-[10px] text-text-muted/40 mt-0.5">{formatDateRange(monday)}</p>
          </div>
          <button onClick={() => setWeekOffset((o) => o + 1)}
            className="p-1 text-text-muted/50 hover:text-text transition-colors">
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <StatusIndicator />
          <button
            onClick={() => setAddingEvent(true)}
            className="flex items-center gap-1 text-[10px] text-text-muted hover:text-text transition-colors"
          >
            <Plus size={12} /> Add
          </button>
        </div>
      </div>

      {/* Add event input */}
      {addingEvent && (
        <div className="flex items-center gap-2 px-5 py-2 border-b border-border/30 bg-bg-subtle">
          <input
            autoFocus
            type="text"
            value={newEventText}
            onChange={(e) => setNewEventText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddEvent();
              if (e.key === "Escape") { setAddingEvent(false); setNewEventText(""); }
            }}
            placeholder='e.g. "Meeting with John tomorrow at 3pm"'
            className="flex-1 bg-transparent text-[12px] placeholder:text-text-muted/30 focus:outline-none"
          />
          <button onClick={handleAddEvent} className="text-[10px] text-text-muted hover:text-text">
            Send to Hermes
          </button>
        </div>
      )}

      {/* Week grid */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full text-text-muted/30 text-xs">
            Fetching from Hermes...
          </div>
        ) : (
          <div className="grid grid-cols-7 min-h-full">
            {/* Day headers */}
            {weekDates.map((date, i) => {
              const dateStr = date.toISOString().split("T")[0];
              const isToday = dateStr === todayStr;
              return (
                <div
                  key={i}
                  className={`border-b border-r border-border/30 px-2 py-2 text-center
                              ${isToday ? "text-active" : "text-text-muted/60"}`}
                >
                  <div className="text-[10px] tracking-wide">{DAY_NAMES[i]}</div>
                  <div className="text-[11px] mt-0.5">{date.getDate()}</div>
                </div>
              );
            })}

            {/* Time slots: 7am–8pm for each day */}
            {HOUR_LABELS.map((hour) =>
              weekDates.map((date, dayIdx) => {
                const dateStr = date.toISOString().split("T")[0];
                const slotEvents = events.filter((ev) => {
                  const evDate = ev.start.split("T")[0];
                  const evHour = parseInt(ev.start.split("T")[1]?.split(":")[0] || "0", 10);
                  return evDate === dateStr && evHour === hour;
                });
                return (
                  <div
                    key={`${hour}-${dayIdx}`}
                    className="border-b border-r border-border/10 px-1 py-0.5 min-h-[28px]
                               relative"
                  >
                    {dayIdx === 0 && (
                      <span className="absolute -left-6 text-[9px] text-text-muted/30 top-0">
                        {hour}:00
                      </span>
                    )}
                    {slotEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="text-[10px] bg-bg-subtle border border-border/40
                                   rounded px-1 py-0.5 truncate"
                        title={ev.title}
                      >
                        {ev.title}
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
