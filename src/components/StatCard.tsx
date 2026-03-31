import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string;
  icon?: ReactNode;
  variant?: "default" | "money-in" | "money-out";
}

const StatCard = ({ label, value, icon, variant = "default" }: StatCardProps) => {
  const colorClasses = {
    default: "bg-card border-border",
    "money-in": "bg-money-in-light border-money-in/20",
    "money-out": "bg-money-out-light border-money-out/20",
  };
  const valueClasses = {
    default: "text-foreground",
    "money-in": "text-money-in",
    "money-out": "text-money-out",
  };

  return (
    <div className={`border p-4 ${colorClasses[variant]} animate-fade-in`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
        {icon}
      </div>
      <p className={`text-xl font-bold ${valueClasses[variant]}`}>{value}</p>
    </div>
  );
};

export default StatCard;
