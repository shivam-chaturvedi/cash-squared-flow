import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode, useMemo, useRef } from "react";
import { PostgrestError, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

export type AppMode = "business" | "personal";
export type Language = "en" | "zh-HK";
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
  preferred_language: Language;
  notification_prefs: Record<string, unknown>;
  business_role: string;
  business_watch_roles: string[];
  business_watch_people: string[];
  created_at: string;
  updated_at: string;
};

interface AppContextType {
  mode: AppMode;
  setMode: (m: AppMode) => void;
  accountTypes: AppMode[];
  setAccountTypes: (types: AppMode[]) => void;
  language: Language;
  setLanguage: (l: Language) => void;
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
}

type StoredState = {
  mode: AppMode;
  accountTypes: AppMode[];
  language: Language;
  authState: AuthState;
  userName: string;
  userAge: string;
  userEmail: string;
  businessName: string;
  ownerName: string;
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
  const [mode, setMode] = useState<AppMode>(stored?.mode ?? "business");
  const [accountTypes, setAccountTypes] = useState<AppMode[]>(stored?.accountTypes ?? []);
  const [language, setLanguage] = useState<Language>(stored?.language ?? "en");
  const [authState, setAuthState] = useState<AuthState>(stored?.authState ?? "login");
  const [userName, setUserName] = useState(stored?.userName ?? "User");
  const [userAge, setUserAge] = useState(stored?.userAge ?? "");
  const [userEmail, setUserEmail] = useState(stored?.userEmail ?? "");
  const [businessName, setBusinessName] = useState(stored?.businessName ?? "");
  const [ownerName, setOwnerName] = useState(stored?.ownerName ?? "");
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

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
        preferred_language: language,
        account_types: accountTypes.length > 0 ? accountTypes : [],
        is_business: accountTypes.includes("business"),
        roles: [],
        invites: [],
        accepted_terms: false,
        notification_prefs: {},
        business_role: "Owner",
        business_watch_roles: ["Manager"],
        business_watch_people: [],
      } satisfies Partial<Profile>;
    };
  }, [accountTypes, language]);

  const saveProfile = useCallback(async (fields: Partial<Profile>, userIdOverride?: string) => {
    const targetUserId = userIdOverride ?? session?.user?.id;
    if (!targetUserId) {
      return { data: null, error: null };
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
          : profile?.preferred_language ?? language,
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
      if (data.preferred_language) setLanguage(data.preferred_language);
    }

    return { data, error };
  }, [accountTypes, language, profile, session, userAge, userEmail, userName]);

  const loadProfile = useCallback(
    async (userId: string, sessionData: Session | null) => {
      if (!userId) return null;
      if (profileLoading) return profile;
      setProfileLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        setProfileLoading(false);
        return null;
      }

      if (data) {
        setProfile(data);
        setUserName(data.full_name || "User");
        setUserEmail(data.email || "");
        setUserAge(typeof data.age === "number" ? String(data.age) : "");
        setAccountTypes(Array.isArray(data.account_types) ? data.account_types : []);
        if (data.business_name) setBusinessName(data.business_name);
        if (data.owner_name) setOwnerName(data.owner_name);
        if (data.preferred_language) setLanguage(data.preferred_language);
        setProfileLoading(false);
        return data;
      }

      const metadataProfile = await saveProfile(buildProfileFromSession(sessionData), userId);
      setProfileLoading(false);
      return metadataProfile.data ?? null;
    },
    [buildProfileFromSession, profile, profileLoading, saveProfile],
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
    setAuthState("login");
  }, []);

  const getNextAuthState = (profileData: Profile | null): AuthState => {
    if (!profileData) return "select-type";
    if (!profileData.accepted_terms) return "signup-terms";
    if (!Array.isArray(profileData.account_types) || profileData.account_types.length === 0) return "select-type";
    if (profileData.account_types.includes("business") && !profileData.business_name) return "business-setup";
    return "authenticated";
  };

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
      authState,
      userName,
      userAge,
      userEmail,
      businessName,
      ownerName,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [mode, accountTypes, language, authState, userName, userAge, userEmail, businessName, ownerName]);

  const authStateRef = useRef<AuthState>(authState);
  const loadProfileRef = useRef(loadProfile);
  useEffect(() => {
    authStateRef.current = authState;
  }, [authState]);
  useEffect(() => {
    loadProfileRef.current = loadProfile;
  }, [loadProfile]);

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
        lastLoadedUserIdRef.current = currentSession.user.id;
        setAuthState(getNextAuthState(profileData));
        clearAuthHashFromUrl();
      }
    };

    void init();

    const { data } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!mounted) return;
      setSession(currentSession);
      if (currentSession) {
        // Avoid hammering the profiles endpoint on frequent auth events (e.g. token refresh / retries).
        const userId = currentSession.user.id;
        const shouldLoad =
          (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "USER_UPDATED") &&
          (lastLoadedUserIdRef.current !== userId || !profile);

        if (shouldLoad) {
          void loadProfileRef.current(userId, currentSession).then((profileData) => {
            if (!mounted) return;
            lastLoadedUserIdRef.current = userId;
            setAuthState(getNextAuthState(profileData));
            clearAuthHashFromUrl();
          });
        }
      } else {
        setProfile(null);
        setAuthState("login");
        setUserName("User");
        setUserEmail("");
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return (
    <AppContext.Provider value={{
      mode,
      setMode,
      accountTypes,
      setAccountTypes,
      language,
      setLanguage,
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
    }}>
      {children}
    </AppContext.Provider>
  );
};
