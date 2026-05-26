import { useEffect, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { db, type BusinessEmployeeRow } from "@/lib/db";
import { BUSINESS_ACCESS_OPTIONS, normalizeAccessPages } from "@/lib/businessAccessPages";
import { broadcastEmployeeAccessChanged, syncEmployeeAccessToLinkedAccounts } from "@/lib/employeeAccessSync";
import { parseEmployeeRoleValue, resolveEmployeeRoleFromForm } from "@/lib/employeeRoles";
import EmployeeRoleSelect from "@/components/EmployeeRoleSelect";

interface Props {
  open: boolean;
  onClose: () => void;
  employee: BusinessEmployeeRow | null;
  onSaved?: () => void;
}

const EditEmployeeAccessModal = ({ open, onClose, employee, onSaved }: Props) => {
  const { language } = useApp();
  const tr = t[language];
  const [accessPages, setAccessPages] = useState<string[]>([]);
  const [rolePreset, setRolePreset] = useState("Employee");
  const [customRole, setCustomRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!employee) {
      setAccessPages([]);
      setRolePreset("Employee");
      setCustomRole("");
      return;
    }
    setAccessPages(normalizeAccessPages(employee.access_pages));
    const parsed = parseEmployeeRoleValue(employee.role);
    setRolePreset(parsed.preset);
    setCustomRole(parsed.custom);
    setErrorMessage(null);
  }, [employee]);

  const accessLabel = accessPages.length === 0
    ? tr.giveAccessToPlaceholder
    : BUSINESS_ACCESS_OPTIONS.filter((o) => accessPages.includes(o.id)).map((o) => o.label).join(", ");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;
    if (accessPages.length === 0) {
      setErrorMessage(tr.giveAccessToRequired);
      return;
    }
    if (rolePreset === "Other" && !customRole.trim()) {
      setErrorMessage(tr.roleRequired);
      return;
    }
    const normalized = normalizeAccessPages(accessPages);
    const resolvedRole = resolveEmployeeRoleFromForm(rolePreset, customRole);
    setSaving(true);
    setErrorMessage(null);
    const res = await db.business.updateEmployee(employee.id, {
      access_pages: normalized,
      role: resolvedRole,
    });
    if (!res.data) {
      setSaving(false);
      setErrorMessage(res.error ?? "Unable to update employee right now.");
      return;
    }
    const syncRes = await syncEmployeeAccessToLinkedAccounts(
      {
        id: employee.id,
        user_id: employee.user_id,
        email: employee.email,
        role: res.data.role,
        access_pages: res.data.access_pages,
        employee_user_id: employee.employee_user_id,
      },
      normalized,
      resolvedRole,
    );
    if (syncRes.error) {
      setSaving(false);
      setErrorMessage(syncRes.error);
      return;
    }
    broadcastEmployeeAccessChanged();
    setSaving(false);
    onSaved?.();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tr.editEmployee}</DialogTitle>
          <DialogDescription>
            {employee ? `Update role and page access for ${employee.name}.` : ""}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <EmployeeRoleSelect
            preset={rolePreset}
            customRole={customRole}
            onPresetChange={setRolePreset}
            onCustomRoleChange={setCustomRole}
            roleLabel={tr.employeeRole}
            customRoleLabel={tr.customRole}
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
                  {BUSINESS_ACCESS_OPTIONS.map((opt) => {
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
                            setAccessPages((prev) =>
                              prev.includes(opt.id) ? prev.filter((p) => p !== opt.id) : [...prev, opt.id],
                            );
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
          {errorMessage && <p className="text-xs text-destructive">{errorMessage}</p>}
          <button
            disabled={saving || !employee}
            type="submit"
            className="w-full bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving…" : tr.save}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditEmployeeAccessModal;
