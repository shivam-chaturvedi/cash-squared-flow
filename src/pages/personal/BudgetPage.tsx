import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";

const budgets = [
  { category: "Food", limit: 10000, spent: 8500 },
  { category: "Rent", limit: 15000, spent: 15000 },
  { category: "Travel", limit: 5000, spent: 4200 },
  { category: "Bills", limit: 8000, spent: 6800 },
  { category: "Shopping", limit: 5000, spent: 2100 },
];

const BudgetPage = () => {
  const { language } = useApp();
  const tr = t[language];
  const totalLimit = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <h2 className="text-lg font-bold">{tr.budget}</h2>

      {/* Overall */}
      <div className="bg-card border border-border p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">{tr.monthlyBudget}</span>
          <span className="font-semibold">₹{totalSpent.toLocaleString()} / ₹{totalLimit.toLocaleString()}</span>
        </div>
        <div className="w-full h-3 bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${Math.min((totalSpent / totalLimit) * 100, 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {tr.remaining}: ₹{(totalLimit - totalSpent).toLocaleString()}
        </p>
      </div>

      {/* Per category */}
      <div className="space-y-3">
        {budgets.map((b) => {
          const pct = (b.spent / b.limit) * 100;
          const over = pct >= 100;
          return (
            <div key={b.category} className="bg-card border border-border p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">{b.category}</span>
                <span className={`font-semibold ${over ? "text-money-out" : ""}`}>
                  ₹{b.spent.toLocaleString()} / ₹{b.limit.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-2 bg-muted">
                <div
                  className={`h-full transition-all ${over ? "bg-money-out" : "bg-money-in"}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BudgetPage;
