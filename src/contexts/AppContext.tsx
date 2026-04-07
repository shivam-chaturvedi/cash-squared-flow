import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type AppMode = "business" | "personal";
export type Language = "en" | "zh-HK";
export type AuthState = "login" | "signup" | "signup-otp" | "signup-terms" | "select-type" | "business-setup" | "tutorial" | "authenticated";

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

  return (
    <AppContext.Provider value={{
      mode, setMode, accountTypes, setAccountTypes, language, setLanguage,
      authState, setAuthState, userName, setUserName, userAge, setUserAge,
      userEmail, setUserEmail, businessName, setBusinessName, ownerName, setOwnerName,
    }}>
      {children}
    </AppContext.Provider>
  );
};
