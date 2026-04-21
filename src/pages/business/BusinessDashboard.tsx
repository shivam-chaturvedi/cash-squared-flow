import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import StatCard from "@/components/StatCard";
import { ArrowUpRight, ArrowDownLeft, Plus, Users, Receipt } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import AddTransactionModal from "@/components/modals/AddTransactionModal";
import AddCustomerModal from "@/components/modals/AddCustomerModal";
import AddExpenseModal, { type ExpenseDraft } from "@/components/modals/AddExpenseModal";
import { addNotification } from "@/lib/notifications";
import { toast } from "@/hooks/use-toast";
import { db, type BusinessCustomerRow, type BusinessExpenseRow, type BusinessTransactionRow } from "@/lib/db";
import { subscribeDataChanged } from "@/lib/events";
import PageHeader from "@/components/PageHeader";

const BusinessDashboard = () => {
  const { language, userName, session, profile } = useApp();
  const tr = t[language];
  const userId = session?.user?.id ?? null;
  const [showTransaction, setShowTransaction] = useState(false);
  const [showCustomer, setShowCustomer] = useState(false);
  const [showExpense, setShowExpense] = useState(false);
  const [customers, setCustomers] = useState<BusinessCustomerRow[]>([]);
  const [transactions, setTransactions] = useState<BusinessTransactionRow[]>([]);
  const [expenses, setExpenses] = useState<BusinessExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!userId) {
      setCustomers([]);
      setTransactions([]);
      setExpenses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [custRes, txRes, exRes] = await Promise.all([
      db.business.listCustomers(userId),
      db.business.listTransactions(userId),
      db.business.listExpenses(userId),
    ]);
    if (custRes.data) setCustomers(custRes.data);
    if (txRes.data) setTransactions(txRes.data);
    if (exRes.data) setExpenses(exRes.data);
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

  const totals = useMemo(() => {
    const totalGive = customers.filter((c) => c.balance < 0).reduce((s, c) => s + Math.abs(c.balance), 0);
    const totalGet = customers.filter((c) => c.balance >= 0).reduce((s, c) => s + c.balance, 0);
    const totalIn = transactions.filter((t) => t.type === "in").reduce((s, t) => s + t.amount, 0);
    const totalOut = transactions.filter((t) => t.type === "out").reduce((s, t) => s + t.amount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const totalBalance = totalIn - totalOut - totalExpenses;

    const today = new Date().toISOString().split("T")[0];
    const todayIn = transactions
      .filter((t) => t.type === "in" && new Date(t.occurred_at).toISOString().split("T")[0] === today)
      .reduce((s, t) => s + t.amount, 0);
    const todayOut = transactions
      .filter((t) => t.type === "out" && new Date(t.occurred_at).toISOString().split("T")[0] === today)
      .reduce((s, t) => s + t.amount, 0);
    const todayExpenses = expenses.filter((e) => e.spent_on === today).reduce((s, e) => s + e.amount, 0);
    const todayBalance = todayIn - todayOut - todayExpenses;
    return { totalGive, totalGet, totalBalance, todayBalance };
  }, [customers, expenses, transactions]);

  const cashFlowData = useMemo(() => {
    const days = [...Array(7)].map((_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - idx));
      const iso = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString(undefined, { weekday: "short" });
      const inSum = transactions
        .filter((t) => t.type === "in" && new Date(t.occurred_at).toISOString().split("T")[0] === iso)
        .reduce((s, t) => s + t.amount, 0);
      const outSumTx = transactions
        .filter((t) => t.type === "out" && new Date(t.occurred_at).toISOString().split("T")[0] === iso)
        .reduce((s, t) => s + t.amount, 0);
      const outSumExp = expenses.filter((e) => e.spent_on === iso).reduce((s, e) => s + e.amount, 0);
      return { day: label, in: inSum, out: outSumTx + outSumExp };
    });
    return days;
  }, [expenses, transactions]);

  const handleAddExpense = async (draft: ExpenseDraft) => {
    if (!userId) return;
    await db.business.addExpense({
      user_id: userId,
      category: draft.category,
      amount: draft.amount,
      description: draft.description,
      spent_on: draft.date,
    });
    await load();

    const actorRole = profile?.business_role ?? "Owner";
    await addNotification({
      user_id: userId,
      scope: "business",
      type: "expense_added",
      title: tr.expenseAdded,
      description: `${draft.category}: -₹${draft.amount.toLocaleString()}`,
      actor: userName,
      actor_role: actorRole,
    });

    const enabled = ((profile?.notification_prefs ?? {}) as Record<string, unknown>).business_notifications_enabled !== false;
    const watchRoles = profile?.business_watch_roles ?? [];
    const watchPeople = profile?.business_watch_people ?? [];
    const shouldToast = enabled && (watchPeople.includes(userName) || watchRoles.includes(actorRole));
    if (shouldToast) toast({ title: tr.expenseAdded, description: `${draft.category}: -₹${draft.amount.toLocaleString()}` });
  };

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <PageHeader title={tr.dashboard} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label={tr.todayBalance} value={loading ? "—" : `₹${totals.todayBalance.toLocaleString()}`} />
        <StatCard label={tr.totalBalance} value={loading ? "—" : `₹${totals.totalBalance.toLocaleString()}`} />
        <StatCard label={tr.youllGive} value={loading ? "—" : `₹${totals.totalGive.toLocaleString()}`} variant="money-out" icon={<ArrowUpRight className="h-4 w-4 text-money-out" />} />
        <StatCard label={tr.youllGet} value={loading ? "—" : `₹${totals.totalGet.toLocaleString()}`} variant="money-in" icon={<ArrowDownLeft className="h-4 w-4 text-money-in" />} />
      </div>

      <div className="bg-card border border-border p-4">
        <h3 className="text-sm font-semibold mb-4">Cash Flow (This Week)</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cashFlowData}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} className="text-xs" />
              <YAxis hide />
              <Tooltip contentStyle={{ border: "1px solid hsl(220, 15%, 90%)", borderRadius: 0, fontSize: 12 }} />
              <Bar dataKey="in" fill="hsl(145, 63%, 42%)" name="Money In" />
              <Bar dataKey="out" fill="hsl(0, 72%, 51%)" name="Money Out" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: tr.addTransaction, icon: Plus, color: "bg-primary text-primary-foreground", onClick: () => setShowTransaction(true) },
          { label: tr.addCustomer, icon: Users, color: "bg-money-in text-money-in-foreground", onClick: () => setShowCustomer(true) },
          { label: tr.addExpense, icon: Receipt, color: "bg-money-out text-money-out-foreground", onClick: () => setShowExpense(true) },
        ].map((action) => (
          <button key={action.label} onClick={action.onClick} className={`${action.color} p-4 flex flex-col items-center gap-2 text-xs font-medium hover:opacity-90 transition`}>
            <action.icon className="h-5 w-5" />
            {action.label}
          </button>
        ))}
      </div>

      {userId && (
        <AddTransactionModal
          open={showTransaction}
          onClose={() => setShowTransaction(false)}
          userId={userId}
          onAdded={() => void load()}
        />
      )}
      {userId && (
        <AddCustomerModal
          open={showCustomer}
          onClose={() => setShowCustomer(false)}
          userId={userId}
          onAdded={() => void load()}
        />
      )}
      <AddExpenseModal open={showExpense} onClose={() => setShowExpense(false)} type="business" onAddExpense={handleAddExpense} />
    </div>
  );
};

export default BusinessDashboard;
