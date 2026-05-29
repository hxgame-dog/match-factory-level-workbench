import { cn } from "@/lib/utils";

type DescriptionListProps = {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "bordered" | "compact";
};

export function DescriptionList({ children, className, variant = "default" }: DescriptionListProps) {
  return (
    <dl
      className={cn(
        "grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-[var(--label-width,9rem)_1fr]",
        variant === "compact" && "gap-y-2",
        variant === "bordered" && "divide-y divide-border [&>div]:py-2 first:[&>div]:pt-0 last:[&>div]:pb-0",
        className,
      )}
    >
      {children}
    </dl>
  );
}

type DescriptionItemProps = {
  label: string;
  children: React.ReactNode;
  className?: string;
};

export function DescriptionItem({ label, children, className }: DescriptionItemProps) {
  return (
    <div className={cn("contents sm:contents", className)}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-foreground">{children}</dd>
    </div>
  );
}

/** bordered 变体下每行包裹 */
export function DescriptionRow({ label, children, className }: DescriptionItemProps) {
  return (
    <div className={cn("grid grid-cols-1 gap-1 sm:grid-cols-[var(--label-width,9rem)_1fr] sm:gap-x-4", className)}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-foreground">{children}</dd>
    </div>
  );
}
