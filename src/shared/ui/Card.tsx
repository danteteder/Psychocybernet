// Minimal card container with subtle background and border
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`rounded border border-border bg-bg-subtle p-3 ${className}`}>
      {children}
    </div>
  );
}
