import { cn } from "@/lib/utils";

type TagProps = { children: React.ReactNode; active?: boolean } & React.HTMLAttributes<HTMLSpanElement>;

export function Tag({ children, active = false, className, ...props }: TagProps) {
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-label-lg inline-flex items-center",
        active
          ? "bg-primary-container text-on-primary-container"
          : "bg-surface-container text-on-surface-variant",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
