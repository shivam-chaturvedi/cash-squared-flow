import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import EmptyState from "@/components/EmptyState";
import { Plus } from "lucide-react";
import AddExpenseModal, { type ExpenseDraft } from "@/components/modals/AddExpenseModal";
import { addNotification } from "@/lib/notifications";
import { toast } from "@/hooks/use-toast";
import { db, type BusinessExpenseRow } from "@/lib/db";
import { subscribeDataChanged } from "@/lib/events";
import PageHeader from "@/components/PageHeader";
import { useMoney } from "@/hooks/useMoney";

const BusinessExpensesPage = () => {
  const { language, userName, session, profile, businessUserId } = useApp();
  const tr = t[language];
  const { formatMoney } = useMoney();
  const userId = businessUserId ?? (session?.user?.id ?? null);
  const [showAdd, setShowAdd] = useState(false);
  const [expenses, setExpenses] = useState<BusinessExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadExpenses = async () => {
    if (!userId) {
      setExpenses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await db.business.listExpenses(userId);
    if (res.data) setExpenses(res.data);
    setLoading(false);
  };

  useEffect(() => {
    void loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    return subscribeDataChanged(() => {
      void loadExpenses();
    });
  }, [userId]);

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) {
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    }
    return Array.from(map.entries()).map(([name, amount]) => ({ name, amount }));
  }, [expenses]);

  const total = useMemo(() => categories.reduce((s, c) => s + c.amount, 0), [categories]);

  const handleAddExpense = async (draft: ExpenseDraft) => {
    if (!userId) return;
    await db.business.addExpense({
      user_id: userId,
      category: draft.category,
      amount: draft.amount,
      description: draft.description,
      spent_on: draft.date,
    });
    await loadExpenses();

    const actorRole = profile?.business_role ?? "Owner";
    await addNotification({
      user_id: userId,
      scope: "business",
      type: "expense_added",
      title: tr.expenseAdded,
      description: `${draft.category}: ${formatMoney(-draft.amount)}`,
      actor: userName,
      actor_role: actorRole,
    });

    const enabled = ((profile?.notification_prefs ?? {}) as Record<string, unknown>).business_notifications_enabled !== false;
    const watchRoles = profile?.business_watch_roles ?? [];
    const watchPeople = profile?.business_watch_people ?? [];
    const shouldToast = enabled && (watchPeople.includes(userName) || watchRoles.includes(actorRole));
    if (shouldToast) toast({ title: tr.expenseAdded, description: `${draft.category}: ${formatMoney(-draft.amount)}` });
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

      <div className="bg-money-out-light border border-money-out/20 p-4">
        <p className="text-xs text-muted-foreground">{tr.totalSpending}</p>
        <p className="text-2xl font-bold text-money-out">{formatMoney(total)}</p>
      </div>

      <div className="space-y-2">
        {loading ? (
          <EmptyState title="Loading…" subtitle="" />
        ) : categories.map((cat) => (
          <div key={cat.name} className="bg-card border border-border p-4 flex items-center gap-3">
            <div className="w-3 h-3 bg-money-out shrink-0" />
            <span className="flex-1 text-sm font-medium">{cat.name}</span>
            <span className="text-sm font-semibold text-money-out">{formatMoney(cat.amount)}</span>
            <span className="text-xs text-muted-foreground">{Math.round((cat.amount / total) * 100)}%</span>
          </div>
        ))}
      </div>

      {categories.length === 0 && <EmptyState title={tr.noData} subtitle={tr.addFirst} />}

      <AddExpenseModal open={showAdd} onClose={() => setShowAdd(false)} type="business" onAddExpense={handleAddExpense} />
    </div>
  );
};

export default BusinessExpensesPage;
