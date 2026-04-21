import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { db, type BusinessSupplierRow } from "@/lib/db";
import { useMoney } from "@/hooks/useMoney";

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string;
  onAdded?: (supplier: BusinessSupplierRow) => void;
}

const AddSupplierModal = ({ open, onClose, userId, onAdded }: Props) => {
  const { language } = useApp();
  const tr = t[language];
  const { currencySymbol } = useMoney();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [openingBalance, setOpeningBalance] = useState("0");
  const [balanceType, setBalanceType] = useState<"get" | "give">("give");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = Number(openingBalance);
    const signedBalance = (Number.isFinite(raw) ? raw : 0) * (balanceType === "get" ? 1 : -1);
    setSaving(true);
    const res = await db.business.addSupplier({
      user_id: userId,
      name: name.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      balance: signedBalance,
    });
    setSaving(false);
    if (res.data) {
      onAdded?.(res.data);
      onClose();
      setName(""); setPhone(""); setEmail("");
      setOpeningBalance("0"); setBalanceType("give");
      return;
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tr.addSupplier}</DialogTitle>
          <DialogDescription>Add a new supplier to your ledger</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input placeholder="Supplier Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" required />
          <input placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" required />
          <input type="email" placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <div className="flex gap-3">
            <input
              type="number"
              placeholder={`Opening Balance (${currencySymbol})`}
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              className="flex-1 border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              min={0}
            />
            <select
              value={balanceType}
              onChange={(e) => setBalanceType(e.target.value as "get" | "give")}
              className="border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="give">{tr.youllGive}</option>
              <option value="get">{tr.youllGet}</option>
            </select>
          </div>
          <button disabled={saving} type="submit" className="w-full bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-60">
            {saving ? "Saving…" : tr.addSupplier}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSupplierModal;
