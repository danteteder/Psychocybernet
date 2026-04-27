"use client";

// Large minimal timer display
// Shows MM:SS in big, thin type
interface FocusTimerProps {
  timeLeft: number; // seconds
}

// Format seconds as MM:SS
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// Calculate progress as a percentage (0 to 1) for the circle
function progressRatio(timeLeft: number, totalMinutes: number): number {
  if (totalMinutes <= 0) return 0;
  const totalSeconds = totalMinutes * 60;
  return 1 - timeLeft / totalSeconds;
}

export function FocusTimer({
  timeLeft,
  totalMinutes,
}: FocusTimerProps & { totalMinutes: number }) {
  const progress = progressRatio(timeLeft, totalMinutes);
  const circumference = 2 * Math.PI * 120; // circle radius = 120
  const offset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Circular progress ring */}
      <div className="relative flex items-center justify-center">
        <svg width="280" height="280" className="-rotate-90">
          {/* Background circle */}
          <circle
            cx="140"
            cy="140"
            r="120"
            fill="none"
            stroke="#E5E5E5"
            strokeWidth="1"
          />
          {/* Progress arc */}
          <circle
            cx="140"
            cy="140"
            r="120"
            fill="none"
            stroke="#000000"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>

        {/* Time display in the center */}
        <span className="absolute text-5xl font-extralight tracking-widest">
          {formatTime(timeLeft)}
        </span>
      </div>
    </div>
  );
}
