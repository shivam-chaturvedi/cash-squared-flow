import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import TopAccent from "@/components/TopAccent";
import { db } from "@/lib/db";
import { clearPendingFriendInvite, setPendingFriendInvite } from "@/lib/pendingFriendInvite";
import { completeFriendInvite } from "@/lib/completeFriendInvite";
import { supabase } from "@/lib/supabaseClient";

const readInviteIdFromPath = () => {
  const parts = window.location.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("friend-invite");
  if (idx === -1) return null;
  const id = parts[idx + 1];
  return id ? decodeURIComponent(id) : null;
};

const FriendInvitePage = () => {
  const navigate = useNavigate();
  const { language, setAuthState, setUserName, setUserEmail, session, setMode, setAccountTypes, accountTypes } = useApp();
  const tr = t[language];
  const inviteId = useMemo(() => readInviteIdFromPath(), []);
  const [invite, setInvite] = useState<Awaited<ReturnType<typeof db.personal.getFriendInvite>>["data"]>(null);
  const [inviterName, setInviterName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [continuing, setContinuing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!inviteId) {
      setLoading(false);
      setError(tr.friendInviteInvalid);
      return;
    }
    const load = async () => {
      setLoading(true);
      const res = await db.personal.getFriendInvite(inviteId);
      if (res.error || !res.data) {
        setError(res.error ?? tr.friendInviteInvalid);
        setInvite(null);
        setLoading(false);
        return;
      }
      setInvite(res.data);
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name,email")
        .eq("user_id", res.data.inviter_user_id)
        .maybeSingle();
      setInviterName(profile?.full_name || profile?.email?.split("@")[0] || "Someone");
      setError(null);
      setLoading(false);
    };
    void load();
  }, [inviteId, tr.friendInviteInvalid]);

  const canContinue = !!invite && invite.status === "pending";

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <TopAccent />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="bg-card border border-border p-5 shadow-sm">
            <h1 className="text-lg font-bold text-center">{tr.friendInviteTitle}</h1>
            {loading ? (
              <p className="text-sm text-muted-foreground mt-3 text-center">{tr.loading}</p>
            ) : error ? (
              <p className="text-sm text-destructive mt-3 text-center">{error}</p>
            ) : invite ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-border bg-muted/40 p-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{tr.friendInviteFrom}</p>
                  <p className="text-sm font-semibold mt-1">{inviterName}</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/40 p-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{tr.name}</p>
                  <p className="text-sm font-semibold mt-1">{invite.invitee_name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{invite.invitee_email}</p>
                </div>
                <p className="text-xs text-muted-foreground text-center">{tr.friendInviteDesc}</p>
                <button
                  type="button"
                  disabled={!canContinue || continuing}
                  className="w-full bg-primary text-primary-foreground py-2.5 font-semibold text-base hover:opacity-90 transition disabled:opacity-60"
                  onClick={async () => {
                    if (!inviteId || !invite || continuing) return;
                    const pending = {
                      inviteId,
                      connectionId: invite.connection_id,
                      inviterUserId: invite.inviter_user_id,
                      inviteeName: invite.invitee_name,
                      inviteeEmail: invite.invitee_email,
                    };
                    if (session?.user?.id) {
                      setContinuing(true);
                      const { error: joinError } = await completeFriendInvite(
                        pending,
                        session.user.id,
                        session.user.email ?? invite.invitee_email,
                        session.user.user_metadata?.full_name as string ?? invite.invitee_name,
                      );
                      if (joinError) {
                        setError(joinError);
                        setContinuing(false);
                        return;
                      }
                      clearPendingFriendInvite();
                      setAccountTypes(accountTypes.includes("personal") ? accountTypes : [...accountTypes, "personal"]);
                      setMode("personal");
                      navigate("/friends", { replace: true });
                      setAuthState("authenticated");
                      setContinuing(false);
                      return;
                    }
                    setPendingFriendInvite(pending);
                    setUserName(invite.invitee_name);
                    setUserEmail(invite.invitee_email);
                    setAuthState("signup");
                    navigate("/signup", { replace: true });
                  }}
                >
                  {session ? tr.friendInviteContinueLoggedIn : tr.friendInviteContinue}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendInvitePage;
