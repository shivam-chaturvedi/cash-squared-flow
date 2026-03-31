import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line } from "recharts";

const monthlyData = [
  { month: "Oct", amount: 28000 },
  { month: "Nov", amount: 32000 },
  { month: "Dec", amount: 45000 },
  { month: "Jan", amount: 38000 },
  { month: "Feb", amount: 29000 },
  { month: "Mar", amount: 35000 },
];

const categoryData = [
  { name: "Food", amount: 8500 },
  { name: "Rent", amount: 15000 },
  { name: "Travel", amount: 4200 },
  { name: "Bills", amount: 6800 },
  { name: "Other", amount: 3500 },
];

const InsightsPage = () => {
  const { language } = useApp();
  const tr = t[language];

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <h2 className="text-lg font-bold">{tr.insights}</h2>

      {/* Spending trend */}
      <div className="bg-card border border-border p-4">
        <h3 className="text-sm font-semibold mb-4">Spending Trend</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs" />
              <YAxis hide />
              <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} contentStyle={{ border: "1px solid hsl(220,15%,90%)", borderRadius: 0, fontSize: 12 }} />
              <Line type="monotone" dataKey="amount" stroke="hsl(220, 70%, 50%)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Where money goes */}
      <div className="bg-card border border-border p-4">
        <h3 className="text-sm font-semibold mb-4">Where Your Money Goes</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={50} className="text-xs" />
              <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} contentStyle={{ border: "1px solid hsl(220,15%,90%)", borderRadius: 0, fontSize: 12 }} />
              <Bar dataKey="amount" fill="hsl(220, 70%, 50%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default InsightsPage;
