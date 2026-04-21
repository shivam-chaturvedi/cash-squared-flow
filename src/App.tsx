import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from "@/contexts/AppContext";
import LoginPage from "@/pages/LoginPage";
import OtpPage from "@/pages/OtpPage";
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

const AppContent = () => {
  const { authState, mode, booting } = useApp();

  if (booting) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (authState === "login" || authState === "signup") return <LoginPage />;
  if (authState === "signup-otp") return <OtpPage />;
  if (authState === "signup-terms") return <TermsPage />;
  if (authState === "select-type") return <AccountTypeSelect />;
  if (authState === "business-setup") return <BusinessSetupPage />;
  if (authState === "tutorial") return <TutorialPage />;

  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={mode === "business" ? <BusinessDashboard /> : <PersonalDashboard />} />
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
};

const App = () => (
  <AppProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  </AppProvider>
);

export default App;
