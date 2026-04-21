import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line } from "recharts";
import EmptyState from "@/components/EmptyState";
import { db, type PersonalExpenseRow } from "@/lib/db";
import { subscribeDataChanged } from "@/lib/events";
import PageHeader from "@/components/PageHeader";

const InsightsPage = () => {
  const { language, session } = useApp();
  const tr = t[language];
  const userId = session?.user?.id ?? null;
  const [expenses, setExpenses] = useState<PersonalExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    void load();
  }, [userId]);

  useEffect(() => {
    return subscribeDataChanged(() => {
      if (!userId) return;
      void db.personal.listExpenses(userId).then((res) => {
        if (res.data) setExpenses(res.data);
      });
    });
  }, [userId]);

  const monthlyData = useMemo(() => {
    const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const map = new Map<string, number>();
    for (const e of expenses) {
      const d = new Date(`${e.spent_on}T00:00:00`);
      const k = monthKey(d);
      map.set(k, (map.get(k) ?? 0) + e.amount);
    }
    const keys = Array.from(map.keys()).sort();
    const last6 = keys.slice(-6);
    return last6.map((k) => {
      const [y, m] = k.split("-").map(Number);
      const label = new Date(y, (m ?? 1) - 1, 1).toLocaleString(undefined, { month: "short" });
      return { month: label, amount: map.get(k) ?? 0 };
    });
  }, [expenses]);

  const categoryData = useMemo(() => {
    const monthPrefix = new Date().toISOString().slice(0, 7);
    const map = new Map<string, number>();
    for (const e of expenses) {
      if (!e.spent_on.startsWith(monthPrefix)) continue;
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    }
    return Array.from(map.entries()).map(([name, amount]) => ({ name, amount }));
  }, [expenses]);

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <PageHeader title={tr.insights} />

      {/* Spending trend */}
      <div className="bg-card border border-border p-4">
        <h3 className="text-sm font-semibold mb-4">Spending Trend</h3>
        <div className="h-48">
          {loading ? (
            <EmptyState title="Loading…" subtitle="" />
          ) : monthlyData.length === 0 ? (
            <EmptyState title={tr.noData} subtitle={tr.addFirst} />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs" />
                <YAxis hide />
                <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} contentStyle={{ border: "1px solid hsl(220,15%,90%)", borderRadius: 0, fontSize: 12 }} />
                <Line type="monotone" dataKey="amount" stroke="hsl(220, 70%, 50%)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Where money goes */}
      <div className="bg-card border border-border p-4">
        <h3 className="text-sm font-semibold mb-4">Where Your Money Goes</h3>
        <div className="h-48">
          {loading ? (
            <EmptyState title="Loading…" subtitle="" />
          ) : categoryData.length === 0 ? (
            <EmptyState title={tr.noData} subtitle={tr.addFirst} />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={50} className="text-xs" />
                <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} contentStyle={{ border: "1px solid hsl(220,15%,90%)", borderRadius: 0, fontSize: 12 }} />
                <Bar dataKey="amount" fill="hsl(220, 70%, 50%)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default InsightsPage;
