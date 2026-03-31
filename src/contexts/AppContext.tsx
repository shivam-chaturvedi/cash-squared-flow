import React, { createContext, useContext, useState, ReactNode } from "react";

export type AppMode = "business" | "personal";
export type Language = "en" | "zh-HK";
export type AuthState = "login" | "signup" | "select-type" | "authenticated";

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
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be within AppProvider");
  return ctx;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<AppMode>("business");
  const [accountTypes, setAccountTypes] = useState<AppMode[]>([]);
  const [language, setLanguage] = useState<Language>("en");
  const [authState, setAuthState] = useState<AuthState>("login");
  const [userName, setUserName] = useState("User");

  return (
    <AppContext.Provider value={{ mode, setMode, accountTypes, setAccountTypes, language, setLanguage, authState, setAuthState, userName, setUserName }}>
      {children}
    </AppContext.Provider>
  );
};
