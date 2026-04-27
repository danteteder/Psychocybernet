// Status indicator circle
// Empty = todo, half-filled = in_progress, filled = done, X = cancelled
// Uses shapes instead of text to convey status

type Status = "todo" | "in_progress" | "done" | "cancelled";

interface StatusDotProps {
  status: Status;
  size?: number;
  onClick?: () => void;
}

export function StatusDot({ status, size = 14, onClick }: StatusDotProps) {
  const baseClass = `inline-block rounded-full border border-active transition-colors
                     ${onClick ? "cursor-pointer hover:opacity-70" : ""}`;

  if (status === "done") {
    return (
      <span
        onClick={onClick}
        className={baseClass}
        style={{ width: size, height: size, backgroundColor: "var(--color-active)" }}
        title="Done"
      />
    );
  }

  if (status === "in_progress") {
    // Half-filled circle using gradient
    return (
      <span
        onClick={onClick}
        className={baseClass}
        style={{
          width: size,
          height: size,
          background: "linear-gradient(to right, var(--color-active) 50%, transparent 50%)",
        }}
        title="In progress"
      />
    );
  }

  if (status === "cancelled") {
    return (
      <span
        onClick={onClick}
        className={`${baseClass} flex items-center justify-center border-done text-done`}
        style={{ width: size, height: size }}
        title="Cancelled"
      >
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 8 8">
          <line x1="1" y1="1" x2="7" y2="7" stroke="currentColor" strokeWidth="1.5" />
          <line x1="7" y1="1" x2="1" y2="7" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </span>
    );
  }

  // Default: empty circle (todo)
  return (
    <span
      onClick={onClick}
      className={baseClass}
      style={{ width: size, height: size }}
      title="To do"
    />
  );
}
