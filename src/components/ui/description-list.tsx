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
        "space-y-0 text-sm",
        variant === "bordered" && "divide-y divide-border rounded-md border border-border",
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

/** 键值行：label 固定宽度，value 紧邻右侧（禁止 justify-between 拉满） */
export function DescriptionItem({ label, children, className }: DescriptionItemProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(7.5rem,9.5rem)_minmax(0,1fr)] items-start gap-x-4 gap-y-1 px-3 py-2.5",
        className,
      )}
    >
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-foreground">{children}</dd>
    </div>
  );
}

export function DescriptionRow(props: DescriptionItemProps) {
  return <DescriptionItem {...props} />;
}
