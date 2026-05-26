import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { Plus, Utensils, Home, Car, Zap, ShoppingBag } from "lucide-react";
import AddExpenseModal, { type ExpenseDraft } from "@/components/modals/AddExpenseModal";
import { addNotification } from "@/lib/notifications";
import { toast } from "@/hooks/use-toast";
import { db, type PersonalBudgetRow, type PersonalExpenseRow } from "@/lib/db";
import { subscribeDataChanged } from "@/lib/events";
import PageHeader from "@/components/PageHeader";
import { useMoney } from "@/hooks/useMoney";

const PersonalExpensesPage = () => {
  const { language, session, userName } = useApp();
  const tr = t[language];
  const { formatMoney } = useMoney();
  const userId = session?.user?.id ?? null;
  const [showAdd, setShowAdd] = useState(false);
  const [expenses, setExpenses] = useState<PersonalExpenseRow[]>([]);
  const [budgets, setBudgets] = useState<PersonalBudgetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  const load = async () => {
    if (!userId) {
      setExpenses([]);
      setBudgets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [exRes, budRes] = await Promise.all([
      db.personal.listExpenses(userId),
      db.personal.listBudgets(userId),
    ]);
    if (exRes.data) setExpenses(exRes.data);
    if (budRes.data) setBudgets(budRes.data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    return subscribeDataChanged(() => {
      void load();
    });
  }, [userId]);

  const categories = useMemo(() => ["All", ...Array.from(new Set(expenses.map((e) => e.category)))], [expenses]);
  const filteredExpenses = filter === "All" ? expenses : expenses.filter((e) => e.category === filter);

  const iconForCategory = (category: string) => {
    const map: Record<string, typeof Utensils> = {
      Food: Utensils,
      Rent: Home,
      Travel: Car,
      Bills: Zap,
      Shopping: ShoppingBag,
    };
    return map[category] ?? ShoppingBag;
  };

  const handleAddExpense = async (draft: ExpenseDraft) => {
    if (!userId) return;
    await db.personal.addExpense({
      user_id: userId,
      category: draft.category,
      amount: draft.amount,
      description: draft.description,
      spent_on: draft.date,
    });
    await load();

	    await addNotification({
	      user_id: userId,
	      scope: "personal",
	      type: "expense_added",
	      title: tr.expenseAdded,
	      description: `${draft.category}: ${formatMoney(-draft.amount)}`,
	      actor: userName,
	      actor_role: null,
	    });

    const monthPrefix = new Date().toISOString().slice(0, 7);
    const spentThisMonth = expenses
      .filter((e) => e.category === draft.category && e.spent_on.startsWith(monthPrefix))
      .reduce((s, e) => s + e.amount, 0) + draft.amount;
	    const budget = budgets.find((b) => b.category === draft.category);
	    if (budget && spentThisMonth >= budget.monthly_limit) {
	      await addNotification({
	        user_id: userId,
	        scope: "personal",
	        type: "budget_over",
	        title: tr.budgetExceeded,
	        description: `${draft.category}: ${formatMoney(spentThisMonth)} / ${formatMoney(budget.monthly_limit)}`,
	        actor: userName,
	        actor_role: null,
	      });
	      toast({ title: tr.budgetExceeded, description: `${draft.category}: ${formatMoney(spentThisMonth)} / ${formatMoney(budget.monthly_limit)}` });
	    }
	  };

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <PageHeader
        title={tr.expenses}
        right={(
          <button onClick={() => setShowAdd(true)} className="bg-primary text-primary-foreground px-4 py-2 text-sm font-medium flex items-center gap-1 hover:opacity-90 transition">
            <Plus className="h-4 w-4" /> {tr.addExpense}
          </button>
        )}
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-1.5 text-xs font-medium border border-input whitespace-nowrap hover:bg-accent transition ${
              filter === cat ? "bg-primary text-primary-foreground border-primary" : ""
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border divide-y divide-border">
        {loading ? (
          <div className="p-4"><p className="text-sm text-muted-foreground">Loading…</p></div>
        ) : filteredExpenses.map((exp) => {
          const Icon = iconForCategory(exp.category);
          return (
          <div key={exp.id} className="flex items-center gap-3 px-4 py-3">
            <div className="w-9 h-9 bg-muted flex items-center justify-center shrink-0"><Icon className="h-4 w-4 text-muted-foreground" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{exp.description || tr.expense}</p>
              <p className="text-xs text-muted-foreground">{exp.category} • {exp.spent_on}</p>
            </div>
	            <p className="text-sm font-semibold text-money-out">{formatMoney(-exp.amount)}</p>
	          </div>
	        )})}
      </div>

      <AddExpenseModal open={showAdd} onClose={() => setShowAdd(false)} type="personal" onAddExpense={handleAddExpense} />
    </div>
  );
};

export default PersonalExpensesPage;
