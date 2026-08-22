interface EmptyStateProps {
  icon?: string;
  title?: string;
  description?: string;
}

export default function EmptyState({
  icon = "◯",
  title = "Nothing here",
  description,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-steel-light">
      <span className="text-2xl text-steel">{icon}</span>
      <p className="text-sm font-display font-medium uppercase tracking-wide text-steel">
        {title}
      </p>
      {description && <p className="text-xs text-steel-light">{description}</p>}
    </div>
  );
}
