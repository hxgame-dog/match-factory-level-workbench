import { cn } from "@/lib/utils";

type PageToolbarProps = {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function PageToolbar({ title, description, actions, className }: PageToolbarProps) {
  if (!title && !description && !actions) return null;
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {title ? <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2> : null}
        {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
