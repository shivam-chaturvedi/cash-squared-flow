import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import EmptyState from "@/components/EmptyState";
import { Search, Plus, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AddSupplierModal from "@/components/modals/AddSupplierModal";
import BulkUploadModal from "@/components/modals/BulkUploadModal";
import { db, type BusinessSupplierRow } from "@/lib/db";
import { subscribeDataChanged } from "@/lib/events";
import PageHeader from "@/components/PageHeader";
import { useMoney } from "@/hooks/useMoney";

const SuppliersPage = () => {
  const { language, session } = useApp();
  const tr = t[language];
  const { formatMoneyAbs } = useMoney();
  const userId = session?.user?.id ?? null;
  const [suppliers, setSuppliers] = useState<BusinessSupplierRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showBulk, setShowBulk] = useState(false);

  const loadSuppliers = async () => {
    if (!userId) {
      setSuppliers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await db.business.listSuppliers(userId);
    if (res.data) setSuppliers(res.data);
    setLoading(false);
  };

  useEffect(() => {
    void loadSuppliers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    return subscribeDataChanged(() => {
      void loadSuppliers();
    });
  }, [userId]);

  const normalized = useMemo(() => {
    return suppliers.map((s) => ({ ...s, type: s.balance >= 0 ? ("get" as const) : ("give" as const) }));
  }, [suppliers]);

  const filtered = normalized.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || (s.phone ?? "").includes(search));

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <PageHeader
        title={tr.suppliers}
        right={(
          <div className="flex gap-2">
            <button onClick={() => setShowBulk(true)} className="border border-input px-4 py-2 text-sm font-medium flex items-center gap-1 hover:bg-accent transition">
              <Upload className="h-4 w-4" /> {tr.bulkUpload}
            </button>
            <button onClick={() => setShowAdd(true)} className="bg-primary text-primary-foreground px-4 py-2 text-sm font-medium flex items-center gap-1 hover:opacity-90 transition">
              <Plus className="h-4 w-4" /> {tr.addSupplier}
            </button>
          </div>
        )}
      />

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`${tr.search} ${tr.suppliers.toLowerCase()}`} className="w-full pl-10 pr-4 py-2 border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>

      <div className="bg-card border border-border divide-y divide-border">
        {loading ? (
          <EmptyState title="Loading…" subtitle="" />
        ) : filtered.length === 0 ? (
          <EmptyState title={tr.noData} subtitle={tr.addFirst} />
        ) : (
          filtered.map((s) => (
            <div key={s.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-9 h-9 bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">{s.name.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.phone || "-"}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${s.type === "get" ? "text-money-in" : "text-money-out"}`}>{formatMoneyAbs(s.balance)}</p>
                <p className="text-[10px] text-muted-foreground">{s.type === "get" ? tr.youllGet : tr.youllGive}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {userId && (
        <AddSupplierModal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          userId={userId}
          onAdded={() => void loadSuppliers()}
        />
      )}
      <BulkUploadModal open={showBulk} onClose={() => setShowBulk(false)} type="suppliers" />
    </div>
  );
};

export default SuppliersPage;
