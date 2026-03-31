import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import EmptyState from "@/components/EmptyState";
import { Search, Plus } from "lucide-react";
import { useState } from "react";

const mockSuppliers = [
  { id: 1, name: "Kumar Traders", phone: "9876540001", balance: 22000, type: "give" as const },
  { id: 2, name: "Star Packaging", phone: "9876540002", balance: 8500, type: "give" as const },
  { id: 3, name: "Gupta Electronics", phone: "9876540003", balance: -3000, type: "get" as const },
];

const SuppliersPage = () => {
  const { language } = useApp();
  const tr = t[language];
  const [search, setSearch] = useState("");

  const filtered = mockSuppliers.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.phone.includes(search)
  );

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{tr.suppliers}</h2>
        <button className="bg-primary text-primary-foreground px-4 py-2 text-sm font-medium flex items-center gap-1 hover:opacity-90 transition">
          <Plus className="h-4 w-4" /> {tr.addSupplier}
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`${tr.search} ${tr.suppliers.toLowerCase()}`}
          className="w-full pl-10 pr-4 py-2 border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="bg-card border border-border divide-y divide-border">
        {filtered.length === 0 ? (
          <EmptyState title={tr.noData} subtitle={tr.addFirst} />
        ) : (
          filtered.map((s) => (
            <div key={s.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-9 h-9 bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                {s.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.phone}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${s.type === "get" ? "text-money-in" : "text-money-out"}`}>
                  ₹{Math.abs(s.balance).toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {s.type === "get" ? tr.youllGet : tr.youllGive}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SuppliersPage;
