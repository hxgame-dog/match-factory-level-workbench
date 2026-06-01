type AppHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  /** 与 PageContent fluid 对齐，占满主内容区宽度 */
  fluid?: boolean;
};

export function AppHeader({ title, description, actions, fluid }: AppHeaderProps) {
  return (
    <header className="border-b border-border bg-card">
      <div
        className={`mx-auto flex flex-wrap items-start justify-between gap-4 px-4 py-4 md:px-6 lg:px-8 ${fluid ? "max-w-none" : "max-w-7xl"}`}
      >
        <div className="min-w-0">
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {description ? <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
