import { cn } from "@/lib/utils";

type PageContentProps = {
  children: React.ReactNode;
  className?: string;
  /** 首页等需要更宽容器时使用 */
  wide?: boolean;
  /** 工作台页面：占满主内容区宽度，避免两侧大块留白 */
  fluid?: boolean;
};

export function PageContent({ children, className, wide, fluid }: PageContentProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 py-6 md:px-6 lg:px-8",
        fluid ? "max-w-none" : wide ? "max-w-[90rem]" : "max-w-7xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
