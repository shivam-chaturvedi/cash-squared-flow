import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { db, type BusinessEmployeeRow } from "@/lib/db";
import { useMoney } from "@/hooks/useMoney";

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string;
  onAdded?: (employee: BusinessEmployeeRow) => void;
}

const AddEmployeeModal = ({ open, onClose, userId, onAdded }: Props) => {
  const { language } = useApp();
  const tr = t[language];
  const { currencySymbol } = useMoney();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [salary, setSalary] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const salaryValue = salary ? Number(salary) : undefined;
    setSaving(true);
    const res = await db.business.addEmployee({
      user_id: userId,
      name: name.trim(),
      email: email.trim(),
      role: role.trim() || undefined,
      salary: typeof salaryValue === "number" && Number.isFinite(salaryValue) ? salaryValue : undefined,
    });
    setSaving(false);
    if (res.data) {
      onAdded?.(res.data);
    }
    onClose();
    setName("");
    setEmail("");
    setRole("");
    setSalary("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tr.addEmployee}</DialogTitle>
          <DialogDescription>Invite a new team member and set their salary.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            placeholder="Employee name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
          <input
            placeholder="Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
	          <input
	            type="number"
	            placeholder={`Salary (${currencySymbol})`}
	            value={salary}
	            onChange={(e) => setSalary(e.target.value)}
	            className="w-full border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
	          />
          <button disabled={saving} type="submit" className="w-full bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-60">
            {saving ? "Saving…" : tr.addEmployee}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEmployeeModal;
