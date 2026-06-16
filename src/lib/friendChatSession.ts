const sessionKey = (userId: string) => `cash-squared-friend-chat-session-${userId}`;

export type FriendChatSession = {
  connectionId: string | null;
  friendId: string | null;
};

export const readFriendChatSession = (userId: string): FriendChatSession | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(sessionKey(userId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<FriendChatSession>;
    return {
      connectionId: parsed.connectionId ? String(parsed.connectionId) : null,
      friendId: parsed.friendId ? String(parsed.friendId) : null,
    };
  } catch {
    return null;
  }
};

export const writeFriendChatSession = (userId: string, session: FriendChatSession) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(sessionKey(userId), JSON.stringify(session));
};

export const FRIEND_CHAT_SELECT_EVENT = "cash-squared:friend-chat-select";

export type FriendChatSelectDetail = {
  connectionId: string | null;
  friendId: string;
  friendName: string;
};

export const broadcastFriendChatSelect = (detail: FriendChatSelectDetail) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(FRIEND_CHAT_SELECT_EVENT, { detail }));
};
