import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { addNotification } from "@/lib/notifications";
import { toast } from "@/hooks/use-toast";
import { Plus, Users } from "lucide-react";
import { db, type PersonalFriendActivityRow, type PersonalFriendEntryRow, type PersonalFriendRow } from "@/lib/db";
import { emitDataChanged, subscribeDataChanged } from "@/lib/events";
import PageHeader from "@/components/PageHeader";
import { useMoney } from "@/hooks/useMoney";
import { balanceForUser } from "@/lib/friendBalance";
import { appWebsiteOrigin, sendMail } from "@/lib/sendMail";
import { supabase } from "@/lib/supabaseClient";
import { broadcastFriendChatSelect } from "@/lib/friendChatSession";

const FriendsPage = () => {
  const { language, session, userName } = useApp();
  const tr = t[language];
  const { formatMoney, formatMoneyAbs, currencySymbol } = useMoney();
  const userId = session?.user?.id ?? null;
  const [friends, setFriends] = useState<PersonalFriendRow[]>([]);
  const [txns, setTxns] = useState<PersonalFriendEntryRow[]>([]);
  const [activity, setActivity] = useState<PersonalFriendActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const selectedFriend = friends.find((f) => f.id === selectedFriendId) ?? null;

  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showAddTxn, setShowAddTxn] = useState(false);
  const [inviting, setInviting] = useState(false);

  const [friendName, setFriendName] = useState("");
  const [friendEmail, setFriendEmail] = useState("");

  const [direction, setDirection] = useState<"they_owe_me" | "i_owe_them">("they_owe_me");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);

  const entriesForFriend = useCallback(
    (friend: PersonalFriendRow) => {
      if (friend.connection_id) {
        return txns.filter((e) => e.connection_id === friend.connection_id);
      }
      return txns.filter((e) => e.friend_id === friend.id);
    },
    [txns],
  );

  const balances = useMemo(() => {
    const map = new Map<string, number>();
    if (!userId) return map;
    for (const friend of friends) {
      map.set(friend.id, balanceForUser(entriesForFriend(friend), userId));
    }
    return map;
  }, [entriesForFriend, friends, userId]);

  const selectedTxns = useMemo(
    () => (selectedFriend ? entriesForFriend(selectedFriend) : []),
    [entriesForFriend, selectedFriend],
  );

  const loadActivity = useCallback(async (connectionId: string | null) => {
    if (!connectionId) {
      setActivity([]);
      return;
    }
    const res = await db.personal.listFriendActivity(connectionId);
    if (res.data) setActivity(res.data);
  }, []);

  const load = useCallback(async () => {
    if (!userId) {
      setFriends([]);
      setTxns([]);
      setActivity([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [fRes, tRes] = await Promise.all([
      db.personal.listFriends(userId),
      db.personal.listFriendEntries(userId),
    ]);
    if (fRes.data) {
      setFriends(fRes.data);
      if (fRes.data.length > 0 && !selectedFriendId) setSelectedFriendId(fRes.data[0].id);
      const selected = fRes.data.find((f) => f.id === selectedFriendId) ?? fRes.data[0];
      if (selected?.connection_id) await loadActivity(selected.connection_id);
    }
    if (tRes.data) setTxns(tRes.data);
    setLoading(false);
  }, [loadActivity, selectedFriendId, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    return subscribeDataChanged(() => {
      void load();
    });
  }, [load]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`personal-friends-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "personal_friend_entries" }, () => {
        void load();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "personal_friend_activity_log" }, () => {
        if (selectedFriend?.connection_id) void loadActivity(selectedFriend.connection_id);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "personal_friend_connections" }, () => {
        void load();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load, loadActivity, selectedFriend?.connection_id, userId]);

  useEffect(() => {
    if (selectedFriend?.connection_id && selectedFriend.status !== "pending") {
      broadcastFriendChatSelect({
        connectionId: selectedFriend.connection_id,
        friendId: selectedFriend.id,
        friendName: selectedFriend.friend_name,
      });
    }
  }, [selectedFriend?.connection_id, selectedFriend?.friend_name, selectedFriend?.id, selectedFriend?.status]);

  useEffect(() => {
    if (selectedFriend?.connection_id) void loadActivity(selectedFriend.connection_id);
    else setActivity([]);
  }, [loadActivity, selectedFriend?.connection_id]);

  const openAddTxn = (friendId: string) => {
    setSelectedFriendId(friendId);
    setDirection("they_owe_me");
    setAmount("");
    setNote("");
    setDate(new Date().toISOString().split("T")[0]);
    setShowAddTxn(true);
  };

  const handleAddFriend = (e: FormEvent) => {
    e.preventDefault();
    const name = friendName.trim();
    const email = friendEmail.trim().toLowerCase();
    if (!userId || !name || !email) return;
    if (email === (session?.user?.email ?? "").toLowerCase()) {
      toast({ title: "You can't invite yourself", variant: "destructive" });
      return;
    }
    if (friends.some((f) => f.friend_email.toLowerCase() === email)) return;

    void (async () => {
      setInviting(true);
      const res = await db.personal.inviteFriend({
        inviter_user_id: userId,
        friend_name: name,
        friend_email: email,
      });
      setInviting(false);
      if (!res.data) {
        toast({ title: res.error ?? "Unable to invite friend", variant: "destructive" });
        return;
      }

      const { friend, invite, existingUserId } = res.data;
      await load();
      setSelectedFriendId(friend.id);
      setFriendName("");
      setFriendEmail("");
      setShowAddFriend(false);
      emitDataChanged();

      if (existingUserId) {
        await addNotification({
          user_id: existingUserId,
          scope: "personal",
          type: "friend_update",
          title: tr.friendAdded,
          description: `${userName} added you on Friends — track IOUs together`,
          actor: userName,
          actor_role: null,
        });
        toast({ title: tr.friendLinked, description: `${name} is on Avail — you can collaborate now` });
      } else if (invite) {
        const inviteLink = `${appWebsiteOrigin()}/friend-invite/${invite.id}`;
        const mail = await sendMail({
          to: email,
          subject: `${userName} invited you to track expenses on Avail`,
          text: `${userName} invited you to track shared debts on Avail. Open: ${inviteLink}`,
          html: `<p><strong>${userName}</strong> invited you to track shared debts on Avail.</p><p><a href="${inviteLink}">${inviteLink}</a></p>`,
        });
        toast({
          title: mail.ok ? tr.friendInviteSent : tr.friendAdded,
          description: mail.ok ? `${name} (${email})` : mail.error ?? `${name} (${email})`,
          variant: mail.ok ? "default" : "destructive",
        });
      }

      await addNotification({
        user_id: userId,
        scope: "personal",
        type: "friend_update",
        title: tr.friendAdded,
        description: `${name} (${email})`,
        actor: userName,
        actor_role: null,
      });
    })();
  };

  const handleAddTxn = (e: FormEvent) => {
    e.preventDefault();
    if (!userId || !selectedFriendId || !selectedFriend) return;
    const amt = Number(amount);
    if (Number.isNaN(amt) || amt <= 0) return;
    void (async () => {
      const res = await db.personal.addFriendEntry({
        user_id: userId,
        friend_id: selectedFriendId,
        connection_id: selectedFriend.connection_id,
        direction,
        amount: amt,
        note: note.trim(),
        entry_on: date,
      });
      if (res.data) {
        await load();
        if (selectedFriend.connection_id) await loadActivity(selectedFriend.connection_id);
        setShowAddTxn(false);
        emitDataChanged();
        const directionLabel = direction === "they_owe_me" ? tr.theyOweYou : tr.youOweThem;
        toast({ title: tr.friendUpdated, description: `${selectedFriend.friend_name}: ${directionLabel} ${formatMoney(amt)}` });

        if (selectedFriend.friend_user_id) {
          await addNotification({
            user_id: selectedFriend.friend_user_id,
            scope: "personal",
            type: "friend_update",
            title: tr.friendUpdated,
            description: `${userName}: ${directionLabel} ${formatMoney(amt)}`,
            actor: userName,
            actor_role: null,
          });
        }
      }
    })();
  };

  const renderFriendDetail = () => {
    if (!selectedFriend) return null;
    const bal = balances.get(selectedFriend.id) ?? 0;
    return (
      <div className="w-full max-w-xl p-6 animate-fade-in">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-lg">{selectedFriend.friend_name}</h3>
            <p className="text-sm text-muted-foreground">{selectedFriend.friend_email}</p>
            {selectedFriend.status === "pending" && (
              <p className="text-xs text-amber-600 mt-1">{tr.friendPending}</p>
            )}
          </div>
          <button
            onClick={() => openAddTxn(selectedFriend.id)}
            className="bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:opacity-90 transition"
          >
            {tr.addEntry}
          </button>
        </div>

        <div className="mt-4 bg-card border border-border p-4">
          <p className="text-xs text-muted-foreground">{tr.netBalance}</p>
          <p className="text-2xl font-bold">
            {formatMoneyAbs(bal)}{" "}
            <span className="text-sm font-semibold text-muted-foreground">
              {bal === 0 ? tr.settledUp : bal > 0 ? tr.theyOweYou : tr.youOweThem}
            </span>
          </p>
        </div>

        <div className="mt-4 bg-card border border-border divide-y divide-border">
          {selectedTxns.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">{tr.noEntriesYet}</div>
          ) : (
            selectedTxns.map((txn) => {
              const createdBy = txn.created_by_user_id ?? txn.user_id;
              const theyOwe = createdBy === userId
                ? txn.direction === "they_owe_me"
                : txn.direction === "i_owe_them";
              return (
                <div key={txn.id} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {theyOwe ? tr.theyOweYou : tr.youOweThem} · {formatMoney(Number(txn.amount))}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {txn.note ? `${txn.note} • ` : ""}
                      {txn.entry_on}
                    </p>
                  </div>
                  <span className={`text-sm font-semibold ${theyOwe ? "text-money-in" : "text-money-out"}`}>
                    {formatMoney(theyOwe ? Number(txn.amount) : -Number(txn.amount), { signDisplay: "always" })}
                  </span>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-4 bg-card border border-border">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold">{tr.activityLog}</p>
          </div>
          {activity.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">{tr.noActivityYet}</div>
          ) : (
            activity.map((item) => (
              <div key={item.id} className="px-4 py-3 border-b border-border last:border-b-0">
                <p className="text-sm">{item.summary}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(item.created_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col md:flex-row">
      <div className="flex-1 md:max-w-lg md:border-r border-border flex flex-col">
        <div className="px-4 py-3 border-b border-border bg-card">
          <PageHeader
            title={tr.friends}
            right={(
              <button
                onClick={() => setShowAddFriend(true)}
                className="bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium flex items-center gap-1 hover:opacity-90 transition"
              >
                <Plus className="h-4 w-4" /> {tr.addFriend}
              </button>
            )}
          />
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in text-center text-muted-foreground">
              <Users className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">Loading…</p>
            </div>
          ) : friends.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in text-center text-muted-foreground">
              <Users className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">{tr.noFriendsYet}</p>
              <p className="text-sm">{tr.addFirstFriendHint}</p>
            </div>
          ) : (
            friends.map((f) => {
              const bal = balances.get(f.id) ?? 0;
              const isSelected = selectedFriendId === f.id;
              const label = bal === 0 ? tr.settledUp : bal > 0 ? tr.theyOweYou : tr.youOweThem;
              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedFriendId(f.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 border-b border-border text-left hover:bg-accent transition ${
                    isSelected ? "bg-accent" : ""
                  }`}
                >
                  <div className="w-9 h-9 bg-primary/10 flex items-center justify-center shrink-0 text-primary font-semibold text-sm">
                    {(f.friend_name || f.friend_email || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.friend_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {f.friend_email}
                      {f.status === "pending" ? ` · ${tr.friendPending}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${bal === 0 ? "text-muted-foreground" : bal > 0 ? "text-money-in" : "text-money-out"}`}>
                      {formatMoneyAbs(bal)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="hidden md:flex flex-1 items-start justify-center bg-background overflow-auto">
        {selectedFriend ? renderFriendDetail() : (
          <div className="flex flex-1 items-center justify-center text-center text-muted-foreground min-h-[300px]">
            <div>
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">{tr.selectFriendHint}</p>
            </div>
          </div>
        )}
      </div>

      {selectedFriend && (
        <div className="md:hidden border-t border-border bg-background p-4">
          {renderFriendDetail()}
        </div>
      )}

      <Dialog open={showAddFriend} onOpenChange={setShowAddFriend}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{tr.addFriend}</DialogTitle>
            <DialogDescription>{tr.addFriendDesc}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddFriend} className="space-y-3">
            <input
              value={friendName}
              onChange={(e) => setFriendName(e.target.value)}
              placeholder={tr.friendName}
              className="w-full border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
            <input
              type="email"
              value={friendEmail}
              onChange={(e) => setFriendEmail(e.target.value)}
              placeholder={tr.friendEmail}
              className="w-full border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
            <button
              type="submit"
              disabled={inviting}
              className="w-full bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-60"
            >
              {inviting ? "Sending…" : tr.invite}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddTxn} onOpenChange={setShowAddTxn}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{tr.addEntry}</DialogTitle>
            <DialogDescription>{selectedFriend ? selectedFriend.friend_name : tr.friend}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddTxn} className="space-y-3">
            <div className="flex bg-muted p-0.5">
              <button
                type="button"
                onClick={() => setDirection("they_owe_me")}
                className={`flex-1 py-2 text-sm font-medium ${
                  direction === "they_owe_me" ? "bg-money-in text-money-in-foreground" : "text-muted-foreground"
                }`}
              >
                {tr.theyOweYou}
              </button>
              <button
                type="button"
                onClick={() => setDirection("i_owe_them")}
                className={`flex-1 py-2 text-sm font-medium ${
                  direction === "i_owe_them" ? "bg-money-out text-money-out-foreground" : "text-muted-foreground"
                }`}
              >
                {tr.youOweThem}
              </button>
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`${tr.amountPlaceholder} (${currencySymbol})`}
              className="w-full border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              required
              min={1}
            />
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={tr.noteOptional}
              className="w-full border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button type="submit" className="w-full bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:opacity-90">
              {tr.save}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FriendsPage;
