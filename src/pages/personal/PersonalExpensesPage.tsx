import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { Plus, Utensils, Home, Car, Zap, ShoppingBag } from "lucide-react";

const expenses = [
  { id: 1, name: "Lunch", category: "Food", amount: 250, date: "Today", icon: Utensils },
  { id: 2, name: "Electricity", category: "Bills", amount: 1800, date: "Yesterday", icon: Zap },
  { id: 3, name: "Uber ride", category: "Travel", amount: 320, date: "Yesterday", icon: Car },
  { id: 4, name: "Groceries", category: "Food", amount: 1200, date: "Mar 28", icon: ShoppingBag },
  { id: 5, name: "Rent", category: "Rent", amount: 15000, date: "Mar 1", icon: Home },
];

const PersonalExpensesPage = () => {
  const { language } = useApp();
  const tr = t[language];

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{tr.expenses}</h2>
        <button className="bg-primary text-primary-foreground px-4 py-2 text-sm font-medium flex items-center gap-1 hover:opacity-90 transition">
          <Plus className="h-4 w-4" /> {tr.addExpense}
        </button>
      </div>

      {/* Quick category buttons */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["All", "Food", "Rent", "Travel", "Bills"].map((cat) => (
          <button
            key={cat}
            className="px-4 py-1.5 text-xs font-medium border border-input whitespace-nowrap hover:bg-accent transition first:bg-primary first:text-primary-foreground first:border-primary"
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border divide-y divide-border">
        {expenses.map((exp) => (
          <div key={exp.id} className="flex items-center gap-3 px-4 py-3">
            <div className="w-9 h-9 bg-muted flex items-center justify-center shrink-0">
              <exp.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{exp.name}</p>
              <p className="text-xs text-muted-foreground">{exp.category} • {exp.date}</p>
            </div>
            <p className="text-sm font-semibold text-money-out">-₹{exp.amount.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PersonalExpensesPage;
