import { EMPLOYEE_ROLE_OTHER, EMPLOYEE_ROLE_PRESETS } from "@/lib/employeeRoles";

type Props = {
  preset: string;
  customRole: string;
  onPresetChange: (preset: string) => void;
  onCustomRoleChange: (value: string) => void;
  roleLabel: string;
  customRoleLabel: string;
  otherLabel?: string;
};

const EmployeeRoleSelect = ({
  preset,
  customRole,
  onPresetChange,
  onCustomRoleChange,
  roleLabel,
  customRoleLabel,
  otherLabel = "Other",
}: Props) => {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {roleLabel}
      </label>
      <select
        value={preset}
        onChange={(e) => onPresetChange(e.target.value)}
        className="w-full border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {EMPLOYEE_ROLE_PRESETS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
        <option value={EMPLOYEE_ROLE_OTHER}>{otherLabel}</option>
      </select>
      {preset === EMPLOYEE_ROLE_OTHER && (
        <input
          type="text"
          placeholder={customRoleLabel}
          value={customRole}
          onChange={(e) => onCustomRoleChange(e.target.value)}
          className="w-full border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          required
        />
      )}
    </div>
  );
};

export default EmployeeRoleSelect;
