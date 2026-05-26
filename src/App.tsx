import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { useEffect } from "react";
import LandingPage from "@/pages/Index";
import LoginPage from "@/pages/LoginPage";
import OtpPage from "@/pages/OtpPage";
import InvitePage from "@/pages/InvitePage";
import TermsPage from "@/pages/TermsPage";
import AccountTypeSelect from "@/pages/AccountTypeSelect";
import BusinessSetupPage from "@/pages/BusinessSetupPage";
import TutorialPage from "@/pages/TutorialPage";
import AppLayout from "@/components/AppLayout";
import BusinessDashboard from "@/pages/business/BusinessDashboard";
import CustomersPage from "@/pages/business/CustomersPage";
import SuppliersPage from "@/pages/business/SuppliersPage";
import BusinessExpensesPage from "@/pages/business/BusinessExpensesPage";
import CashbookPage from "@/pages/business/CashbookPage";
import ReportsPage from "@/pages/business/ReportsPage";
import EmployeesPage from "@/pages/business/EmployeesPage";
import PersonalDashboard from "@/pages/personal/PersonalDashboard";
import PersonalExpensesPage from "@/pages/personal/PersonalExpensesPage";
import BudgetPage from "@/pages/personal/BudgetPage";
import InsightsPage from "@/pages/personal/InsightsPage";
import FriendsPage from "@/pages/personal/FriendsPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

// Authenticated app — BrowserRouter is now at the top level, so no inner router here.
const AuthedApp = ({ mode }: { mode: "business" | "personal" }) => (
  <AppLayout>
    <Routes>
      <Route path="/" element={mode === "business" ? <BusinessDashboard /> : <PersonalDashboard />} />
      <Route path="/invite/:id" element={<InvitePage />} />
      <Route path="/customers" element={<CustomersPage />} />
      <Route path="/suppliers" element={<SuppliersPage />} />
      <Route path="/expenses" element={mode === "business" ? <BusinessExpensesPage /> : <PersonalExpensesPage />} />
      <Route path="/cashbook" element={<CashbookPage />} />
      <Route path="/reports" element={<ReportsPage />} />
      <Route path="/employees" element={<EmployeesPage />} />
      <Route path="/budget" element={<BudgetPage />} />
      <Route path="/insights" element={<InsightsPage />} />
      <Route path="/friends" element={<FriendsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      {/* Redirect auth-only paths to dashboard when already logged in */}
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/signup" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </AppLayout>
);

const AppContent = () => {
  const { authState, mode, booting, profile, session, setAuthState } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  // If user lands directly on /signup via URL, sync authState to "signup"
  useEffect(() => {
    if (location.pathname === "/signup" && authState === "login") {
      setAuthState("signup");
    }
  }, [location.pathname, authState, setAuthState]);

  if (booting) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background text-muted-foreground">
        Loading…
      </div>
    );
  }

  // Invite link works for unauthenticated users too
  if (location.pathname.startsWith("/invite/") && (authState === "login" || authState === "signup")) {
    return <InvitePage />;
  }

  // Edge case: user refreshed mid-onboarding but already accepted terms
  if (authState === "signup-terms" && session && profile?.accepted_terms) {
    return <AuthedApp mode={mode} />;
  }

  // Intermediate auth flow steps — shown full-screen regardless of URL
  if (authState === "signup-otp") return <OtpPage />;
  if (authState === "signup-terms") return <TermsPage />;
  if (authState === "select-type") return <AccountTypeSelect />;
  if (authState === "business-setup") return <BusinessSetupPage />;
  if (authState === "tutorial") return <TutorialPage />;

  // Fully authenticated — hand off to sidebar app
  if (authState === "authenticated") {
    return <AuthedApp mode={mode} />;
  }

  // Unauthenticated (authState === "login" | "signup") — URL-driven routes
  return (
    <Routes>
      <Route
        path="/"
        element={
          <LandingPage
            onLogin={() => { setAuthState("login"); navigate("/login"); }}
            onSignup={() => { setAuthState("signup"); navigate("/signup"); }}
          />
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<LoginPage initialIsSignup />} />
      <Route path="/invite/:id" element={<InvitePage />} />
      {/* Any unknown path → landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => (
  <AppProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </AppProvider>
);

export default App;
