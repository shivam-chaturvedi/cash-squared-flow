export type PendingInvite = {
  inviteId: string;
  ownerUserId: string;
  employeeName: string;
  employeeEmail: string;
  accessPages: string[];
  salary: number | null;
};

const KEY = "cash-squared-pending-invite";

export const setPendingInvite = (invite: PendingInvite) => {
  window.localStorage.setItem(KEY, JSON.stringify(invite));
};

export const getPendingInvite = (): PendingInvite | null => {
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PendingInvite>;
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.inviteId || !parsed.ownerUserId) return null;
    return {
      inviteId: String(parsed.inviteId),
      ownerUserId: String(parsed.ownerUserId),
      employeeName: String(parsed.employeeName ?? ""),
      employeeEmail: String(parsed.employeeEmail ?? ""),
      accessPages: Array.isArray(parsed.accessPages) ? parsed.accessPages.map(String) : [],
      salary: typeof parsed.salary === "number" ? parsed.salary : null,
    };
  } catch {
    return null;
  }
};

export const clearPendingInvite = () => {
  window.localStorage.removeItem(KEY);
};

