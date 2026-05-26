/** Preset titles employers can assign; "Other" uses custom text. */
export const EMPLOYEE_ROLE_PRESETS = [
  "Co-Owner",
  "President",
  "CEO",
  "CFO",
  "COO",
  "Manager",
  "Supervisor",
  "Employee",
] as const;

export const EMPLOYEE_ROLE_OTHER = "Other";

export type EmployeeRolePreset = (typeof EMPLOYEE_ROLE_PRESETS)[number];

export const normalizeEmployeeRole = (raw: string | null | undefined): string => {
  const trimmed = (raw ?? "").trim();
  return trimmed.length > 0 ? trimmed : "Employee";
};

/** Match stored role to preset or Other + custom value. */
export const parseEmployeeRoleValue = (
  role: string | null | undefined,
): { preset: string; custom: string } => {
  const normalized = normalizeEmployeeRole(role);
  if ((EMPLOYEE_ROLE_PRESETS as readonly string[]).includes(normalized)) {
    return { preset: normalized, custom: "" };
  }
  return { preset: EMPLOYEE_ROLE_OTHER, custom: normalized };
};

export const resolveEmployeeRoleFromForm = (preset: string, custom: string): string => {
  if (preset === EMPLOYEE_ROLE_OTHER) {
    return normalizeEmployeeRole(custom);
  }
  return normalizeEmployeeRole(preset);
};
