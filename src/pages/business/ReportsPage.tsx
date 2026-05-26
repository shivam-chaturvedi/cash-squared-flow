import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { Download } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";
import { db, type BusinessExpenseRow, type BusinessTransactionRow } from "@/lib/db";
import { subscribeDataChanged } from "@/lib/events";
import PageHeader from "@/components/PageHeader";
import { useMoney } from "@/hooks/useMoney";

const ReportsPage = () => {
  const { language, session, businessUserId } = useApp();
  const tr = t[language];
  const { formatMoney } = useMoney();
  const userId = businessUserId ?? (session?.user?.id ?? null);
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

  const handleDownloadExcel = () => {
    const wb = XLSX.utils.book_new();
    const summaryRows = summaryStats.map((row) => ({ Metric: row.label, Value: row.value }));
    const monthlyRows = monthlySummary.map((row) => ({
      Month: `${row.month} ${row.year}`,
      Revenue: row.in,
      Expenses: row.out,
      Net: row.in - row.out,
    }));
    const transactionRows = transactions.map((row) => ({
      Date: new Date(row.occurred_at).toLocaleString(),
      Type: row.type,
      Amount: row.amount,
      Description: row.description,
      CustomerId: row.customer_id ?? "",
      SupplierId: row.supplier_id ?? "",
    }));
    const expenseRows = expenses.map((row) => ({
      Date: row.spent_on,
      Category: row.category,
      Amount: row.amount,
      Description: row.description ?? "",
    }));

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), "Summary");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(monthlyRows), "Monthly");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(transactionRows), "Transactions");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expenseRows), "Expenses");
    XLSX.writeFile(wb, "business-report.xlsx");
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Business Report", 14, 16);

    autoTable(doc, {
      startY: 24,
      head: [["Metric", "Value"]],
      body: summaryStats.map((stat) => [stat.label, stat.value]),
      theme: "grid",
      styles: { fontSize: 10 },
    });

    autoTable(doc, {
      startY: (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY
        ? ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 24) + 8
        : 60,
      head: [["Month", "Revenue", "Expenses", "Net"]],
      body: monthlySummary.map((row) => [
        `${row.month} ${row.year}`,
        formatMoney(row.in),
        formatMoney(-row.out),
        formatMoney(row.in - row.out),
      ]),
      theme: "grid",
      styles: { fontSize: 9 },
    });

    doc.save("business-report.pdf");
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
            <button onClick={handleDownloadExcel} className="border border-input px-3 py-1.5 text-xs font-medium flex items-center gap-1 hover:bg-accent transition">
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
