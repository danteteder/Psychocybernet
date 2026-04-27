// Business monogram badge
// Small pill showing a 2-letter code: OO, NS, W, RE
// Uses shapes (small pill) instead of full text labels

interface BadgeProps {
  code: string;
  className?: string;
}

export function Badge({ code, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border border-border
                  px-1.5 py-0.5 text-[10px] font-medium tracking-wider text-text-muted
                  ${className}`}
    >
      {code}
    </span>
  );
}
