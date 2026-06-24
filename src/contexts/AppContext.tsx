import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode, useMemo, useRef } from "react";
import { PostgrestError, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { CURRENCY_OPTIONS, detectDefaultCurrency, type CurrencyCode } from "@/lib/money";
import { getPendingSignupOtpEmail } from "@/lib/signupOtpPending";
import { GOOGLE_TRANSLATE_LANGUAGE_OPTIONS } from "@/lib/googleTranslate";
import { normalizeAccessPages } from "@/lib/businessAccessPages";
import {
  fetchBusinessEmployeeMembership,
  subscribeEmployeeAccessChanged,
} from "@/lib/employeeAccessSync";
import { normalizeEmployeeRole } from "@/lib/employeeRoles";
import type { StatsFilterPreset } from "@/lib/statsFilter";
import {
  incompleteTutorialSections,
  isTutorialCompletedForTypes,
} from "@/lib/tutorialPrefs";

export type TutorialRunMode = "onboarding" | "replay";

export type AppMode = "business" | "personal";
export type Language = "en" | "hi" | "zh-CN" | "zh-HK";
export type AuthState = "login" | "signup" | "signup-otp" | "signup-terms" | "select-type" | "business-setup" | "tutorial" | "authenticated";

export type Profile = {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  age: number | null;
  account_types: AppMode[];
  is_business: boolean;
  business_name: string | null;
  owner_name: string | null;
  roles: string[];
  invites: string[];
  accepted_terms: boolean;
  // Stored as a Google Translate language code (e.g. "en", "es", "hi", "zh-CN").
  preferred_language: string;
  notification_prefs: Record<string, unknown>;
  business_role: string;
  business_watch_roles: string[];
  business_watch_people: string[];
  employee_of_user_id: string | null;
  employee_access_pages: string[];
  created_at: string;
  updated_at: string;
};

interface AppContextType {
  booting: boolean;
  mode: AppMode;
  setMode: (m: AppMode) => void;
  accountTypes: AppMode[];
  setAccountTypes: (types: AppMode[]) => void;
  language: Language;
  setLanguage: (l: Language) => void;
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  translateLang: string;
  setTranslateLang: (l: string) => void;
  authState: AuthState;
  setAuthState: (s: AuthState) => void;
  userName: string;
  setUserName: (n: string) => void;
  userAge: string;
  setUserAge: (a: string) => void;
  userEmail: string;
  setUserEmail: (e: string) => void;
  businessName: string;
  setBusinessName: (n: string) => void;
  ownerName: string;
  setOwnerName: (n: string) => void;
  session: Session | null;
  profile: Profile | null;
  profileLoading: boolean;
  saveProfile: (fields: Partial<Profile>, userId?: string) => Promise<{ data: Profile | null; error: PostgrestError | null }>;
  logout: () => Promise<void>;
  businessUserId: string | null;
  employeeAccessPages: string[] | null;
  isEmployee: boolean;
  displayBusinessName: string | null;
  statsFilterPreset: StatsFilterPreset;
  setStatsFilterPreset: (preset: StatsFilterPreset) => void;
  tutorialRunMode: TutorialRunMode | null;
  tutorialSections: AppMode[] | null;
  beginOnboardingTutorial: (types: AppMode[], prefs: Record<string, unknown> | null | undefined) => void;
  startTutorialReplay: () => void;
  startTutorialForNewType: (type: AppMode) => void;
  endTutorialRun: () => void;
}

type StoredState = {
  mode: AppMode;
  accountTypes: AppMode[];
  language: Language;
  currency: CurrencyCode;
  translateLang: string;
  userName: string;
  userAge: string;
  userEmail: string;
  businessName: string;
  ownerName: string;
  statsFilterPreset: StatsFilterPreset;
};

const STORAGE_KEY = "cash-squared-app-state";

const readStoredState = (): StoredState | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed as StoredState;
  } catch {
    return null;
  }
};

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be within AppProvider");
  return ctx;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const stored = readStoredState();
  const supportedCurrencies = useMemo(() => new Set(CURRENCY_OPTIONS.map((c) => c.code)), []);
  const supportedTranslateLangs = useMemo(() => new Set(GOOGLE_TRANSLATE_LANGUAGE_OPTIONS.map((l) => l.value)), []);
  const [booting, setBooting] = useState(true);
  const [mode, setMode] = useState<AppMode>(stored?.mode ?? "business");
  const [accountTypes, setAccountTypes] = useState<AppMode[]>(stored?.accountTypes ?? []);
  const [language, setLanguage] = useState<Language>(stored?.language ?? "en");
  const [currency, setCurrency] = useState<CurrencyCode>(() => {
    const saved = stored?.currency;
    if (saved && supportedCurrencies.has(saved)) return saved;
    const detected = detectDefaultCurrency();
    return supportedCurrencies.has(detected) ? detected : "USD";
  });
  // Google Translate language code; defaults to English until profile loads.
  const [translateLang, setTranslateLang] = useState<string>(() => {
    const saved = stored?.translateLang;
    return saved && supportedTranslateLangs.has(saved) ? saved : "en";
  });
  const [authState, setAuthState] = useState<AuthState>("login");
  const [userName, setUserName] = useState(stored?.userName ?? "User");
  const [userAge, setUserAge] = useState(stored?.userAge ?? "");
  const [userEmail, setUserEmail] = useState(stored?.userEmail ?? "");
  const [businessName, setBusinessName] = useState(stored?.businessName ?? "");
  const [ownerName, setOwnerName] = useState(stored?.ownerName ?? "");
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const profileLoadPromiseRef = useRef<Promise<Profile | null> | null>(null);
  const [businessUserId, setBusinessUserId] = useState<string | null>(null);
  const [employeeAccessPages, setEmployeeAccessPages] = useState<string[] | null>(null);
  const [isEmployeeUser, setIsEmployeeUser] = useState(false);
  const [employerBusinessName, setEmployerBusinessName] = useState<string | null>(null);
  const [statsFilterPreset, setStatsFilterPreset] = useState<StatsFilterPreset>(stored?.statsFilterPreset ?? "month");
  const [tutorialRunMode, setTutorialRunMode] = useState<TutorialRunMode | null>(null);
  const [tutorialSections, setTutorialSections] = useState<AppMode[] | null>(null);

  const buildProfileFromSession = useMemo(() => {
    return (sessionData: Session | null) => {
      const user = sessionData?.user;
      const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
      const fallbackName =
        typeof metadata.full_name === "string"
          ? metadata.full_name
          : typeof metadata.name === "string"
            ? metadata.name
            : user?.email?.split("@")[0] ?? "User";

      const ageFromMetadata =
        metadata.age && typeof metadata.age === "number"
          ? metadata.age
          : metadata.age && !Number.isNaN(Number(metadata.age))
            ? Number(metadata.age)
            : null;

      return {
        email: user?.email ?? "",
        full_name: fallbackName,
        age: typeof ageFromMetadata === "number" ? ageFromMetadata : null,
        preferred_language: translateLang || "en",
        account_types: accountTypes.length > 0 ? accountTypes : [],
        is_business: accountTypes.includes("business"),
        roles: [],
        invites: [],
        accepted_terms: false,
        notification_prefs: {},
        business_role: "Owner",
        business_watch_roles: ["Manager"],
        business_watch_people: [],
        employee_of_user_id: null,
        employee_access_pages: [],
      } satisfies Partial<Profile>;
    };
  }, [accountTypes, translateLang]);

  const saveProfile = useCallback(async (fields: Partial<Profile>, userIdOverride?: string) => {
    const targetUserId = userIdOverride ?? session?.user?.id;
    if (!targetUserId) {
      return { data: null, error: { message: "Not authenticated." } as PostgrestError };
    }

    const payload: Partial<Profile> = {
      user_id: targetUserId,
      email: fields.email ?? session?.user?.email ?? userEmail,
      full_name: fields.full_name ?? profile?.full_name ?? userName,
      age: typeof fields.age !== "undefined" ? fields.age : profile?.age ?? (userAge ? Number(userAge) : null),
      account_types: fields.account_types ?? profile?.account_types ?? accountTypes,
      roles: fields.roles ?? profile?.roles ?? [],
      invites: fields.invites ?? profile?.invites ?? [],
      accepted_terms: typeof fields.accepted_terms !== "undefined" ? fields.accepted_terms : profile?.accepted_terms ?? false,
      is_business: typeof fields.is_business !== "undefined" ? fields.is_business : profile?.is_business ?? accountTypes.includes("business"),
      business_name: typeof fields.business_name !== "undefined" ? fields.business_name : profile?.business_name ?? null,
      owner_name: typeof fields.owner_name !== "undefined" ? fields.owner_name : profile?.owner_name ?? null,
      preferred_language:
        typeof fields.preferred_language !== "undefined"
          ? fields.preferred_language
          : profile?.preferred_language ?? translateLang ?? "en",
      ...fields,
    } as Partial<Profile>;

    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "user_id", returning: "representation" })
      .select("*")
      .maybeSingle();

    if (!error && data) {
      setProfile(data);
      setUserName(data.full_name || "User");
      setUserEmail(data.email || "");
      setUserAge(typeof data.age === "number" ? String(data.age) : "");
      setAccountTypes(Array.isArray(data.account_types) ? data.account_types : []);
      if (data.business_name) setBusinessName(data.business_name);
      if (data.owner_name) setOwnerName(data.owner_name);
      if (data.preferred_language && supportedTranslateLangs.has(data.preferred_language)) {
        setTranslateLang(data.preferred_language);
      } else if (data.preferred_language) {
        setTranslateLang("en");
      }
    }

    return { data, error };
  }, [accountTypes, profile, session, supportedTranslateLangs, translateLang, userAge, userEmail, userName]);

  const loadProfile = useCallback(
    async (userId: string, sessionData: Session | null) => {
      if (!userId) return null;
      if (profileLoadPromiseRef.current) return profileLoadPromiseRef.current;

      profileLoadPromiseRef.current = (async () => {
        setProfileLoading(true);
        try {
          const { data, error } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();

          if (error) return null;

      if (data) {
        setProfile(data);
        setUserName(data.full_name || "User");
        setUserEmail(data.email || "");
        setUserAge(typeof data.age === "number" ? String(data.age) : "");
        setAccountTypes(Array.isArray(data.account_types) ? data.account_types : []);
        if (data.business_name) setBusinessName(data.business_name);
        if (data.owner_name) setOwnerName(data.owner_name);
        if (data.preferred_language && supportedTranslateLangs.has(data.preferred_language)) {
          setTranslateLang(data.preferred_language);
        } else if (data.preferred_language) {
          setTranslateLang("en");
        }
        return data;
      }

          const metadataProfile = await saveProfile(buildProfileFromSession(sessionData), userId);
          return metadataProfile.data ?? null;
        } finally {
          setProfileLoading(false);
          profileLoadPromiseRef.current = null;
        }
      })();

      return profileLoadPromiseRef.current;
    },
    [buildProfileFromSession, saveProfile, supportedTranslateLangs],
  );

  const loadEmployerBusinessName = useCallback(async (ownerUserId: string) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("business_name")
        .eq("user_id", ownerUserId)
        .maybeSingle();
      setEmployerBusinessName(
        typeof data?.business_name === "string" && data.business_name.trim() ? data.business_name.trim() : null,
      );
    } catch {
      setEmployerBusinessName(null);
    }
  }, []);

  const resolveEmployeeContext = useCallback(
    async (sessionData: Session | null, profileHint?: Profile | null): Promise<{ isEmployee: boolean }> => {
      const email = sessionData?.user?.email;
      const currentUserId = sessionData?.user?.id;
      const profileRef = profileHint ?? profile;
      if (!email || !currentUserId) {
        setBusinessUserId(null);
        setEmployeeAccessPages(null);
        setIsEmployeeUser(false);
        setEmployerBusinessName(null);
        return { isEmployee: false };
      }

      try {
        const membership = await fetchBusinessEmployeeMembership(
          currentUserId,
          email,
          profileRef?.employee_of_user_id,
        );

        if (!membership?.user_id) {
          setBusinessUserId(currentUserId);
          setEmployeeAccessPages(null);
          setIsEmployeeUser(false);
          setEmployerBusinessName(null);
          if (profileRef?.employee_of_user_id || (profileRef?.employee_access_pages?.length ?? 0) > 0) {
            void saveProfile({ employee_of_user_id: null, employee_access_pages: [] }, currentUserId);
          }
          return { isEmployee: false };
        }

        const ownerUserId = membership.user_id;
        const pages = normalizeAccessPages(
          Array.isArray(membership.access_pages) ? membership.access_pages : [],
        );
        const employeeRole = normalizeEmployeeRole(membership.role);
        const isEmployee = ownerUserId !== currentUserId;

        if (isEmployee) {
          setBusinessUserId(ownerUserId);
          setEmployeeAccessPages(pages);
          setIsEmployeeUser(true);
          void loadEmployerBusinessName(ownerUserId);
          setMode("business");
          setAccountTypes(["business"]);

          const pagesChanged =
            JSON.stringify(pages) !== JSON.stringify(normalizeAccessPages(profileRef?.employee_access_pages ?? []));
          const roleChanged = profileRef?.business_role !== employeeRole;
          if (profileRef?.employee_of_user_id !== ownerUserId || pagesChanged || roleChanged) {
            const saved = await saveProfile(
              {
                employee_of_user_id: ownerUserId,
                employee_access_pages: pages,
                account_types: ["business"],
                business_role: employeeRole,
                roles: [employeeRole],
              },
              currentUserId,
            );
            if (saved.data) setProfile(saved.data);
          }

          if (!membership.employee_user_id) {
            void supabase
              .from("business_employees")
              .update({ employee_user_id: currentUserId })
              .eq("id", membership.id);
          }
          if (pages.length > 0 && JSON.stringify(pages) !== JSON.stringify(membership.access_pages ?? [])) {
            void supabase.from("business_employees").update({ access_pages: pages }).eq("id", membership.id);
          }
          return { isEmployee: true };
        }

        setBusinessUserId(currentUserId);
        setEmployeeAccessPages(null);
        setIsEmployeeUser(false);
        setEmployerBusinessName(null);
        if (profileRef?.employee_of_user_id || (profileRef?.employee_access_pages?.length ?? 0) > 0) {
          void saveProfile({ employee_of_user_id: null, employee_access_pages: [] }, currentUserId);
        }
        return { isEmployee: false };
      } catch {
        setBusinessUserId(currentUserId);
        setEmployeeAccessPages(null);
        setIsEmployeeUser(false);
        setEmployerBusinessName(null);
        return { isEmployee: false };
      }
    },
    [loadEmployerBusinessName, profile, saveProfile, setAccountTypes, setMode],
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setAccountTypes([]);
    setMode("business");
    setUserName("User");
    setUserEmail("");
    setUserAge("");
    setBusinessName("");
    setOwnerName("");
    setCurrency(detectDefaultCurrency());
    setTranslateLang("en");
    setAuthState("login");
    setBusinessUserId(null);
    setEmployeeAccessPages(null);
    setIsEmployeeUser(false);
    setEmployerBusinessName(null);
  }, []);

  const displayBusinessName = useMemo(() => {
    if (isEmployeeUser) return employerBusinessName;
    const fromProfile = profile?.business_name?.trim();
    if (fromProfile) return fromProfile;
    const fromState = businessName.trim();
    return fromState || null;
  }, [businessName, employerBusinessName, isEmployeeUser, profile?.business_name]);

  const getNextAuthState = (profileData: Profile | null, isEmployeeUser = false): AuthState => {
    const inOnboarding =
      authStateRef.current === "tutorial" ||
      authStateRef.current === "business-setup" ||
      authStateRef.current === "select-type";
    if (inOnboarding) return authStateRef.current;
    if (!profileData) return "select-type";
    // Show Terms only during the signup flow; once a user has used the app, never force it again.
    if (!profileData.accepted_terms) {
      const shouldPrompt =
        typeof window !== "undefined" &&
        (authStateRef.current === "signup-terms" || authStateRef.current === "signup-otp" || authStateRef.current === "signup");
      return shouldPrompt ? "signup-terms" : "authenticated";
    }
    if (isEmployeeUser || !!profileData.employee_of_user_id) return "authenticated";
    if (!Array.isArray(profileData.account_types) || profileData.account_types.length === 0) return "select-type";
    if (profileData.account_types.includes("business") && !profileData.business_name) return "business-setup";
    const types = profileData.account_types;
    if (!isTutorialCompletedForTypes(profileData.notification_prefs, types)) return "tutorial";
    return "authenticated";
  };

  const beginOnboardingTutorial = useCallback(
    (types: AppMode[], prefs: Record<string, unknown> | null | undefined) => {
      const incomplete = incompleteTutorialSections(prefs, types);
      setTutorialSections(incomplete.length > 0 ? incomplete : types);
      setTutorialRunMode("onboarding");
    },
    [],
  );

  const startTutorialReplay = useCallback(() => {
    if (accountTypes.length === 0) return;
    setTutorialSections([...accountTypes]);
    setTutorialRunMode("replay");
    setAuthState("tutorial");
  }, [accountTypes]);

  const startTutorialForNewType = useCallback(
    (type: AppMode) => {
      setTutorialSections([type]);
      setTutorialRunMode("onboarding");
      setAuthState("tutorial");
    },
    [],
  );

  const endTutorialRun = useCallback(() => {
    setTutorialRunMode(null);
    setTutorialSections(null);
    setAuthState("authenticated");
  }, []);

  const clearAuthHashFromUrl = () => {
    if (typeof window === "undefined") return;
    if (!window.location.hash) return;
    const cleanUrl = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState(null, document.title, cleanUrl);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload = {
      mode,
      accountTypes,
      language,
      currency,
      translateLang,
      userName,
      userAge,
      userEmail,
      businessName,
      ownerName,
      statsFilterPreset,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [mode, accountTypes, language, currency, translateLang, userName, userAge, userEmail, businessName, ownerName, statsFilterPreset]);

  const authStateRef = useRef<AuthState>(authState);
  const loadProfileRef = useRef(loadProfile);
  useEffect(() => {
    authStateRef.current = authState;
  }, [authState]);
  useEffect(() => {
    loadProfileRef.current = loadProfile;
  }, [loadProfile]);

  // Keep employee nav/access in sync when employer edits permissions (realtime, focus, poll).
  useEffect(() => {
    if (!session?.user?.id) return;
    if (!isEmployeeUser && !profile?.employee_of_user_id) return;

    const refresh = () => {
      void resolveEmployeeContext(session, profile);
    };

    const unsub = subscribeEmployeeAccessChanged(refresh);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    const interval = window.setInterval(refresh, 30_000);

    const channel = supabase
      .channel(`employee-access-${session.user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "business_employees",
          filter: `employee_user_id=eq.${session.user.id}`,
        },
        () => refresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          const row = payload.new as { employee_access_pages?: string[] };
          if (Array.isArray(row.employee_access_pages)) {
            setEmployeeAccessPages(normalizeAccessPages(row.employee_access_pages));
          } else {
            refresh();
          }
        },
      )
      .subscribe();

    return () => {
      unsub();
      window.removeEventListener("focus", onFocus);
      window.clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [session, isEmployeeUser, profile, profile?.employee_of_user_id, resolveEmployeeContext]);

  useEffect(() => {
    let mounted = true;
    const lastLoadedUserIdRef = { current: null as string | null };

    const init = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!mounted) return;
      setSession(currentSession);

      if (currentSession) {
        const profileData = await loadProfileRef.current(currentSession.user.id, currentSession);
        const employeeContext = await resolveEmployeeContext(currentSession, profileData);
        lastLoadedUserIdRef.current = currentSession.user.id;
        // If signup OTP is pending, do not auto-navigate away.
        const nextState = getPendingSignupOtpEmail()
          ? "signup-otp"
          : getNextAuthState(profileData, employeeContext.isEmployee);
        if (nextState === "tutorial" && profileData) {
          beginOnboardingTutorial(profileData.account_types ?? [], profileData.notification_prefs);
        }
        setAuthState(nextState);
        clearAuthHashFromUrl();
        setBooting(false);
        return;
      }

      setAuthState("login");
      setBooting(false);
    };

    void init();

    const { data } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!mounted) return;
      setSession(currentSession);
      if (currentSession) {
        if (getPendingSignupOtpEmail()) {
          setAuthState("signup-otp");
          setBooting(false);
          return;
        }

        // Avoid hammering the profiles endpoint on frequent auth events (e.g. token refresh / retries).
        const userId = currentSession.user.id;
        const shouldLoad =
          (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "USER_UPDATED") &&
          (lastLoadedUserIdRef.current !== userId || !profile);

        if (shouldLoad) {
          void loadProfileRef.current(userId, currentSession).then((profileData) => {
            if (!mounted) return;
            void resolveEmployeeContext(currentSession, profileData).then((employeeContext) => {
              if (!mounted) return;
              lastLoadedUserIdRef.current = userId;
              const nextState = getNextAuthState(profileData, employeeContext.isEmployee);
              if (nextState === "tutorial" && profileData) {
                beginOnboardingTutorial(profileData.account_types ?? [], profileData.notification_prefs);
              }
              setAuthState(nextState);
              clearAuthHashFromUrl();
              setBooting(false);
            });
          });
        }
      } else {
        setProfile(null);
        setAuthState("login");
        setUserName("User");
        setUserEmail("");
        setBooting(false);
        setBusinessUserId(null);
        setEmployeeAccessPages(null);
        setIsEmployeeUser(false);
        setEmployerBusinessName(null);
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [beginOnboardingTutorial]);

  useEffect(() => {
    if (authState !== "tutorial" || tutorialRunMode || (tutorialSections && tutorialSections.length > 0)) return;
    if (accountTypes.length === 0) return;
    beginOnboardingTutorial(accountTypes, profile?.notification_prefs);
  }, [authState, tutorialRunMode, tutorialSections, accountTypes, profile?.notification_prefs, beginOnboardingTutorial]);

  return (
    <AppContext.Provider value={{
      booting,
      mode,
      setMode,
      accountTypes,
      setAccountTypes,
      language,
      setLanguage,
      currency,
      setCurrency,
      translateLang,
      setTranslateLang,
      authState,
      setAuthState,
      userName,
      setUserName,
      userAge,
      setUserAge,
      userEmail,
      setUserEmail,
      businessName,
      setBusinessName,
      ownerName,
      setOwnerName,
      session,
      profile,
      profileLoading,
      saveProfile,
      logout,
      businessUserId: businessUserId ?? (session?.user?.id ?? null),
      employeeAccessPages,
      isEmployee: isEmployeeUser,
      displayBusinessName,
      statsFilterPreset,
      setStatsFilterPreset,
      tutorialRunMode,
      tutorialSections,
      beginOnboardingTutorial,
      startTutorialReplay,
      startTutorialForNewType,
      endTutorialRun,
    }}>
      {children}
    </AppContext.Provider>
  );
};
