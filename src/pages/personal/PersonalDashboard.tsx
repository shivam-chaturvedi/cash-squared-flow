import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import StatCard from "@/components/StatCard";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import AddExpenseModal from "@/components/modals/AddExpenseModal";
import { Plus } from "lucide-react";

const spendingData = [
  { name: "Food", value: 8500, color: "hsl(38, 92%, 50%)" },
  { name: "Rent", value: 15000, color: "hsl(220, 70%, 50%)" },
  { name: "Travel", value: 4200, color: "hsl(145, 63%, 42%)" },
  { name: "Bills", value: 6800, color: "hsl(0, 72%, 51%)" },
  { name: "Other", value: 3500, color: "hsl(220, 10%, 60%)" },
];

const PersonalDashboard = () => {
  const { language } = useApp();
  const tr = t[language];
  const totalSpending = spendingData.reduce((s, d) => s + d.value, 0);
  const [showExpense, setShowExpense] = useState(false);

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{tr.dashboard}</h2>
        <button onClick={() => setShowExpense(true)} className="bg-primary text-primary-foreground px-4 py-2 text-sm font-medium flex items-center gap-1 hover:opacity-90 transition">
          <Plus className="h-4 w-4" /> {tr.addExpense}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label={tr.totalBalance} value="₹42,500" />
        <StatCard label={tr.totalSpending} value={`₹${totalSpending.toLocaleString()}`} variant="money-out" />
      </div>

      <div className="bg-card border border-border p-4">
        <h3 className="text-sm font-semibold mb-4">Spending by Category</h3>
        <div className="flex items-center gap-6">
          <div className="w-40 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={spendingData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={65} strokeWidth={0}>
                  {spendingData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {spendingData.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-muted-foreground">{d.name}</span>
                <span className="font-medium ml-auto">₹{d.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AddExpenseModal open={showExpense} onClose={() => setShowExpense(false)} type="personal" />
    </div>
  );
};

export default PersonalDashboard;
