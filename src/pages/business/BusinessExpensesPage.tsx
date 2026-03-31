import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import EmptyState from "@/components/EmptyState";
import { Plus } from "lucide-react";

const categories = [
  { name: "Office Rent", amount: 15000, color: "bg-primary" },
  { name: "Salaries", amount: 45000, color: "bg-money-out" },
  { name: "Utilities", amount: 3200, color: "bg-[hsl(38,92%,50%)]" },
  { name: "Supplies", amount: 2800, color: "bg-muted-foreground" },
];

const BusinessExpensesPage = () => {
  const { language } = useApp();
  const tr = t[language];
  const total = categories.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{tr.expenses}</h2>
        <button className="bg-primary text-primary-foreground px-4 py-2 text-sm font-medium flex items-center gap-1 hover:opacity-90 transition">
          <Plus className="h-4 w-4" /> {tr.addExpense}
        </button>
      </div>

      {/* Total */}
      <div className="bg-money-out-light border border-money-out/20 p-4">
        <p className="text-xs text-muted-foreground">{tr.totalSpending}</p>
        <p className="text-2xl font-bold text-money-out">₹{total.toLocaleString()}</p>
      </div>

      {/* Categories */}
      <div className="space-y-2">
        {categories.map((cat) => (
          <div key={cat.name} className="bg-card border border-border p-4 flex items-center gap-3">
            <div className={`w-3 h-3 ${cat.color} shrink-0`} />
            <span className="flex-1 text-sm font-medium">{cat.name}</span>
            <span className="text-sm font-semibold text-money-out">₹{cat.amount.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">{Math.round((cat.amount / total) * 100)}%</span>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <EmptyState title={tr.noData} subtitle={tr.addFirst} />
      )}
    </div>
  );
};

export default BusinessExpensesPage;
