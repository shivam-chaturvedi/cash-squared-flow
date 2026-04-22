import { FormEvent, useEffect, useState } from "react";
import { useApp, AppMode } from "@/contexts/AppContext";
import { t, type TranslationKey } from "@/lib/translations";
import { Globe, Bell, Shield, LogOut, User, Briefcase, Check, Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { addNotification, subscribeNotifications } from "@/lib/notifications";
import { db, type AppNotificationRow, type BusinessEmployeeRow } from "@/lib/db";
import PageHeader from "@/components/PageHeader";
import TranslateLanguageSelect from "@/components/TranslateLanguageSelect";

type SettingsSection = "account" | "language" | "notifications" | "security";
type NotificationKey = "activity" | "insights" | "security";

const menuItems: { id: SettingsSection; label: string; description: string; icon: LucideIcon }[] = [
  { id: "account", label: "Account", description: "View and maintain your profile, email, and preferences.", icon: User },
  { id: "language", label: "Language", description: "Translate the UI or load translations on demand with Google Translate.", icon: Globe },
  { id: "notifications", label: "Notifications", description: "Control which alerts reach your inbox and phone.", icon: Bell },
  { id: "security", label: "Security", description: "Review sessions, passwords, and account protection tools.", icon: Shield },
];

const notificationOptions: { id: NotificationKey; labelKey: TranslationKey; hintKey: TranslationKey }[] = [
  { id: "activity", labelKey: "notificationActivity", hintKey: "notificationActivityHint" },
  { id: "insights", labelKey: "notificationInsights", hintKey: "notificationInsightsHint" },
  { id: "security", labelKey: "notificationSecurity", hintKey: "notificationSecurityHint" },
];

const initialNotificationPrefs: Record<NotificationKey, boolean> = {
  activity: true,
  insights: true,
  security: true,
};

const BUSINESS_ROLES = ["Owner", "Manager", "Accountant", "Staff"] as const;

const SettingsPage = () => {
  const {
    language,
    setAuthState,
    userName,
    accountTypes,
    setAccountTypes,
    setMode,
    userEmail,
    userAge,
    profile,
    saveProfile,
    session,
  } = useApp();
  const tr = t[language];
  const [activeSection, setActiveSection] = useState<SettingsSection>("language");
  const [notificationPrefs, setNotificationPrefs] = useState(() => ({ ...initialNotificationPrefs }));
  const [employees, setEmployees] = useState<BusinessEmployeeRow[]>([]);
  const [recent, setRecent] = useState<AppNotificationRow[]>([]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [accountError, setAccountError] = useState("");
  const [accountSaving, setAccountSaving] = useState(false);

  const toggleAccountType = async (type: AppMode) => {
    setAccountError("");
    const hasType = accountTypes.includes(type);
    if (hasType && accountTypes.length <= 1) {
      setAccountError("At least one account type must remain active.");
      return;
    }

    const nextTypes = hasType
      ? accountTypes.filter((t) => t !== type)
      : [...accountTypes, type];
    setAccountTypes(nextTypes);
    if (nextTypes.length > 0) {
      setMode(nextTypes[0]);
    }

    setAccountSaving(true);
    const { error } = await saveProfile({
      account_types: nextTypes,
      is_business: nextTypes.includes("business"),
    });
    setAccountSaving(false);
    if (error) {
      setAccountError(error.message ?? "Unable to update account types right now.");
      setAccountTypes(accountTypes);
    }
  };

  const userId = session?.user?.id ?? null;
  const profileNotif = (profile?.notification_prefs ?? {}) as Record<string, unknown>;
  const businessNotificationsEnabled = profileNotif.business_notifications_enabled !== false;
  const businessWatchRoles = profile?.business_watch_roles ?? [];
  const businessWatchPeople = profile?.business_watch_people ?? [];
  const myRole = profile?.business_role ?? "Owner";

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const [notifRes, empRes] = await Promise.all([
        db.notifications.list(userId),
        db.business.listEmployees(userId),
      ]);
      if (notifRes.data) setRecent(notifRes.data);
      if (empRes.data) setEmployees(empRes.data);
    };
    void load();
    return subscribeNotifications(() => {
      void load();
    });
  }, [userId]);

  useEffect(() => {
    const next = { ...initialNotificationPrefs };
    for (const key of Object.keys(next) as NotificationKey[]) {
      const v = profileNotif[key];
      if (typeof v === "boolean") next[key] = v;
    }
    setNotificationPrefs(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const persistNotificationPrefs = async (nextPrefs: Record<NotificationKey, boolean>) => {
    if (!userId) return;
    const next = { ...(profile?.notification_prefs ?? {}) } as Record<string, unknown>;
    next.activity = nextPrefs.activity;
    next.insights = nextPrefs.insights;
    next.security = nextPrefs.security;
    await saveProfile({ notification_prefs: next });
  };

  const persistBusinessEnabled = async (enabled: boolean) => {
    if (!userId) return;
    const next = { ...(profile?.notification_prefs ?? {}) } as Record<string, unknown>;
    next.business_notifications_enabled = enabled;
    await saveProfile({ notification_prefs: next });
  };

  const updateMyRole = async (nextRole: string) => {
    if (!userId) return;
    await saveProfile({ business_role: nextRole, roles: [nextRole] });
  };

  const toggleWatchRole = async (role: string) => {
    if (!userId) return;
    const nextRoles = businessWatchRoles.includes(role)
      ? businessWatchRoles.filter((r) => r !== role)
      : [...businessWatchRoles, role];
    await saveProfile({ business_watch_roles: nextRoles });
    await addNotification({
      user_id: userId,
      scope: "business",
      type: "prefs",
      title: tr.businessNotifications,
      description: `${tr.watchRoles}: ${nextRoles.join(", ") || "-"}`,
      actor: userName,
      actor_role: myRole,
    });
  };

  const toggleWatchPerson = async (name: string) => {
    if (!userId) return;
    const nextPeople = businessWatchPeople.includes(name)
      ? businessWatchPeople.filter((p) => p !== name)
      : [...businessWatchPeople, name];
    await saveProfile({ business_watch_people: nextPeople });
    await addNotification({
      user_id: userId,
      scope: "business",
      type: "prefs",
      title: tr.businessNotifications,
      description: `${tr.watchPeople}: ${nextPeople.join(", ") || "-"}`,
      actor: userName,
      actor_role: myRole,
    });
  };

  const handlePasswordSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // placeholder for integrating with backend; currently just clears fields.
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setStatusMessage(tr.securityUpdatedMessage);
  };

  const activeInfo = menuItems.find((item) => item.id === activeSection);

  const renderSectionDetail = () => {
    switch (activeSection) {
      case "account": {
        const displayAge = userAge || (profile?.age ? String(profile.age) : "");
        const infoItems = [
          { label: tr.name, value: userName || tr.noData },
          { label: tr.email, value: userEmail || tr.noData },
          { label: tr.age, value: displayAge || tr.noData },
          { label: tr.accountTypes, value: accountTypes.length > 0 ? accountTypes.join(", ") : tr.noData },
          { label: tr.businessName, value: profile?.business_name || tr.noData },
          { label: tr.ownerName, value: profile?.owner_name || tr.noData },
        ];

        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{tr.accountSettingDesc}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {infoItems.map((item) => (
                <div key={item.label} className="rounded-2xl border border-border bg-muted/40 p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{item.label}</p>
                  <p className="text-base font-semibold text-foreground mt-1">{item.value}</p>
                </div>
              ))}
            </div>

            {accountTypes.includes("business") && (
              <div className="rounded-2xl border border-border bg-muted/40 p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{tr.businessRole}</p>
                <p className="text-sm text-muted-foreground mt-1">{tr.businessRoleHint}</p>
                <select
                  value={myRole}
                  onChange={(e) => void updateMyRole(e.target.value)}
                  className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {BUSINESS_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        );
      }
      case "notifications":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{tr.notificationsSettingDesc}</p>
            <div className="space-y-3">
              {notificationOptions.map((option) => (
                <label key={option.id} className="flex items-center justify-between gap-4 border border-border rounded-xl px-4 py-3">
                  <div>
                    <p className="font-medium text-sm">{tr[option.labelKey]}</p>
                    <p className="text-xs text-muted-foreground">{tr[option.hintKey]}</p>
                  </div>
                  <input
                    type="checkbox"
                    aria-label={tr[option.labelKey]}
                    checked={notificationPrefs[option.id]}
                    onChange={() => {
                      const next = { ...notificationPrefs, [option.id]: !notificationPrefs[option.id] };
                      setNotificationPrefs(next);
                      void persistNotificationPrefs(next);
                    }}
                    className="h-5 w-5 accent-primary"
                  />
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">These preferences only affect notification delivery; you can always log out from the right panel.</p>

            {accountTypes.includes("business") && (
              <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{tr.businessNotifications}</p>
                    <p className="text-xs text-muted-foreground">{tr.businessNotificationsHint}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={businessNotificationsEnabled}
                    onChange={() => void persistBusinessEnabled(!businessNotificationsEnabled)}
                    className="h-5 w-5 accent-primary"
                    aria-label={tr.businessNotifications}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-background p-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{tr.watchRoles}</p>
                    <div className="mt-2 space-y-2">
                      {BUSINESS_ROLES.map((r) => (
                        <label key={r} className="flex items-center justify-between text-sm">
                          <span>{r}</span>
                          <input
                            type="checkbox"
                            checked={businessWatchRoles.includes(r)}
                            onChange={() => void toggleWatchRole(r)}
                            className="h-4 w-4 accent-primary"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{tr.watchPeople}</p>
                    <div className="mt-2 space-y-2">
                      {employees.map((e) => (
                        <label key={e.id} className="flex items-center justify-between text-sm">
                          <span>{e.name}</span>
                          <input
                            type="checkbox"
                            checked={businessWatchPeople.includes(e.name)}
                            onChange={() => void toggleWatchPerson(e.name)}
                            className="h-4 w-4 accent-primary"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-muted/40 p-4">
              <p className="text-sm font-semibold">{tr.recentAlerts}</p>
              <p className="text-xs text-muted-foreground">{tr.recentAlertsHint}</p>
              <div className="mt-3 divide-y divide-border rounded-xl border border-border bg-background">
                {recent.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground">{tr.noAlertsYet}</div>
                ) : (
                  recent.slice(0, 10).map((n) => (
                    <div key={n.id} className="p-3">
                      <p className="text-sm font-medium">{n.title}</p>
                      {n.description && <p className="text-xs text-muted-foreground mt-0.5">{n.description}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
      case "security":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{tr.securitySettingDesc}</p>
            <form onSubmit={handlePasswordSubmit} className="space-y-3 rounded-xl border border-border/70 bg-muted/40 p-4">
              <div>
                <p className="text-sm font-semibold">{tr.securityUpdateTitle}</p>
                <p className="text-xs text-muted-foreground">{tr.securityUpdateHint}</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {tr.securityCurrentPassword}
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={tr.securityCurrentPassword}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {tr.securityNewPassword}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={tr.securityNewPassword}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {tr.securityConfirmPassword}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={tr.securityConfirmPassword}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                {tr.securityUpdateButton}
              </button>
              {statusMessage && (
                <p className="text-xs text-money-in">{statusMessage}</p>
              )}
            </form>
          </div>
        );
      default:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{tr.languageSettingDesc}</p>
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-sm font-semibold">{tr.googleTranslateLabel}</p>
              <p className="mt-2 text-xs text-muted-foreground">{tr.googleTranslateHelper}</p>
              <div className="mt-3">
                <TranslateLanguageSelect fullWidth />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in max-w-6xl mx-auto">
      <PageHeader title={tr.settings} />

      <div className="grid gap-5 lg:grid-cols-[minmax(260px,320px),minmax(0,1fr)]">
        <section className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-lg font-semibold text-primary-foreground">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-base font-semibold">{userName}</p>
              <p className="text-xs text-muted-foreground">{tr.profile}</p>
            </div>
          </div>
          <div className="space-y-3">
            {menuItems.map((item) => {
              const active = item.id === activeSection;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  aria-pressed={active}
                  className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${active ? "border-primary bg-primary/5" : "border-border hover:border-primary/60 hover:bg-muted"}`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon className={`h-4 w-4 transition ${active ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${active ? "text-primary" : "text-foreground"}`}>{tr[`${item.id}Setting` as keyof typeof tr] || item.label}</p>
                    <p className="text-xs text-muted-foreground">{tr[`${item.id}SettingDesc` as keyof typeof tr] || item.description}</p>
                  </div>
                  {active && <Check className="h-4 w-4 text-primary" />}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setAuthState("login")}
            className="flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-money-out transition hover:border-money-out hover:bg-money-out/10"
          >
            <LogOut className="h-4 w-4" />
            {tr.logout}
          </button>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              {activeInfo?.icon && <activeInfo.icon className="h-4 w-4 text-primary" />}
            </div>
            <div>
              <p className="text-lg font-semibold">{activeInfo ? (tr[`${activeInfo.id}Setting` as keyof typeof tr] || activeInfo.label) : "Details"}</p>
              <p className="text-xs text-muted-foreground">{activeInfo ? (tr[`${activeInfo.id}SettingDesc` as keyof typeof tr] || activeInfo.description) : ""}</p>
            </div>
          </div>
          <hr className="my-4 border-border" />
          {renderSectionDetail()}
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold">{tr.manageAccountTypes}</h3>
        <p className="text-xs text-muted-foreground mb-3">{tr.manageAccountTypesDesc}</p>

        <div className="space-y-2">
          <button
            onClick={() => toggleAccountType("personal")}
            disabled={accountSaving}
            className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 transition ${accountTypes.includes("personal") ? "border-primary bg-primary/5" : "border-border hover:border-primary"} ${accountSaving ? "cursor-wait" : ""}`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">{tr.individual}</p>
              <p className="text-xs text-muted-foreground">{tr.individualDesc}</p>
            </div>
            {accountTypes.includes("personal") ? (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-3.5 w-3.5" />
              </div>
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-muted-foreground">
                <Plus className="h-3.5 w-3.5" />
              </div>
            )}
          </button>

          <button
            onClick={() => toggleAccountType("business")}
            disabled={accountSaving}
            className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 transition ${accountTypes.includes("business") ? "border-primary bg-primary/5" : "border-border hover:border-primary"} ${accountSaving ? "cursor-wait" : ""}`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">{tr.business}</p>
              <p className="text-xs text-muted-foreground">{tr.businessDesc}</p>
            </div>
            {accountTypes.includes("business") ? (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-3.5 w-3.5" />
              </div>
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-muted-foreground">
                <Plus className="h-3.5 w-3.5" />
              </div>
            )}
          </button>
        </div>

        {accountTypes.length <= 1 && (
          <p className="text-xs text-muted-foreground italic mt-2">You must have at least one account type active.</p>
        )}
        {accountError && (
          <p className="text-xs text-destructive mt-2">{accountError}</p>
        )}
        {accountSaving && (
          <p className="text-xs text-muted-foreground mt-1">Saving account type preferences…</p>
        )}
      </section>
    </div>
  );
};

export default SettingsPage;
