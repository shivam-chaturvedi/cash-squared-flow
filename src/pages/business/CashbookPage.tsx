import { useMemo, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { ArrowDownLeft, ArrowUpRight, Search } from "lucide-react";

const formatDate = (date: Date) => date.toISOString().split("T")[0];
const formatTime = (date: Date) =>
  date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });

const CashbookPage = () => {
  const { language } = useApp();
  const tr = t[language];
  const [typeFilter, setTypeFilter] = useState<"all" | "in" | "out">("all");
  const [search, setSearch] = useState("");

  const now = useMemo(() => new Date(), []);
  const transactions = useMemo(() => {
    const makeTransaction = (
      id: number,
      daysAgo: number,
      desc: string,
      amount: number,
      type: "in" | "out",
      hourOffset: number,
    ) => {
      const date = new Date(now);
      date.setDate(now.getDate() - daysAgo);
      date.setHours(9 + hourOffset, 0, 0, 0);
      return {
        id,
        desc,
        amount,
        type,
        date: formatDate(date),
        time: formatTime(date),
      };
    };
    return [
      makeTransaction(1, 0, "Payment from Rahul", 5000, "in", 0),
      makeTransaction(2, 0, "Office supplies", 1200, "out", 1),
      makeTransaction(3, 1, "Client payment", 8500, "in", 2),
      makeTransaction(4, 1, "Electricity bill", 2300, "out", 3),
      makeTransaction(5, 2, "Freelance work", 15000, "in", 4),
      makeTransaction(6, 5, "Equipment rental", 3400, "out", 2),
      makeTransaction(7, 7, "Recurring income", 7200, "in", 1),
    ];
  }, [now]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesType = typeFilter === "all" ? true : tx.type === typeFilter;
      const matchesSearch = tx.desc.toLowerCase().includes(search.toLowerCase()) || tx.date.includes(search);
      return matchesType && matchesSearch;
    });
  }, [transactions, typeFilter, search]);

  const totalIn = filteredTransactions.filter((tx) => tx.type === "in").reduce((s, tx) => s + tx.amount, 0);
  const totalOut = filteredTransactions.filter((tx) => tx.type === "out").reduce((s, tx) => s + tx.amount, 0);

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{tr.cashbook}</h2>
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
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTypeFilter("all")}
          className={`flex-1 min-w-[90px] rounded-xl border px-3 py-2 text-xs font-semibold transition ${typeFilter === "all" ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground"}`}
        >
          {tr.filterAll}
        </button>
        <button
          onClick={() => setTypeFilter("in")}
          className={`flex-1 min-w-[90px] rounded-xl border px-3 py-2 text-xs font-semibold transition ${typeFilter === "in" ? "bg-money-in/10 border-money-in text-money-in" : "border-border text-muted-foreground"}`}
        >
          {tr.moneyIn}
        </button>
        <button
          onClick={() => setTypeFilter("out")}
          className={`flex-1 min-w-[90px] rounded-xl border px-3 py-2 text-xs font-semibold transition ${typeFilter === "out" ? "bg-money-out/10 border-money-out text-money-out" : "border-border text-muted-foreground"}`}
        >
          {tr.moneyOut}
        </button>
        <div className="flex-1 min-w-[160px]">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tr.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-card border border-border divide-y divide-border">
        {filteredTransactions.map((tx) => (
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
