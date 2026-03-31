import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface Props { open: boolean; onClose: () => void; type?: "business" | "personal"; }

const businessCategories = ["Office Rent", "Salaries", "Utilities", "Supplies", "Marketing", "Travel", "Other"];
const personalCategories = ["Food", "Rent", "Travel", "Bills", "Shopping", "Entertainment", "Other"];

const AddExpenseModal = ({ open, onClose, type = "business" }: Props) => {
  const { language } = useApp();
  const tr = t[language];
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [desc, setDesc] = useState("");
  const categories = type === "business" ? businessCategories : personalCategories;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
    setAmount(""); setCategory(""); setDesc("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tr.addExpense}</DialogTitle>
          <DialogDescription>Record a new expense</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="number" placeholder="Amount (₹)" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" required />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" required>
            <option value="">Select Category</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <input type="date" className="w-full border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" defaultValue={new Date().toISOString().split("T")[0]} />
          <button type="submit" className="w-full bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:opacity-90">{tr.addExpense}</button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddExpenseModal;
