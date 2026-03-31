import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface Props { open: boolean; onClose: () => void; }

const AddTransactionModal = ({ open, onClose }: Props) => {
  const { language } = useApp();
  const tr = t[language];
  const [type, setType] = useState<"in" | "out">("in");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
    setAmount(""); setDesc("");
  };

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
          <input type="number" placeholder="Amount (₹)" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" required />
          <input placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" required />
          <input type="date" className="w-full border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" defaultValue={new Date().toISOString().split("T")[0]} />
          <button type="submit" className="w-full bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:opacity-90">{tr.addTransaction}</button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTransactionModal;
