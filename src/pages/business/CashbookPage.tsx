import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { ArrowDownLeft, ArrowUpRight, Calendar } from "lucide-react";

const mockTransactions = [
  { id: 1, desc: "Payment from Rahul", amount: 5000, type: "in" as const, date: "2026-03-31", time: "10:30 AM" },
  { id: 2, desc: "Office supplies", amount: 1200, type: "out" as const, date: "2026-03-31", time: "11:45 AM" },
  { id: 3, desc: "Client payment", amount: 8500, type: "in" as const, date: "2026-03-30", time: "2:00 PM" },
  { id: 4, desc: "Electricity bill", amount: 2300, type: "out" as const, date: "2026-03-30", time: "4:15 PM" },
  { id: 5, desc: "Freelance work", amount: 15000, type: "in" as const, date: "2026-03-29", time: "9:00 AM" },
];

const CashbookPage = () => {
  const { language } = useApp();
  const tr = t[language];
  const [filter, setFilter] = useState<"all" | "in" | "out">("all");

  const filtered = filter === "all" ? mockTransactions : mockTransactions.filter((tx) => tx.type === filter);
  const totalIn = mockTransactions.filter((tx) => tx.type === "in").reduce((s, tx) => s + tx.amount, 0);
  const totalOut = mockTransactions.filter((tx) => tx.type === "out").reduce((s, tx) => s + tx.amount, 0);

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{tr.cashbook}</h2>
        <button className="flex items-center gap-1 text-xs border border-input px-3 py-1.5 text-muted-foreground">
          <Calendar className="h-3 w-3" /> This Month
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-money-in-light border border-money-in/20 p-3 text-center">
          <p className="text-xs text-muted-foreground">{tr.moneyIn}</p>
          <p className="text-lg font-bold text-money-in">₹{totalIn.toLocaleString()}</p>
        </div>
        <div className="bg-money-out-light border border-money-out/20 p-3 text-center">
          <p className="text-xs text-muted-foreground">{tr.moneyOut}</p>
          <p className="text-lg font-bold text-money-out">₹{totalOut.toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border p-3 text-center">
          <p className="text-xs text-muted-foreground">Net</p>
          <p className="text-lg font-bold">₹{(totalIn - totalOut).toLocaleString()}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex bg-muted p-0.5">
        {(["all", "in", "out"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 text-xs font-medium transition ${filter === f ? "bg-card shadow-sm" : "text-muted-foreground"}`}
          >
            {f === "all" ? "All" : f === "in" ? tr.moneyIn : tr.moneyOut}
          </button>
        ))}
      </div>

      {/* Transactions */}
      <div className="bg-card border border-border divide-y divide-border">
        {filtered.map((tx) => (
          <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
            <div className={`w-8 h-8 flex items-center justify-center ${tx.type === "in" ? "bg-money-in-light" : "bg-money-out-light"}`}>
              {tx.type === "in" ? (
                <ArrowDownLeft className="h-4 w-4 text-money-in" />
              ) : (
                <ArrowUpRight className="h-4 w-4 text-money-out" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{tx.desc}</p>
              <p className="text-xs text-muted-foreground">{tx.date} • {tx.time}</p>
            </div>
            <p className={`text-sm font-semibold ${tx.type === "in" ? "text-money-in" : "text-money-out"}`}>
              {tx.type === "in" ? "+" : "-"}₹{tx.amount.toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CashbookPage;
