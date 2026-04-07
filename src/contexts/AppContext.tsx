import React, { createContext, useContext, useState, ReactNode } from "react";

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
  const [userAge, setUserAge] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");

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
