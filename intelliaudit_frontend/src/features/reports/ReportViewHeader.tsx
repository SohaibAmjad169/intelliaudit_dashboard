interface ReportViewHeaderProps {
  title: string;
  projectId: string;
}

export function ReportViewHeader({ title, projectId }: ReportViewHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
      <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
    </div>
  );
}
