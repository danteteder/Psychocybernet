import { type ButtonHTMLAttributes } from "react";

// Minimal button with two variants: default (outlined) and primary (filled)
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "ghost";
}

export function Button({
  variant = "default",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base = "inline-flex items-center justify-center text-sm font-medium transition-colors disabled:opacity-40";

  const variants = {
    default: "border border-border px-3 py-1.5 hover:bg-hover",
    primary: "border border-active bg-active text-bg px-3 py-1.5 hover:opacity-80",
    ghost: "px-2 py-1 text-text-muted hover:text-text hover:bg-hover rounded",
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
