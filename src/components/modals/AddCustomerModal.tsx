import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface Props { open: boolean; onClose: () => void; }

const AddCustomerModal = ({ open, onClose }: Props) => {
  const { language } = useApp();
  const tr = t[language];
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
    setName(""); setPhone(""); setEmail("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tr.addCustomer}</DialogTitle>
          <DialogDescription>Add a new customer to your ledger</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input placeholder="Customer Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" required />
          <input placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" required />
          <input type="email" placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <div className="flex gap-3">
            <input type="number" placeholder="Opening Balance (₹)" className="flex-1 border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <select className="border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="get">{tr.youllGet}</option>
              <option value="give">{tr.youllGive}</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:opacity-90">{tr.addCustomer}</button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCustomerModal;
