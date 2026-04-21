import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { Search, Plus, Users, DollarSign, Clock, Shield } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import AddEmployeeModal from "@/components/modals/AddEmployeeModal";
import { db, type BusinessEmployeeRow } from "@/lib/db";
import { subscribeDataChanged } from "@/lib/events";
import PageHeader from "@/components/PageHeader";

const EmployeesPage = () => {
  const { language, session } = useApp();
  const tr = t[language];
  const userId = session?.user?.id ?? null;
  const [employees, setEmployees] = useState<BusinessEmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const loadEmployees = async () => {
    if (!userId) {
      setEmployees([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await db.business.listEmployees(userId);
    if (res.data) setEmployees(res.data);
    setLoading(false);
  };

  useEffect(() => {
    void loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    return subscribeDataChanged(() => {
      void loadEmployees();
    });
  }, [userId]);

  const filtered = useMemo(
    () => employees.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()) || e.email.includes(search)),
    [employees, search],
  );
  const selectedEmp = employees.find((e) => e.id === selected) ?? null;

  const formatLastEdit = (iso: string | null) => {
    if (!iso) return "-";
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  return (
    <div className="h-full flex flex-col md:flex-row">
      <div className="flex-1 md:max-w-lg md:border-r border-border flex flex-col">
        <div className="px-4 py-3 border-b border-border bg-card">
          <PageHeader
            title={tr.employees}
            right={(
              <button
                onClick={() => setShowAdd(true)}
                className="bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium flex items-center gap-1 hover:opacity-90 transition"
              >
                <Plus className="h-4 w-4" /> {tr.addEmployee}
              </button>
            )}
          />
        </div>

        <div className="p-3 bg-card border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`${tr.search} ${tr.employees.toLowerCase()}`}
              className="w-full pl-10 pr-4 py-2 border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <EmptyState title="Loading…" subtitle="" />
          ) : filtered.length === 0 ? (
            <EmptyState title={tr.noData} subtitle={tr.addFirst} />
          ) : (
            filtered.map((emp) => (
              <button key={emp.id} onClick={() => setSelected(emp.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 border-b border-border text-left hover:bg-accent transition ${selected === emp.id ? "bg-accent" : ""}`}>
                <div className="w-9 h-9 bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">{emp.name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{emp.name}</p>
                  <p className="text-xs text-muted-foreground">{emp.role || "-"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">₹{(emp.salary ?? 0).toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">{tr.salary}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="hidden md:flex flex-1 items-center justify-center bg-background">
        {selectedEmp ? (
          <div className="text-center animate-fade-in max-w-xs">
            <div className="w-16 h-16 bg-primary/10 flex items-center justify-center mx-auto mb-3 text-primary font-bold text-xl">{selectedEmp.name.charAt(0)}</div>
            <h3 className="font-bold text-lg">{selectedEmp.name}</h3>
            <p className="text-sm text-muted-foreground">{selectedEmp.email}</p>

            <div className="grid grid-cols-2 gap-3 mt-4 text-left">
              <div className="bg-card border border-border p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">{tr.role}</span>
                </div>
                <p className="text-sm font-semibold">{selectedEmp.role || "-"}</p>
              </div>
              <div className="bg-card border border-border p-3">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">{tr.salary}</span>
                </div>
                <p className="text-sm font-semibold">₹{(selectedEmp.salary ?? 0).toLocaleString()}</p>
              </div>
              <div className="bg-card border border-border p-3 col-span-2">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">{tr.editHistory}</span>
                </div>
                <p className="text-sm font-semibold">Last edit: {formatLastEdit(selectedEmp.last_edit_at)}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Select an employee to view details</p>
          </div>
        )}
      </div>

      {userId && (
        <AddEmployeeModal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          userId={userId}
          onAdded={() => void loadEmployees()}
        />
      )}
    </div>
  );
};

export default EmployeesPage;
