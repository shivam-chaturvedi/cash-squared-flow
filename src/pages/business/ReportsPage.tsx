import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { Download } from "lucide-react";
import StatCard from "@/components/StatCard";

const summaryStats = [
  { label: "Total Revenue", value: "₹3,45,000", variant: "money-in" as const },
  { label: "Total Expenses", value: "₹1,88,000", variant: "money-out" as const },
  { label: "Net Profit", value: "₹1,57,000" as const, variant: undefined },
  { label: "Transactions", value: "234" as const, variant: undefined },
];

const monthlySummary = [
  { month: "January", year: 2026, in: 115000, out: 62600 },
  { month: "February", year: 2026, in: 118000, out: 54000 },
  { month: "March", year: 2026, in: 135000, out: 42000 },
];

const ReportsPage = () => {
  const { language } = useApp();
  const tr = t[language];

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
                `<li>${row.month} ${row.year}: +₹${row.in.toLocaleString()} / -₹${row.out.toLocaleString()}</li>`,
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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{tr.reports}</h2>
        <div className="flex gap-2">
          <button onClick={handleDownloadPdf} className="border border-input px-3 py-1.5 text-xs font-medium flex items-center gap-1 hover:bg-accent transition">
            <Download className="h-3 w-3" /> {tr.exportPdf}
          </button>
          <button onClick={handleDownloadCsv} className="border border-input px-3 py-1.5 text-xs font-medium flex items-center gap-1 hover:bg-accent transition">
            <Download className="h-3 w-3" /> {tr.exportExcel}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {summaryStats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} variant={stat.variant} />
        ))}
      </div>

      <div className="bg-card border border-border p-4 space-y-3">
        <h3 className="text-sm font-semibold">{tr.monthlySummary}</h3>
        {monthlySummary.map((month) => (
          <div key={`${month.month}-${month.year}`} className="flex items-center justify-between py-2 border-b border-border last:border-0">
            <span className="text-sm">{month.month} {month.year}</span>
            <div className="flex gap-6 text-sm">
              <span className="text-money-in font-medium">+₹{month.in.toLocaleString()}</span>
              <span className="text-money-out font-medium">-₹{month.out.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportsPage;
