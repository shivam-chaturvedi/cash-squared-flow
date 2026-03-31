import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { Search, SlidersHorizontal, ArrowUpDown, Plus, Upload, User } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import AddCustomerModal from "@/components/modals/AddCustomerModal";
import BulkUploadModal from "@/components/modals/BulkUploadModal";

const mockCustomers = [
  { id: 1, name: "Rahul Sharma", phone: "9876543210", balance: 5200, type: "get" as const },
  { id: 2, name: "Priya Patel", phone: "9876543211", balance: -3400, type: "give" as const },
  { id: 3, name: "Amit Singh", phone: "9876543212", balance: 12000, type: "get" as const },
  { id: 4, name: "Neha Gupta", phone: "9876543213", balance: -800, type: "give" as const },
];

const CustomersPage = () => {
  const { language } = useApp();
  const tr = t[language];
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showBulk, setShowBulk] = useState(false);

  const filtered = mockCustomers.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search));
  const selectedCustomer = mockCustomers.find((c) => c.id === selected);
  const totalGive = mockCustomers.filter((c) => c.type === "give").reduce((s, c) => s + Math.abs(c.balance), 0);
  const totalGet = mockCustomers.filter((c) => c.type === "get").reduce((s, c) => s + c.balance, 0);

  return (
    <div className="h-full flex flex-col md:flex-row">
      <div className="flex-1 md:max-w-lg md:border-r border-border flex flex-col">
        <div className="flex items-center gap-6 px-4 py-3 border-b border-border bg-card text-sm">
          <span>{tr.youllGive}: <span className="font-semibold text-money-out">₹{totalGive.toLocaleString()}</span></span>
          <span>{tr.youllGet}: <span className="font-semibold text-money-in">₹{totalGet.toLocaleString()}</span></span>
          <button className="ml-auto text-primary text-xs font-medium border border-primary px-3 py-1 flex items-center gap-1">{tr.viewReport}</button>
        </div>

        <div className="p-4 space-y-3 bg-card border-b border-border">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`${tr.search} ${tr.customers.toLowerCase()}`} className="w-full pl-10 pr-4 py-2 border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div className="flex gap-3 text-xs">
            <button className="flex items-center gap-1 border border-input px-3 py-1.5 text-muted-foreground hover:text-foreground"><SlidersHorizontal className="h-3 w-3" /> {tr.filterBy}</button>
            <button className="flex items-center gap-1 border border-input px-3 py-1.5 text-muted-foreground hover:text-foreground"><ArrowUpDown className="h-3 w-3" /> {tr.sortBy}</button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {filtered.length === 0 ? (
            <EmptyState title={tr.noData} subtitle={tr.addFirst} />
          ) : (
            filtered.map((c) => (
              <button key={c.id} onClick={() => setSelected(c.id)} className={`w-full flex items-center gap-3 px-4 py-3 border-b border-border text-left hover:bg-accent transition ${selected === c.id ? "bg-accent" : ""}`}>
                <div className="w-9 h-9 bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">{c.name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.phone}</p>
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
              <button className="bg-money-in text-money-in-foreground px-6 py-2 text-sm font-medium">{tr.moneyIn}</button>
              <button className="bg-money-out text-money-out-foreground px-6 py-2 text-sm font-medium">{tr.moneyOut}</button>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">{tr.noCustomerSelected}</p>
          </div>
        )}
      </div>

      <AddCustomerModal open={showAdd} onClose={() => setShowAdd(false)} />
      <BulkUploadModal open={showBulk} onClose={() => setShowBulk(false)} type="customers" />
    </div>
  );
};

export default CustomersPage;
