type AppHeaderProps = {
  title: string;
  description?: string;
};

export function AppHeader({ title, description }: AppHeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white px-6 py-4">
      <h1 className="font-serif text-2xl text-gray-900">{title}</h1>
      {description ? <p className="mt-1 text-sm text-gray-500">{description}</p> : null}
    </header>
  );
}
