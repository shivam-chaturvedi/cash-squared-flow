import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { ArrowDownLeft, ArrowUpRight, Search } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { db, type BusinessTransactionRow } from "@/lib/db";
import { subscribeDataChanged } from "@/lib/events";
import PageHeader from "@/components/PageHeader";
import { useMoney } from "@/hooks/useMoney";

const CashbookPage = () => {
  const { language, session } = useApp();
  const tr = t[language];
  const { formatMoney } = useMoney();
  const userId = session?.user?.id ?? null;
  const [transactions, setTransactions] = useState<BusinessTransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<"all" | "in" | "out">("all");
  const [search, setSearch] = useState("");

  const loadTransactions = async () => {
    if (!userId) {
      setTransactions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await db.business.listTransactions(userId);
    if (res.data) setTransactions(res.data);
    setLoading(false);
  };

  useEffect(() => {
    void loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    return subscribeDataChanged(() => {
      void loadTransactions();
    });
  }, [userId]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesType = typeFilter === "all" ? true : tx.type === typeFilter;
      const occurred = new Date(tx.occurred_at);
      const date = occurred.toISOString().split("T")[0];
      const matchesSearch = tx.description.toLowerCase().includes(search.toLowerCase()) || date.includes(search);
      return matchesType && matchesSearch;
    });
  }, [transactions, typeFilter, search]);

  const totalIn = filteredTransactions.filter((tx) => tx.type === "in").reduce((s, tx) => s + tx.amount, 0);
  const totalOut = filteredTransactions.filter((tx) => tx.type === "out").reduce((s, tx) => s + tx.amount, 0);

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <PageHeader title={tr.cashbook} />

      {/* Summary */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="bg-money-in-light border border-money-in/20 p-3 text-center">
          <p className="text-xs text-muted-foreground">{tr.moneyIn}</p>
          <p className="text-lg font-bold text-money-in">{formatMoney(totalIn)}</p>
        </div>
	        <div className="bg-money-out-light border border-money-out/20 p-3 text-center">
	          <p className="text-xs text-muted-foreground">{tr.moneyOut}</p>
	          <p className="text-lg font-bold text-money-out">{formatMoney(totalOut)}</p>
	        </div>
	        <div className="bg-card border border-border p-3 text-center">
	          <p className="text-xs text-muted-foreground">Net</p>
	          <p className="text-lg font-bold">{formatMoney(totalIn - totalOut)}</p>
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
        {loading ? (
          <EmptyState title="Loading…" subtitle="" />
        ) : filteredTransactions.length === 0 ? (
          <EmptyState title={tr.noData} subtitle={tr.addFirst} />
        ) : (
          filteredTransactions.map((tx) => {
            const occurred = new Date(tx.occurred_at);
            const date = occurred.toISOString().split("T")[0];
            const time = occurred.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
            return (
              <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                <div className={`w-8 h-8 flex items-center justify-center ${tx.type === "in" ? "bg-money-in-light" : "bg-money-out-light"}`}>
                  {tx.type === "in" ? (
                    <ArrowDownLeft className="h-4 w-4 text-money-in" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 text-money-out" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">{date} • {time}</p>
                </div>
	                <p className={`text-sm font-semibold ${tx.type === "in" ? "text-money-in" : "text-money-out"}`}>
	                  {formatMoney(tx.type === "in" ? tx.amount : -tx.amount, { signDisplay: "always" })}
	                </p>
	              </div>
	            );
	          })
	        )}
      </div>
    </div>
  );
};

export default CashbookPage;
