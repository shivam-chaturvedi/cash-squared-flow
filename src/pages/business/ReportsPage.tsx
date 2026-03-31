import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import StatCard from "@/components/StatCard";
import { Download } from "lucide-react";

const ReportsPage = () => {
  const { language } = useApp();
  const tr = t[language];

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{tr.reports}</h2>
        <div className="flex gap-2">
          <button className="border border-input px-3 py-1.5 text-xs font-medium flex items-center gap-1 hover:bg-accent transition">
            <Download className="h-3 w-3" /> PDF
          </button>
          <button className="border border-input px-3 py-1.5 text-xs font-medium flex items-center gap-1 hover:bg-accent transition">
            <Download className="h-3 w-3" /> Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Revenue" value="₹3,45,000" variant="money-in" />
        <StatCard label="Total Expenses" value="₹1,88,000" variant="money-out" />
        <StatCard label="Net Profit" value="₹1,57,000" />
        <StatCard label="Transactions" value="234" />
      </div>

      <div className="bg-card border border-border p-4 space-y-3">
        <h3 className="text-sm font-semibold">Monthly Summary</h3>
        {["January", "February", "March"].map((month) => (
          <div key={month} className="flex items-center justify-between py-2 border-b border-border last:border-0">
            <span className="text-sm">{month} 2026</span>
            <div className="flex gap-6 text-sm">
              <span className="text-money-in font-medium">+₹1,15,000</span>
              <span className="text-money-out font-medium">-₹62,600</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportsPage;
