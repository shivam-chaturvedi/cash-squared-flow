import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { db, type PersonalFriendMessageRow, type PersonalFriendRow } from "@/lib/db";
import { supabase } from "@/lib/supabaseClient";
import {
  FRIEND_CHAT_SELECT_EVENT,
  type FriendChatSelectDetail,
  readFriendChatSession,
  writeFriendChatSession,
} from "@/lib/friendChatSession";

const MAX_MESSAGE_LEN = 2000;

const FriendChatWidget = () => {
  const { mode, language, session } = useApp();
  const location = useLocation();
  const tr = t[language];
  const userId = session?.user?.id ?? null;

  const [open, setOpen] = useState(false);
  const [friends, setFriends] = useState<PersonalFriendRow[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [messages, setMessages] = useState<PersonalFriendMessageRow[]>([]);
  const [readAtByConnection, setReadAtByConnection] = useState<Record<string, string>>({});
  const [unreadByConnection, setUnreadByConnection] = useState<Record<string, number>>({});
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const visible = mode === "personal" && location.pathname === "/friends" && !!userId;
  const selectedFriend = friends.find((f) => f.id === selectedFriendId) ?? null;
  const connectionId = selectedFriend?.connection_id ?? null;

  const chatFriends = useMemo(
    () => friends.filter((f) => f.connection_id && f.status !== "pending"),
    [friends],
  );

  const unreadTotal = useMemo(
    () => Object.values(unreadByConnection).reduce((sum, n) => sum + n, 0),
    [unreadByConnection],
  );

  const refreshUnread = useCallback(
    async (friendRows: PersonalFriendRow[], readMap: Record<string, string>) => {
      if (!userId) return;
      const ids = friendRows.map((f) => f.connection_id).filter(Boolean) as string[];
      if (ids.length === 0) {
        setUnreadByConnection({});
        return;
      }
      const { data } = await supabase
        .from("personal_friend_messages")
        .select("id,connection_id,sender_user_id,created_at")
        .in("connection_id", ids);
      const counts: Record<string, number> = {};
      for (const cid of ids) counts[cid] = 0;
      for (const msg of data ?? []) {
        if (msg.sender_user_id === userId) continue;
        const lastRead = readMap[msg.connection_id as string];
        if (!lastRead || new Date(msg.created_at as string) > new Date(lastRead)) {
          counts[msg.connection_id as string] = (counts[msg.connection_id as string] ?? 0) + 1;
        }
      }
      setUnreadByConnection(counts);
    },
    [userId],
  );

  const loadFriends = useCallback(async () => {
    if (!userId) return;
    const [fRes, rRes] = await Promise.all([
      db.personal.listFriends(userId),
      db.personal.listFriendChatReadStates(userId),
    ]);
    if (fRes.data) setFriends(fRes.data);
    const readMap: Record<string, string> = {};
    if (rRes.data) {
      for (const row of rRes.data) readMap[row.connection_id] = row.last_read_at;
      setReadAtByConnection(readMap);
    }
    if (fRes.data) await refreshUnread(fRes.data, readMap);
  }, [refreshUnread, userId]);

  const loadMessages = useCallback(async (cid: string) => {
    setLoadingMessages(true);
    const res = await db.personal.listFriendMessages(cid);
    if (res.data) setMessages(res.data);
    setLoadingMessages(false);
  }, []);

  const markRead = useCallback(
    async (cid: string) => {
      if (!userId) return;
      const res = await db.personal.markFriendChatRead(userId, cid);
      if (res.data) {
        setReadAtByConnection((prev) => {
          const next = { ...prev, [cid]: res.data!.last_read_at };
          void refreshUnread(friends, next);
          return next;
        });
        setUnreadByConnection((prev) => ({ ...prev, [cid]: 0 }));
      }
    },
    [friends, refreshUnread, userId],
  );

  const selectFriend = useCallback(
    (friend: PersonalFriendRow) => {
      if (!friend.connection_id || !userId) return;
      setSelectedFriendId(friend.id);
      writeFriendChatSession(userId, { connectionId: friend.connection_id, friendId: friend.id });
      void loadMessages(friend.connection_id);
      void markRead(friend.connection_id);
    },
    [loadMessages, markRead, userId],
  );

  useEffect(() => {
    if (!visible || !userId) return;
    void loadFriends();
  }, [loadFriends, userId, visible, open]);

  useEffect(() => {
    if (!visible || !userId) return;
    const onSelect = (e: Event) => {
      const detail = (e as CustomEvent<FriendChatSelectDetail>).detail;
      if (!detail?.friendId) return;
      setSelectedFriendId(detail.friendId);
      if (detail.connectionId && userId) {
        writeFriendChatSession(userId, { connectionId: detail.connectionId, friendId: detail.friendId });
        void loadMessages(detail.connectionId);
        if (open) void markRead(detail.connectionId);
      }
    };
    window.addEventListener(FRIEND_CHAT_SELECT_EVENT, onSelect);
    return () => window.removeEventListener(FRIEND_CHAT_SELECT_EVENT, onSelect);
  }, [loadMessages, markRead, open, userId, visible]);

  useEffect(() => {
    if (!open || !userId || chatFriends.length === 0) return;
    const saved = readFriendChatSession(userId);
    const target =
      chatFriends.find((f) => f.id === selectedFriendId) ??
      chatFriends.find((f) => f.id === saved?.friendId) ??
      chatFriends[0];
    if (target && target.id !== selectedFriendId) selectFriend(target);
  }, [chatFriends, open, selectFriend, selectedFriendId, userId]);

  useEffect(() => {
    if (!connectionId || !open) return;
    void markRead(connectionId);
  }, [connectionId, messages.length, markRead, open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (!connectionId || !open) return;
    const channel = supabase
      .channel(`friend-chat-${connectionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "personal_friend_messages",
          filter: `connection_id=eq.${connectionId}`,
        },
        (payload) => {
          const row = payload.new as PersonalFriendMessageRow;
          setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
          if (row.sender_user_id !== userId) void markRead(connectionId);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [connectionId, markRead, open, userId]);

  useEffect(() => {
    if (!visible || !userId) return;
    const ids = new Set(chatFriends.map((f) => f.connection_id).filter(Boolean) as string[]);
    if (ids.size === 0) return;

    const channel = supabase
      .channel(`friend-chat-inbox-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "personal_friend_messages" },
        (payload) => {
          const row = payload.new as PersonalFriendMessageRow;
          if (!ids.has(row.connection_id) || row.sender_user_id === userId) return;
          if (open && row.connection_id === connectionId) return;
          setUnreadByConnection((prev) => ({
            ...prev,
            [row.connection_id]: (prev[row.connection_id] ?? 0) + 1,
          }));
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [chatFriends, connectionId, open, userId, visible]);

  const unreadForFriend = (friend: PersonalFriendRow) => {
    if (!friend.connection_id) return 0;
    return unreadByConnection[friend.connection_id] ?? 0;
  };

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId || !connectionId || !draft.trim()) return;
    setSending(true);
    setError(null);
    const res = await db.personal.sendFriendMessage({
      connection_id: connectionId,
      sender_user_id: userId,
      body: draft,
    });
    setSending(false);
    if (!res.data) {
      setError(res.error ?? "Unable to send message.");
      return;
    }
    setMessages((prev) => (prev.some((m) => m.id === res.data!.id) ? prev : [...prev, res.data!]));
    setDraft("");
    void markRead(connectionId);
  };

  if (!visible) return null;

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative w-12 h-12 bg-card border border-border text-primary shadow-lg flex items-center justify-center hover:bg-accent transition rounded-xl"
        aria-label={tr.friendChat}
        title={tr.friendChat}
      >
        <MessageCircle className="h-5 w-5" />
        {unreadTotal > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-money-out text-white text-[10px] font-bold flex items-center justify-center">
            !
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[60]">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label={tr.close}
            onClick={() => setOpen(false)}
          />
          <div className="absolute bottom-6 right-6 w-[min(420px,calc(100vw-2rem))] max-h-[min(640px,calc(100dvh-5rem))] rounded-2xl border border-border bg-card shadow-xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border flex items-center gap-2 shrink-0">
              <MessageCircle className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">{tr.friendChat}</p>
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground transition"
                aria-label={tr.close}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {chatFriends.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground text-center">{tr.friendChatNoActive}</div>
            ) : (
              <>
                <div className="px-3 py-2 border-b border-border flex gap-2 overflow-x-auto shrink-0">
                  {chatFriends.map((friend) => {
                    const active = friend.id === selectedFriendId;
                    const unread = unreadForFriend(friend);
                    return (
                      <button
                        key={friend.id}
                        type="button"
                        onClick={() => selectFriend(friend)}
                        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                          active
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border hover:bg-accent"
                        }`}
                      >
                        {friend.friend_name}
                        {unread > 0 ? ` (${unread})` : ""}
                      </button>
                    );
                  })}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[240px]">
                  {loadingMessages ? (
                    <p className="text-sm text-muted-foreground text-center">{tr.loading}</p>
                  ) : messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center">{tr.friendChatEmpty}</p>
                  ) : (
                    messages.map((msg) => {
                      const mine = msg.sender_user_id === userId;
                      return (
                        <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                              mine
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-muted text-foreground rounded-bl-sm"
                            }`}
                          >
                            {!mine && (
                              <p className="text-[10px] font-semibold opacity-80 mb-0.5">
                                {selectedFriend?.friend_name ?? tr.friend}
                              </p>
                            )}
                            <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                            <p className={`text-[10px] mt-1 ${mine ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                              {formatTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                <form onSubmit={handleSend} className="p-3 border-t border-border flex gap-2 shrink-0">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value.slice(0, MAX_MESSAGE_LEN))}
                    placeholder={tr.friendChatPlaceholder}
                    className="flex-1 border border-input bg-background px-3 py-2 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
                    disabled={!connectionId || sending}
                  />
                  <button
                    type="submit"
                    disabled={!connectionId || sending || !draft.trim()}
                    className="shrink-0 w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 disabled:opacity-50"
                    aria-label={tr.send}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
                {error && <p className="px-4 pb-3 text-xs text-destructive">{error}</p>}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default FriendChatWidget;
