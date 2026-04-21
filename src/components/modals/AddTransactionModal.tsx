import { useEffect, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { db, type BusinessCustomerRow, type BusinessSupplierRow, type BusinessTransactionRow } from "@/lib/db";
import { useMoney } from "@/hooks/useMoney";

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string;
  initialType?: "in" | "out";
  customerId?: string | null;
  supplierId?: string | null;
  onAdded?: (tx: BusinessTransactionRow) => void;
  onCustomerUpdated?: (customer: BusinessCustomerRow) => void;
  onSupplierUpdated?: (supplier: BusinessSupplierRow) => void;
}

const AddTransactionModal = ({
  open,
  onClose,
  userId,
  initialType,
  customerId = null,
  supplierId = null,
  onAdded,
  onCustomerUpdated,
  onSupplierUpdated,
}: Props) => {
  const { language } = useApp();
  const tr = t[language];
  const { currencySymbol } = useMoney();
  const [type, setType] = useState<"in" | "out">(initialType ?? "in");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return;
    if (!desc.trim()) return;
    const occurredAt = new Date(`${date}T12:00:00`).toISOString();

    setSaving(true);
    const res = await db.business.addTransaction({
      user_id: userId,
      type,
      amount: amt,
      description: desc.trim(),
      occurred_at: occurredAt,
      customer_id: customerId,
      supplier_id: supplierId,
    });

    if (res.data && customerId) {
      const current = await db.business.listCustomers(userId);
      const cust = current.data?.find((c) => c.id === customerId) ?? null;
      if (cust) {
        const nextBalance = type === "in" ? cust.balance - amt : cust.balance + amt;
        const updated = await db.business.updateCustomerBalance(customerId, nextBalance);
        if (updated.data) onCustomerUpdated?.(updated.data);
      }
    }

    if (res.data && supplierId) {
      const current = await db.business.listSuppliers(userId);
      const sup = current.data?.find((s) => s.id === supplierId) ?? null;
      if (sup) {
        const nextBalance = type === "out" ? sup.balance + amt : sup.balance - amt;
        const updated = await db.business.updateSupplierBalance(supplierId, nextBalance);
        if (updated.data) onSupplierUpdated?.(updated.data);
      }
    }

    setSaving(false);
    if (res.data) {
      onAdded?.(res.data);
    }
    onClose();
    setAmount("");
    setDesc("");
    setDate(new Date().toISOString().split("T")[0]);
  };

  useEffect(() => {
    if (open) {
      setType(initialType ?? "in");
      setDate(new Date().toISOString().split("T")[0]);
    }
  }, [open, initialType]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tr.addTransaction}</DialogTitle>
          <DialogDescription>Record a new money in or money out entry</DialogDescription>
        </DialogHeader>
	        <form onSubmit={handleSubmit} className="space-y-4">
	          <div className="flex bg-muted p-0.5">
	            <button type="button" onClick={() => setType("in")} className={`flex-1 py-2 text-sm font-medium ${type === "in" ? "bg-money-in text-money-in-foreground" : "text-muted-foreground"}`}>{tr.moneyIn}</button>
	            <button type="button" onClick={() => setType("out")} className={`flex-1 py-2 text-sm font-medium ${type === "out" ? "bg-money-out text-money-out-foreground" : "text-muted-foreground"}`}>{tr.moneyOut}</button>
	          </div>
	          <input type="number" placeholder={`Amount (${currencySymbol})`} value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" required />
	          <input placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" required />
	          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
	          <button disabled={saving} type="submit" className="w-full bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-60">
	            {saving ? "Saving…" : tr.addTransaction}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTransactionModal;
