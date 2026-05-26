import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import StatCard from "@/components/StatCard";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import AddExpenseModal, { type ExpenseDraft } from "@/components/modals/AddExpenseModal";
import { Plus } from "lucide-react";
import { db, type PersonalExpenseRow } from "@/lib/db";
import { subscribeDataChanged } from "@/lib/events";
import PageHeader from "@/components/PageHeader";
import { useMoney } from "@/hooks/useMoney";
import CurrencyToggle from "@/components/CurrencyToggle";
import SimpleGoogleTranslator from "@/components/SimpleGoogleTranslator";

const palette = [
  "hsl(38, 92%, 50%)",
  "hsl(220, 70%, 50%)",
  "hsl(145, 63%, 42%)",
  "hsl(0, 72%, 51%)",
  "hsl(262, 80%, 60%)",
  "hsl(220, 10%, 60%)",
];

const PersonalDashboard = () => {
  const { language, session } = useApp();
  const tr = t[language];
  const { formatMoney } = useMoney();
  const userId = session?.user?.id ?? null;
  const [expenses, setExpenses] = useState<PersonalExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExpense, setShowExpense] = useState(false);

  const load = async () => {
    if (!userId) {
      setExpenses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await db.personal.listExpenses(userId);
    if (res.data) setExpenses(res.data);
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

  const monthPrefix = new Date().toISOString().slice(0, 7);
  const spendingData = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) {
      if (!e.spent_on.startsWith(monthPrefix)) continue;
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    }
    return Array.from(map.entries()).map(([name, value], idx) => ({
      name,
      value,
      color: palette[idx % palette.length],
    }));
  }, [expenses, monthPrefix]);

  const totalSpending = spendingData.reduce((s, d) => s + d.value, 0);

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
  };

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <PageHeader
        title={tr.dashboard}
        right={(
          <div className="flex flex-wrap items-center justify-end gap-2">
            <CurrencyToggle compact />
            <SimpleGoogleTranslator />
            <button
              onClick={() => setShowExpense(true)}
              className="bg-primary text-primary-foreground px-4 py-2 text-sm font-medium flex items-center gap-1 hover:opacity-90 transition"
            >
              <Plus className="h-4 w-4" /> {tr.addExpense}
            </button>
          </div>
        )}
      />

      <div className="grid grid-cols-2 gap-3">
        <StatCard label={tr.totalBalance} value={loading ? "—" : formatMoney(0)} />
        <StatCard label={tr.totalSpending} value={loading ? "—" : formatMoney(totalSpending)} variant="money-out" />
      </div>

      <div className="bg-card border border-border p-4">
        <h3 className="text-sm font-semibold mb-4">Spending by Category</h3>
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div className="w-56 max-w-full h-56 sm:w-40 sm:h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={spendingData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={65} strokeWidth={0}>
                  {spendingData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatMoney(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full space-y-2 sm:w-auto">
            {spendingData.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-muted-foreground">{d.name}</span>
                <span className="font-medium ml-auto">{formatMoney(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AddExpenseModal open={showExpense} onClose={() => setShowExpense(false)} type="personal" onAddExpense={handleAddExpense} />
    </div>
  );
};

export default PersonalDashboard;
