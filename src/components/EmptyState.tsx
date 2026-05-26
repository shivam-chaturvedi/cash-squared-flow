import { FileX } from "lucide-react";

interface EmptyStateProps {
  title: string;
  subtitle: string;
  action?: { label: string; onClick: () => void };
}

const EmptyState = ({ title, subtitle, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
    <div className="w-24 h-24 bg-muted flex items-center justify-center mb-6">
      <FileX className="h-10 w-10 text-muted-foreground" />
    </div>
    <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
    <p className="text-sm text-muted-foreground mb-6">{subtitle}</p>
    {action && (
      <button
        onClick={action.onClick}
        className="bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium hover:opacity-90 transition"
      >
        {action.label}
      </button>
    )}
  </div>
);

export default EmptyState;
