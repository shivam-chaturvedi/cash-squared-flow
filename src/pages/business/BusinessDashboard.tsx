import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import StatCard from "@/components/StatCard";
import { ArrowUpRight, ArrowDownLeft, Plus, Users, Receipt } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const cashFlowData = [
  { day: "Mon", in: 4500, out: 2200 },
  { day: "Tue", in: 3200, out: 1800 },
  { day: "Wed", in: 5100, out: 3500 },
  { day: "Thu", in: 2800, out: 4200 },
  { day: "Fri", in: 6200, out: 2900 },
  { day: "Sat", in: 4800, out: 1500 },
  { day: "Sun", in: 3600, out: 2100 },
];

const BusinessDashboard = () => {
  const { language } = useApp();
  const tr = t[language];

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <h2 className="text-lg font-bold">{tr.dashboard}</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label={tr.todayBalance} value="₹12,450" />
        <StatCard label={tr.totalBalance} value="₹1,24,500" />
        <StatCard
          label={tr.youllGive}
          value="₹45,200"
          variant="money-out"
          icon={<ArrowUpRight className="h-4 w-4 text-money-out" />}
        />
        <StatCard
          label={tr.youllGet}
          value="₹67,800"
          variant="money-in"
          icon={<ArrowDownLeft className="h-4 w-4 text-money-in" />}
        />
      </div>

      {/* Cash Flow */}
      <div className="bg-card border border-border p-4">
        <h3 className="text-sm font-semibold mb-4">Cash Flow (This Week)</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cashFlowData}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} className="text-xs" />
              <YAxis hide />
              <Tooltip
                contentStyle={{ border: "1px solid hsl(220, 15%, 90%)", borderRadius: 0, fontSize: 12 }}
              />
              <Bar dataKey="in" fill="hsl(145, 63%, 42%)" name="Money In" />
              <Bar dataKey="out" fill="hsl(0, 72%, 51%)" name="Money Out" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: tr.addTransaction, icon: Plus, color: "bg-primary text-primary-foreground" },
          { label: tr.addCustomer, icon: Users, color: "bg-money-in text-money-in-foreground" },
          { label: tr.addExpense, icon: Receipt, color: "bg-money-out text-money-out-foreground" },
        ].map((action) => (
          <button
            key={action.label}
            className={`${action.color} p-4 flex flex-col items-center gap-2 text-xs font-medium hover:opacity-90 transition`}
          >
            <action.icon className="h-5 w-5" />
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BusinessDashboard;
