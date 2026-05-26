import { useMemo, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  const [accessPages, setAccessPages] = useState<string[]>([]);
  const [salary, setSalary] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  const accessOptions = useMemo(
    () => ([
      { id: "dashboard", label: "Dashboard" },
      { id: "customers", label: "Customers" },
      { id: "suppliers", label: "Suppliers" },
      { id: "employees", label: "Employees" },
      { id: "expenses", label: "Expenses" },
      { id: "cashbook", label: "Cashbook" },
      { id: "reports", label: "Reports" },
      { id: "settings", label: "Settings" },
    ]),
    [],
  );

  const accessLabel = accessPages.length === 0
    ? tr.giveAccessToPlaceholder
    : accessOptions.filter((o) => accessPages.includes(o.id)).map((o) => o.label).join(", ");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSentMessage(null);
    if (accessPages.length === 0) {
      setErrorMessage(tr.giveAccessToRequired);
      return;
    }
    const salaryValue = salary ? Number(salary) : undefined;
    setSaving(true);
    const employeeName = name.trim();
    const employeeEmail = email.trim();
    const inviteRes = await db.business.createEmployeeInvite({
      owner_user_id: userId,
      employee_name: employeeName,
      employee_email: employeeEmail,
      access_pages: accessPages,
      salary: typeof salaryValue === "number" && Number.isFinite(salaryValue) ? salaryValue : undefined,
    });
    if (!inviteRes.data) {
      setSaving(false);
      setErrorMessage(inviteRes.error ?? "Unable to create invite right now.");
      return;
    }

    const employeeRes = await db.business.addEmployee({
      user_id: userId,
      name: employeeName,
      email: employeeEmail,
      access_pages: accessPages,
      salary: typeof salaryValue === "number" && Number.isFinite(salaryValue) ? salaryValue : undefined,
    });
    setSaving(false);
    if (employeeRes.data) {
      onAdded?.(employeeRes.data);
    }

    const websiteLink = (import.meta.env.VITE_WEBSITE_LINK as string | undefined) || window.location.origin;
    const inviteLink = `${websiteLink.replace(/\/$/, "")}/invite/${inviteRes.data.id}`;
    const mailerBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) || "";
    if (mailerBase) {
      try {
        await fetch(mailerBase, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: employeeEmail,
            subject: "You're invited",
            text: `You're invited to join. Open: ${inviteLink}`,
            html: `<p>You're invited to join.</p><p><a href="${inviteLink}">${inviteLink}</a></p>`,
          }),
        });
        setSentMessage(tr.inviteEmailSent);
      } catch {
        // ignore mail errors; invite is still created in DB
      }
    }

    onClose();
    setName("");
    setEmail("");
    setAccessPages([]);
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
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {tr.giveAccessTo}
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-full border border-input bg-background px-4 py-2.5 text-left text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label={tr.giveAccessTo}
                >
                  <span className={accessPages.length === 0 ? "text-muted-foreground" : ""}>
                    {accessLabel}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-2" align="start">
                <div className="space-y-1">
                  {accessOptions.map((opt) => {
                    const checked = accessPages.includes(opt.id);
                    return (
                      <label
                        key={opt.id}
                        className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted"
                      >
                        <span>{opt.label}</span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setAccessPages((prev) => (
                              prev.includes(opt.id) ? prev.filter((p) => p !== opt.id) : [...prev, opt.id]
                            ));
                          }}
                          className="h-4 w-4 accent-primary"
                        />
                      </label>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>
	          <input
	            type="number"
	            placeholder={`Salary (${currencySymbol})`}
	            value={salary}
	            onChange={(e) => setSalary(e.target.value)}
	            className="w-full border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
	          />
          {errorMessage && (
            <p className="text-xs text-destructive">{errorMessage}</p>
          )}
          {sentMessage && (
            <p className="text-xs text-money-in">{sentMessage}</p>
          )}
          <button disabled={saving} type="submit" className="w-full bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-60">
            {saving ? "Saving…" : tr.addEmployee}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEmployeeModal;
