import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import TopAccent from "@/components/TopAccent";
import { db, type BusinessEmployeeInviteRow } from "@/lib/db";
import { clearPendingInvite, setPendingInvite } from "@/lib/pendingInvite";
import { completeEmployeeInvite, employeeProfileFromInvite } from "@/lib/completeEmployeeInvite";
import { formatAccessPageLabels, normalizeAccessPages } from "@/lib/businessAccessPages";
import { normalizeEmployeeRole } from "@/lib/employeeRoles";

const readInviteIdFromPath = () => {
  const parts = window.location.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("invite");
  if (idx === -1) return null;
  const id = parts[idx + 1];
  return id ? decodeURIComponent(id) : null;
};

const InvitePage = () => {
  const navigate = useNavigate();
  const { language, setAuthState, setUserName, setUserEmail, session, saveProfile, setMode, setAccountTypes } = useApp();
  const tr = t[language];
  const [continuing, setContinuing] = useState(false);
  const inviteId = useMemo(() => readInviteIdFromPath(), []);
  const [invite, setInvite] = useState<BusinessEmployeeInviteRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!inviteId) {
      setLoading(false);
      setError(tr.inviteInvalid);
      return;
    }
    const load = async () => {
      setLoading(true);
      const res = await db.business.getEmployeeInvite(inviteId);
      if (res.error || !res.data) {
        setError(res.error ?? tr.inviteInvalid);
        setInvite(null);
      } else {
        setInvite(res.data);
        setError(null);
      }
      setLoading(false);
    };
    void load();
  }, [inviteId, tr.inviteInvalid]);

  const canContinue = !!invite && invite.status === "pending";
  const disabledReason = invite && !canContinue
    ? (invite.status === "accepted" ? tr.inviteAlreadyAccepted : tr.inviteUnavailable)
    : null;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <TopAccent />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="bg-card border border-border p-5 shadow-sm">
            <h1 className="text-lg font-bold text-center">{tr.inviteTitle}</h1>
            {loading ? (
              <p className="text-sm text-muted-foreground mt-3 text-center">{tr.loading}</p>
            ) : error ? (
              <p className="text-sm text-destructive mt-3 text-center">{error}</p>
            ) : invite ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-border bg-muted/40 p-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{tr.name}</p>
                  <p className="text-sm font-semibold mt-1">{invite.employee_name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{invite.employee_email}</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/40 p-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{tr.role}</p>
                  <p className="text-sm font-semibold mt-1">{normalizeEmployeeRole(invite.role)}</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/40 p-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{tr.giveAccessTo}</p>
                  <p className="text-sm font-semibold mt-1">{formatAccessPageLabels(invite.access_pages)}</p>
                </div>
                <button
                  type="button"
                  disabled={!canContinue || continuing}
                  title={!canContinue ? (disabledReason ?? tr.inviteUnavailable) : undefined}
                  className="w-full bg-primary text-primary-foreground py-2.5 font-semibold text-base hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={async () => {
                    if (!inviteId || !invite || continuing) return;
                    const pending = {
                      inviteId,
                      ownerUserId: invite.owner_user_id,
                      employeeName: invite.employee_name,
                      employeeEmail: invite.employee_email,
                      employeeRole: normalizeEmployeeRole(invite.role),
                      accessPages: normalizeAccessPages(invite.access_pages),
                      salary: typeof invite.salary === "number" ? invite.salary : invite.salary ? Number(invite.salary) : null,
                    };
                    if (session?.user?.id) {
                      setContinuing(true);
                      const { error: joinError } = await completeEmployeeInvite(pending, session.user.id);
                      if (joinError) {
                        setError(joinError);
                        setContinuing(false);
                        return;
                      }
                      clearPendingInvite();
                      setAccountTypes(["business"]);
                      setMode("business");
                      await saveProfile(employeeProfileFromInvite(pending), session.user.id);
                      setContinuing(false);
                      navigate("/", { replace: true });
                      setAuthState("authenticated");
                      return;
                    }
                    setPendingInvite(pending);
                    setUserName(invite.employee_name);
                    setUserEmail(invite.employee_email);
                    setAuthState("signup");
                    navigate("/signup", { replace: true });
                  }}
                >
                  {session ? tr.inviteContinueLoggedIn : tr.inviteContinue}
                </button>
                {disabledReason && (
                  <p className="text-xs text-muted-foreground text-center">{disabledReason}</p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvitePage;

