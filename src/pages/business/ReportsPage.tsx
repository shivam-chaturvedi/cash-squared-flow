import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { Download } from "lucide-react";
import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";
import { db, type BusinessExpenseRow, type BusinessTransactionRow } from "@/lib/db";
import { subscribeDataChanged } from "@/lib/events";
import PageHeader from "@/components/PageHeader";
import { useMoney } from "@/hooks/useMoney";

const ReportsPage = () => {
  const { language, session } = useApp();
  const tr = t[language];
  const { formatMoney } = useMoney();
  const userId = session?.user?.id ?? null;
  const [transactions, setTransactions] = useState<BusinessTransactionRow[]>([]);
  const [expenses, setExpenses] = useState<BusinessExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!userId) {
        setTransactions([]);
        setExpenses([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const [txRes, exRes] = await Promise.all([
        db.business.listTransactions(userId),
        db.business.listExpenses(userId),
      ]);
      if (txRes.data) setTransactions(txRes.data);
      if (exRes.data) setExpenses(exRes.data);
      setLoading(false);
    };
    void load();
  }, [userId]);

  useEffect(() => {
    return subscribeDataChanged(() => {
      if (!userId) return;
      void Promise.all([db.business.listTransactions(userId), db.business.listExpenses(userId)]).then(([txRes, exRes]) => {
        if (txRes.data) setTransactions(txRes.data);
        if (exRes.data) setExpenses(exRes.data);
      });
    });
  }, [userId]);

  const summaryStats = useMemo(() => {
    const revenue = transactions.filter((t) => t.type === "in").reduce((s, t) => s + t.amount, 0);
    const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);
    const netProfit = revenue - expenseTotal;
    return [
      { label: "Total Revenue", value: formatMoney(revenue), variant: "money-in" as const },
      { label: "Total Expenses", value: formatMoney(expenseTotal), variant: "money-out" as const },
      { label: "Net Profit", value: formatMoney(netProfit) as const, variant: undefined },
      { label: "Transactions", value: `${transactions.length}` as const, variant: undefined },
    ];
  }, [expenses, formatMoney, transactions]);

  const monthlySummary = useMemo(() => {
    const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const months = new Map<string, { year: number; monthIndex: number; in: number; out: number }>();
    for (const tx of transactions) {
      const d = new Date(tx.occurred_at);
      const k = monthKey(d);
      const item = months.get(k) ?? { year: d.getFullYear(), monthIndex: d.getMonth(), in: 0, out: 0 };
      if (tx.type === "in") item.in += tx.amount;
      months.set(k, item);
    }
    for (const e of expenses) {
      const d = new Date(`${e.spent_on}T00:00:00`);
      const k = monthKey(d);
      const item = months.get(k) ?? { year: d.getFullYear(), monthIndex: d.getMonth(), in: 0, out: 0 };
      item.out += e.amount;
      months.set(k, item);
    }

    const sorted = Array.from(months.entries())
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .slice(0, 6)
      .map(([_, v]) => {
        const monthName = new Date(v.year, v.monthIndex, 1).toLocaleString(undefined, { month: "long" });
        return { month: monthName, year: v.year, in: v.in, out: v.out };
      });
    return sorted;
  }, [expenses, transactions]);

  const handleDownloadCsv = () => {
    const headers = ["Metric", "Value"];
    const rows = summaryStats.map((row) => [row.label, row.value]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "report-summary.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = () => {
    const html = `
      <html><body style="font-family: sans-serif; padding:20px;">
        <h1>Report summary</h1>
        ${summaryStats.map((stat) => `<p><strong>${stat.label}</strong>: ${stat.value}</p>`).join("")}
        <h2>Monthly breakdown</h2>
	        <ul>
	          ${monthlySummary
	            .map(
	              (row) =>
	                `<li>${row.month} ${row.year}: ${formatMoney(row.in, { signDisplay: "always" })} / ${formatMoney(-row.out)}</li>`,
	            )
	            .join("")}
	        </ul>
      </body></html>
    `;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <PageHeader
        title={tr.reports}
        right={(
          <div className="flex gap-2">
            <button onClick={handleDownloadPdf} className="border border-input px-3 py-1.5 text-xs font-medium flex items-center gap-1 hover:bg-accent transition">
              <Download className="h-3 w-3" /> {tr.exportPdf}
            </button>
            <button onClick={handleDownloadCsv} className="border border-input px-3 py-1.5 text-xs font-medium flex items-center gap-1 hover:bg-accent transition">
              <Download className="h-3 w-3" /> {tr.exportExcel}
            </button>
          </div>
        )}
      />

      {loading ? (
        <EmptyState title="Loading…" subtitle="" />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {summaryStats.map((stat) => (
              <StatCard key={stat.label} label={stat.label} value={stat.value} variant={stat.variant} />
            ))}
          </div>

	          <div className="bg-card border border-border p-4 space-y-3">
	            <h3 className="text-sm font-semibold">{tr.monthlySummary}</h3>
	            {monthlySummary.length === 0 ? (
	              <EmptyState title={tr.noData} subtitle={tr.addFirst} />
	            ) : (
	              monthlySummary.map((month) => (
	                <div key={`${month.month}-${month.year}`} className="flex flex-col gap-2 py-2 border-b border-border last:border-0 sm:flex-row sm:items-center sm:justify-between">
	                  <span className="text-sm">{month.month} {month.year}</span>
	                  <div className="flex flex-wrap gap-4 text-sm sm:justify-end">
	                    <span className="text-money-in font-medium">{formatMoney(month.in, { signDisplay: "always" })}</span>
	                    <span className="text-money-out font-medium">{formatMoney(-month.out)}</span>
	                  </div>
	                </div>
	              ))
	            )}
	          </div>
        </>
      )}
    </div>
  );
};

export default ReportsPage;
