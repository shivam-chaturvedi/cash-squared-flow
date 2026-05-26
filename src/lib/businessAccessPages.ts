/** Canonical business nav / access page slugs (must match AppLayout businessNav keys). */
export const BUSINESS_ACCESS_PAGE_IDS = [
  "dashboard",
  "customers",
  "suppliers",
  "employees",
  "expenses",
  "cashbook",
  "reports",
  "settings",
] as const;

export type BusinessAccessPageId = (typeof BUSINESS_ACCESS_PAGE_IDS)[number];

const ID_SET = new Set<string>(BUSINESS_ACCESS_PAGE_IDS);

export const BUSINESS_ACCESS_PAGE_LABELS: Record<BusinessAccessPageId, string> = {
  dashboard: "Dashboard",
  customers: "Customers",
  suppliers: "Suppliers",
  employees: "Employees",
  expenses: "Expenses",
  cashbook: "Cashbook",
  reports: "Reports",
  settings: "Settings",
};

/** Map common labels / typos / singular forms → canonical slug. */
const SLUG_ALIASES: Record<string, BusinessAccessPageId> = {
  dashboard: "dashboard",
  customer: "customers",
  customers: "customers",
  supplier: "suppliers",
  suppliers: "suppliers",
  employee: "employees",
  employees: "employees",
  expense: "expenses",
  expenses: "expenses",
  cashbook: "cashbook",
  cashbooks: "cashbook",
  report: "reports",
  reports: "reports",
  setting: "settings",
  settings: "settings",
};

const labelToId = (): Map<string, BusinessAccessPageId> => {
  const map = new Map<string, BusinessAccessPageId>();
  for (const id of BUSINESS_ACCESS_PAGE_IDS) {
    map.set(BUSINESS_ACCESS_PAGE_LABELS[id].toLowerCase(), id);
    map.set(id, id);
  }
  return map;
};

const LABEL_TO_ID = labelToId();

/** Resolve one raw value (slug, label, or comma-separated fragment) to a canonical page id. */
export const normalizeAccessPageId = (raw: string): BusinessAccessPageId | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  if (ID_SET.has(lower)) return lower as BusinessAccessPageId;

  const alias = SLUG_ALIASES[lower.replace(/\s+/g, "")];
  if (alias) return alias;

  const fromLabel = LABEL_TO_ID.get(lower);
  if (fromLabel) return fromLabel;

  return null;
};

/** Normalize access list from DB / invites (handles labels, casing, comma-joined strings). */
export const normalizeAccessPages = (pages: string[] | null | undefined): BusinessAccessPageId[] => {
  const out = new Set<BusinessAccessPageId>();
  for (const entry of pages ?? []) {
    const parts = entry.includes(",") ? entry.split(",") : [entry];
    for (const part of parts) {
      const id = normalizeAccessPageId(part);
      if (id) out.add(id);
    }
  }
  return BUSINESS_ACCESS_PAGE_IDS.filter((id) => out.has(id));
};

export const formatAccessPageLabels = (pages: string[] | null | undefined): string => {
  const normalized = normalizeAccessPages(pages);
  if (normalized.length === 0) return "-";
  return normalized.map((id) => BUSINESS_ACCESS_PAGE_LABELS[id]).join(", ");
};

export const BUSINESS_ACCESS_OPTIONS = BUSINESS_ACCESS_PAGE_IDS.map((id) => ({
  id,
  label: BUSINESS_ACCESS_PAGE_LABELS[id],
}));
