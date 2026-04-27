import { type InputHTMLAttributes } from "react";

// Minimal input with bottom border only (matches the planner aesthetic)
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = "", ...props }: InputProps) {
  return (
    <div className={className}>
      {label && (
        <label className="mb-1 block text-xs text-text-muted">{label}</label>
      )}
      <input
        className="w-full border-b border-border bg-transparent px-0 py-2 text-sm
                   placeholder:text-text-muted focus:border-active focus:outline-none
                   transition-colors"
        {...props}
      />
    </div>
  );
}
