"use client";

// Square checkbox matching the planner aesthetic
// Empty square = unchecked, filled square with checkmark = checked
interface CheckboxProps {
  checked: boolean;
  onChange: () => void;
  size?: number;
}

export function Checkbox({ checked, onChange, size = 14 }: CheckboxProps) {
  return (
    <button
      onClick={onChange}
      className="shrink-0 transition-colors"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox="0 0 14 14">
        <rect
          x="0.5"
          y="0.5"
          width="13"
          height="13"
          rx="1"
          fill={checked ? "var(--color-active)" : "none"}
          stroke={checked ? "var(--color-active)" : "var(--color-border)"}
          strokeWidth="1"
        />
        {checked && (
          <path
            d="M3.5 7L6 9.5L10.5 4.5"
            fill="none"
            stroke="var(--color-bg)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </button>
  );
}
