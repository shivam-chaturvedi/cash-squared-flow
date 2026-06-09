export type PendingFriendInvite = {
  inviteId: string;
  connectionId: string;
  inviterUserId: string;
  inviteeName: string;
  inviteeEmail: string;
};

const KEY = "cash-squared-pending-friend-invite";

export const setPendingFriendInvite = (invite: PendingFriendInvite) => {
  window.localStorage.setItem(KEY, JSON.stringify(invite));
};

export const getPendingFriendInvite = (): PendingFriendInvite | null => {
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PendingFriendInvite>;
    if (!parsed?.inviteId || !parsed.connectionId || !parsed.inviterUserId) return null;
    return {
      inviteId: String(parsed.inviteId),
      connectionId: String(parsed.connectionId),
      inviterUserId: String(parsed.inviterUserId),
      inviteeName: String(parsed.inviteeName ?? ""),
      inviteeEmail: String(parsed.inviteeEmail ?? ""),
    };
  } catch {
    return null;
  }
};

export const clearPendingFriendInvite = () => {
  window.localStorage.removeItem(KEY);
};
