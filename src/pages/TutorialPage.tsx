import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { BookOpen, ChevronRight, ChevronLeft, LayoutDashboard, Users, Receipt, BarChart3, PiggyBank } from "lucide-react";

const businessSteps = [
  { icon: LayoutDashboard, title: "Dashboard", desc: "See your daily balance, cash flow charts, and quick action buttons at a glance." },
  { icon: Users, title: "Customers & Suppliers", desc: "Track who owes you and who you owe. Add entries with Money In / Money Out." },
  { icon: Receipt, title: "Expenses", desc: "Log every business expense. Categorize and filter to stay organized." },
  { icon: BarChart3, title: "Reports", desc: "View weekly and monthly reports of your cash flow and profit/loss." },
];

const personalSteps = [
  { icon: LayoutDashboard, title: "Dashboard", desc: "Overview of your total balance and spending breakdown by category." },
  { icon: Receipt, title: "Expenses", desc: "Track daily spending. Every coffee, bill, or purchase — log it fast." },
  { icon: PiggyBank, title: "Budget", desc: "Set monthly budgets and track your progress to stay within limits." },
  { icon: BarChart3, title: "Insights", desc: "See trends and patterns in your spending to make smarter decisions." },
];

const TutorialPage = () => {
  const { language, setAuthState, accountTypes } = useApp();
  const tr = t[language];
  const [step, setStep] = useState(0);
  const isBusiness = accountTypes.includes("business");
  const steps = isBusiness ? businessSteps : personalSteps;

  const handleFinish = () => {
    setAuthState("authenticated");
  };

  const currentStep = steps[step];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in text-center">
        <h1 className="text-xl font-bold mb-6">{tr.tutorialTitle}</h1>

        <div className="bg-card border border-border p-6 mb-4">
          <div className="w-16 h-16 bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <currentStep.icon className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-lg font-bold mb-2">{currentStep.title}</h2>
          <p className="text-muted-foreground text-base">{currentStep.desc}</p>
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-2 mb-4">
          {steps.map((_, i) => (
            <div key={i} className={`w-2.5 h-2.5 transition ${i === step ? "bg-primary" : "bg-border"}`} />
          ))}
        </div>

        <div className="flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="flex-1 border border-input py-2.5 font-medium text-base flex items-center justify-center gap-1 hover:bg-accent transition">
              <ChevronLeft className="h-4 w-4" /> {tr.back}
            </button>
          )}
          {step < steps.length - 1 ? (
            <button onClick={() => setStep(step + 1)} className="flex-1 bg-primary text-primary-foreground py-2.5 font-semibold text-base flex items-center justify-center gap-1 hover:opacity-90 transition">
              {tr.next} <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={handleFinish} className="flex-1 bg-primary text-primary-foreground py-2.5 font-semibold text-base hover:opacity-90 transition">
              {tr.tutorialDone}
            </button>
          )}
        </div>

        <button onClick={handleFinish} className="mt-3 text-sm text-muted-foreground hover:text-foreground transition">
          {tr.skipTutorial}
        </button>
      </div>
    </div>
  );
};

export default TutorialPage;
