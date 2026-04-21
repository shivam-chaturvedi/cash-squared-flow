import { FormEvent, useEffect, useMemo, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { addNotification } from "@/lib/notifications";
import { toast } from "@/hooks/use-toast";
import { Plus, Users } from "lucide-react";
import { db, type PersonalFriendEntryRow, type PersonalFriendRow } from "@/lib/db";
import { subscribeDataChanged } from "@/lib/events";
import PageHeader from "@/components/PageHeader";
import { useMoney } from "@/hooks/useMoney";

const FriendsPage = () => {
  const { language, session, userName } = useApp();
  const tr = t[language];
  const { formatMoney, formatMoneyAbs, currencySymbol } = useMoney();
  const userId = session?.user?.id ?? null;
  const [friends, setFriends] = useState<PersonalFriendRow[]>([]);
  const [txns, setTxns] = useState<PersonalFriendEntryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const selectedFriend = friends.find((f) => f.id === selectedFriendId) ?? null;

  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showAddTxn, setShowAddTxn] = useState(false);

  const [friendName, setFriendName] = useState("");
  const [friendEmail, setFriendEmail] = useState("");

  const [direction, setDirection] = useState<"they_owe_me" | "i_owe_them">("they_owe_me");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);

  const balances = useMemo(() => {
    const map = new Map<string, number>();
    for (const txn of txns) {
      const sign = txn.direction === "they_owe_me" ? 1 : -1;
      map.set(txn.friend_id, (map.get(txn.friend_id) ?? 0) + sign * Number(txn.amount));
    }
    return map;
  }, [txns]);

  const selectedTxns = useMemo(() => txns.filter((t) => t.friend_id === selectedFriendId), [txns, selectedFriendId]);

  const load = async () => {
    if (!userId) {
      setFriends([]);
      setTxns([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [fRes, tRes] = await Promise.all([
      db.personal.listFriends(userId),
      db.personal.listFriendEntries(userId),
    ]);
    if (fRes.data) setFriends(fRes.data);
    if (tRes.data) setTxns(tRes.data);
    if (fRes.data && fRes.data.length > 0 && !selectedFriendId) setSelectedFriendId(fRes.data[0].id);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    return subscribeDataChanged(() => {
      void load();
    });
  }, [userId]);

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
    if (friends.some((f) => f.friend_email.toLowerCase() === email)) return;
    void (async () => {
      const res = await db.personal.addFriend({ user_id: userId, friend_name: name, friend_email: email });
      if (res.data) {
        await load();
        setSelectedFriendId(res.data.id);
        setFriendName("");
        setFriendEmail("");
        setShowAddFriend(false);
        await addNotification({
          user_id: userId,
          scope: "personal",
          type: "friend_update",
          title: tr.friendAdded,
          description: `${name} (${email})`,
          actor: userName,
          actor_role: null,
        });
        toast({ title: tr.friendAdded, description: `${name} (${email})` });
      }
    })();
  };

  const handleAddTxn = (e: FormEvent) => {
    e.preventDefault();
    if (!userId || !selectedFriendId) return;
    const amt = Number(amount);
    if (Number.isNaN(amt) || amt <= 0) return;
    void (async () => {
      const res = await db.personal.addFriendEntry({
        user_id: userId,
        friend_id: selectedFriendId,
        direction,
        amount: amt,
        note: note.trim(),
        entry_on: date,
      });
      if (res.data) {
        await load();
        setShowAddTxn(false);
        const friend = friends.find((f) => f.id === selectedFriendId);
        const who = friend?.friend_name ?? tr.friend;
        const directionLabel = direction === "they_owe_me" ? tr.theyOweYou : tr.youOweThem;
        await addNotification({
          user_id: userId,
          scope: "personal",
          type: "friend_update",
          title: tr.friendUpdated,
          description: `${who}: ${directionLabel} ${formatMoney(amt)}`,
          actor: userName,
          actor_role: null,
        });
        toast({ title: tr.friendUpdated, description: `${who}: ${directionLabel} ${formatMoney(amt)}` });
      }
    })();
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
                    <p className="text-xs text-muted-foreground truncate">{f.friend_email}</p>
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

      <div className="hidden md:flex flex-1 items-center justify-center bg-background">
        {selectedFriend ? (
          <div className="w-full max-w-xl p-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">{selectedFriend.friend_name}</h3>
                <p className="text-sm text-muted-foreground">{selectedFriend.friend_email}</p>
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
                {formatMoneyAbs(balances.get(selectedFriend.id) ?? 0)}{" "}
                <span className="text-sm font-semibold text-muted-foreground">
                  {(balances.get(selectedFriend.id) ?? 0) === 0
                    ? tr.settledUp
                    : (balances.get(selectedFriend.id) ?? 0) > 0
                      ? tr.theyOweYou
                      : tr.youOweThem}
                </span>
              </p>
            </div>

            <div className="mt-4 bg-card border border-border divide-y divide-border">
              {selectedTxns.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">{tr.noEntriesYet}</div>
              ) : (
                selectedTxns.map((txn) => (
                  <div key={txn.id} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {txn.direction === "they_owe_me" ? tr.theyOweYou : tr.youOweThem} · {formatMoney(Number(txn.amount))}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {txn.note ? `${txn.note} • ` : ""}
                        {txn.entry_on}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold ${txn.direction === "they_owe_me" ? "text-money-in" : "text-money-out"}`}>
                      {formatMoney(txn.direction === "they_owe_me" ? Number(txn.amount) : -Number(txn.amount), { signDisplay: "always" })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">{tr.selectFriendHint}</p>
          </div>
        )}
      </div>

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
            <button type="submit" className="w-full bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:opacity-90">
              {tr.invite}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddTxn} onOpenChange={setShowAddTxn}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{tr.addEntry}</DialogTitle>
            <DialogDescription>{selectedFriend ? selectedFriend.name : tr.friend}</DialogDescription>
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
