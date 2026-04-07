import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onClose: () => void;
}

const AddEmployeeModal = ({ open, onClose }: Props) => {
  const { language } = useApp();
  const tr = t[language];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [salary, setSalary] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // placeholder: would call backend or update state
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
            placeholder="Salary (₹)"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            className="w-full border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button type="submit" className="w-full bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:opacity-90">
            {tr.addEmployee}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEmployeeModal;
