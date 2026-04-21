import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { Search, SlidersHorizontal, ArrowUpDown, Plus, Upload, User } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import AddCustomerModal from "@/components/modals/AddCustomerModal";
import BulkUploadModal from "@/components/modals/BulkUploadModal";
import AddTransactionModal from "@/components/modals/AddTransactionModal";
import { db, type BusinessCustomerRow } from "@/lib/db";
import { subscribeDataChanged } from "@/lib/events";
import PageHeader from "@/components/PageHeader";

const CustomersPage = () => {
  const { language, session } = useApp();
  const tr = t[language];
  const navigate = useNavigate();
  const userId = session?.user?.id ?? null;
  const [customers, setCustomers] = useState<BusinessCustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [showTransaction, setShowTransaction] = useState(false);
  const [transactionType, setTransactionType] = useState<"in" | "out">("in");
  const [filterBy, setFilterBy] = useState<"all" | "get" | "give">("all");
  const [sortBy, setSortBy] = useState<"nameAsc" | "nameDesc" | "balanceAsc" | "balanceDesc">("nameAsc");

  const loadCustomers = async () => {
    if (!userId) {
      setCustomers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await db.business.listCustomers(userId);
    if (res.data) setCustomers(res.data);
    setLoading(false);
  };

  useEffect(() => {
    void loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    return subscribeDataChanged(() => {
      void loadCustomers();
    });
  }, [userId]);

  const normalized = useMemo(() => {
    return customers.map((c) => ({
      ...c,
      type: c.balance >= 0 ? ("get" as const) : ("give" as const),
    }));
  }, [customers]);

  const filtered = normalized.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone ?? "").includes(search);
    const matchesFilter = filterBy === "all" || c.type === filterBy;
    return matchesSearch && matchesFilter;
  });
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "nameAsc":
          return a.name.localeCompare(b.name);
        case "nameDesc":
          return b.name.localeCompare(a.name);
        case "balanceAsc":
          return a.balance - b.balance;
        case "balanceDesc":
          return b.balance - a.balance;
        default:
          return 0;
      }
    });
  }, [filtered, sortBy]);
  const selectedCustomer = normalized.find((c) => c.id === selected) ?? null;
  const totalGive = normalized.filter((c) => c.type === "give").reduce((s, c) => s + Math.abs(c.balance), 0);
  const totalGet = normalized.filter((c) => c.type === "get").reduce((s, c) => s + c.balance, 0);

  return (
    <div className="h-full flex flex-col md:flex-row">
      <div className="flex-1 md:max-w-lg md:border-r border-border flex flex-col">
        <div className="p-4 space-y-3 bg-card border-b border-border">
          <PageHeader
            title={tr.customers}
            showLanguageToggle={false}
            below={(
              <div className="space-y-3">
                <div className="flex items-center gap-4 text-sm flex-wrap">
                  <span>{tr.youllGive}: <span className="font-semibold text-money-out">₹{totalGive.toLocaleString()}</span></span>
                  <span>{tr.youllGet}: <span className="font-semibold text-money-in">₹{totalGet.toLocaleString()}</span></span>
                  <button
                    onClick={() => navigate("/reports")}
                    className="ml-auto text-primary text-xs font-medium border border-primary px-3 py-1 flex items-center gap-1"
                  >
                    {tr.viewReport}
                  </button>
                </div>

                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`${tr.search} ${tr.customers.toLowerCase()}`} className="w-full pl-10 pr-4 py-2 border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-xs">
                  <label className="flex items-center gap-2 border border-input px-3 py-1.5 text-muted-foreground bg-background/70">
                    <SlidersHorizontal className="h-3 w-3" />
                    {tr.filterBy}
                    <select
                      value={filterBy}
                      onChange={(e) => setFilterBy(e.target.value as "all" | "get" | "give")}
                      className="ml-2 bg-transparent text-xs font-semibold focus:outline-none"
                    >
                      <option value="all">{tr.filterAll}</option>
                      <option value="get">{tr.youllGet}</option>
                      <option value="give">{tr.youllGive}</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2 border border-input px-3 py-1.5 text-muted-foreground bg-background/70">
                    <ArrowUpDown className="h-3 w-3" />
                    {tr.sortBy}
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as "nameAsc" | "nameDesc" | "balanceAsc" | "balanceDesc")}
                      className="ml-2 bg-transparent text-xs font-semibold focus:outline-none"
                    >
                      <option value="nameAsc">{tr.sortNameAsc}</option>
                      <option value="nameDesc">{tr.sortNameDesc}</option>
                      <option value="balanceAsc">{tr.sortBalanceAsc}</option>
                      <option value="balanceDesc">{tr.sortBalanceDesc}</option>
                    </select>
                  </label>
                </div>
              </div>
            )}
          />
        </div>

        <div className="flex-1 overflow-auto">
            {loading ? (
              <EmptyState title="Loading…" subtitle="" />
            ) : sorted.length === 0 ? (
              <EmptyState title={tr.noData} subtitle={tr.addFirst} />
            ) : (
              sorted.map((c) => (
              <button key={c.id} onClick={() => setSelected(c.id)} className={`w-full flex items-center gap-3 px-4 py-3 border-b border-border text-left hover:bg-accent transition ${selected === c.id ? "bg-accent" : ""}`}>
                <div className="w-9 h-9 bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">{c.name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.phone || "-"}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${c.type === "get" ? "text-money-in" : "text-money-out"}`}>₹{Math.abs(c.balance).toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">{c.type === "get" ? tr.youllGet : tr.youllGive}</p>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="flex gap-3 p-4 border-t border-border bg-card">
          <button onClick={() => setShowBulk(true)} className="flex-1 border border-input py-2.5 text-sm font-medium flex items-center justify-center gap-2 hover:bg-accent transition">
            <Upload className="h-4 w-4" /> {tr.bulkUpload}
          </button>
          <button onClick={() => setShowAdd(true)} className="flex-1 bg-primary text-primary-foreground py-2.5 text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition">
            <Plus className="h-4 w-4" /> {tr.addCustomer}
          </button>
        </div>
      </div>

      <div className="hidden md:flex flex-1 items-center justify-center bg-background">
        {selectedCustomer ? (
          <div className="text-center animate-fade-in">
            <div className="w-16 h-16 bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary font-bold text-xl">{selectedCustomer.name.charAt(0)}</div>
            <h3 className="font-semibold text-lg">{selectedCustomer.name}</h3>
            <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
            <p className={`text-2xl font-bold mt-4 ${selectedCustomer.type === "get" ? "text-money-in" : "text-money-out"}`}>₹{Math.abs(selectedCustomer.balance).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">{selectedCustomer.type === "get" ? tr.youllGet : tr.youllGive}</p>
            <div className="flex gap-3 mt-6 justify-center">
              <button
                onClick={() => { setTransactionType("in"); setShowTransaction(true); }}
                className="bg-money-in text-money-in-foreground px-6 py-2 text-sm font-medium hover:opacity-90 transition"
              >
                {tr.moneyIn}
              </button>
              <button
                onClick={() => { setTransactionType("out"); setShowTransaction(true); }}
                className="bg-money-out text-money-out-foreground px-6 py-2 text-sm font-medium hover:opacity-90 transition"
              >
                {tr.moneyOut}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">{tr.noCustomerSelected}</p>
          </div>
        )}
      </div>

      {userId && (
        <AddCustomerModal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          userId={userId}
          onAdded={() => void loadCustomers()}
        />
      )}
      <BulkUploadModal open={showBulk} onClose={() => setShowBulk(false)} type="customers" />
      {userId && (
        <AddTransactionModal
          open={showTransaction}
          onClose={() => setShowTransaction(false)}
          userId={userId}
          initialType={transactionType}
          customerId={selectedCustomer?.id ?? null}
          onAdded={() => void loadCustomers()}
          onCustomerUpdated={() => void loadCustomers()}
        />
      )}
    </div>
  );
};

export default CustomersPage;
