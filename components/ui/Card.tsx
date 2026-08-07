import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({ className, hover = false, children, ...props }: CardProps) {
  return (
    <div
      className={cn("glass-card p-6", hover && "hover:scale-[1.02]", className)}
      {...props}
    >
      {children}
    </div>
  );
}
