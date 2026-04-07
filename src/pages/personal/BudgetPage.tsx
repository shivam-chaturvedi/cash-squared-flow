import { FormEvent, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const initialBudgets = [
  { category: "Food", limit: 10000, spent: 8500 },
  { category: "Rent", limit: 15000, spent: 15000 },
  { category: "Travel", limit: 5000, spent: 4200 },
  { category: "Bills", limit: 8000, spent: 6800 },
  { category: "Shopping", limit: 5000, spent: 2100 },
];

type ModalMode = "add" | "edit";

const BudgetPage = () => {
  const { language } = useApp();
  const tr = t[language];
  const [budgets, setBudgets] = useState(initialBudgets);
  const [filterCategory, setFilterCategory] = useState<"all" | string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("add");
  const [modalCategory, setModalCategory] = useState("");
  const [modalLimit, setModalLimit] = useState("5000");

  const filteredBudgets = filterCategory === "all" ? budgets : budgets.filter((b) => b.category === filterCategory);
  const totalLimit = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);

  const openEditBudget = (category: string) => {
    const budget = budgets.find((b) => b.category === category);
    if (!budget) return;
    setModalMode("edit");
    setModalCategory(category);
    setModalLimit(budget.limit.toString());
    setModalOpen(true);
  };

  const openAddBudget = () => {
    setModalMode("add");
    setModalCategory("");
    setModalLimit("5000");
    setModalOpen(true);
  };

  const handleModalSubmit = (e: FormEvent) => {
    e.preventDefault();
    const limit = Number(modalLimit);
    if (Number.isNaN(limit) || limit <= 0) return;
    if (modalMode === "edit") {
      setBudgets((prev) =>
        prev.map((b) => (b.category === modalCategory ? { ...b, limit } : b)),
      );
    } else {
      const category = modalCategory.trim();
      if (!category) return;
      if (budgets.some((b) => b.category.toLowerCase() === category.toLowerCase())) return;
      setBudgets((prev) => [...prev, { category, limit, spent: 0 }]);
      setFilterCategory(category);
    }
    setModalOpen(false);
  };

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">{tr.budget}</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{tr.budgetFilterTitle}</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterCategory("all")}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${filterCategory === "all" ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground"}`}
                >
                  {tr.filterAll}
                </button>
                {budgets.map((b) => (
                  <button
                    key={b.category}
                    onClick={() => setFilterCategory(b.category)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${filterCategory === b.category ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground"}`}
                  >
                    {b.category}
                  </button>
                ))}
              </div>
              <button onClick={openAddBudget} className="text-xs font-medium text-primary underline">
                {tr.addBudgetCategory}
              </button>
            </div>
          </div>

      {/* Overall */}
      <div className="bg-card border border-border p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">{tr.monthlyBudget}</span>
          <span className="font-semibold">₹{totalSpent.toLocaleString()} / ₹{totalLimit.toLocaleString()}</span>
        </div>
        <div className="w-full h-3 bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${Math.min((totalSpent / totalLimit) * 100, 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {tr.remaining}: ₹{(totalLimit - totalSpent).toLocaleString()}
        </p>
      </div>

      {/* Per category */}
      <div className="space-y-3">
        {filteredBudgets.map((b) => {
          const pct = (b.spent / b.limit) * 100;
          const over = pct >= 100;
          return (
            <div key={b.category} className="bg-card border border-border p-4 flex flex-col gap-3">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">{b.category}</span>
                <span className={`font-semibold ${over ? "text-money-out" : ""}`}>
                  ₹{b.spent.toLocaleString()} / ₹{b.limit.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-2 bg-muted">
                <div
                  className={`h-full transition-all ${over ? "bg-money-out" : "bg-money-in"}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{over ? tr.overBudget : tr.onTrack}</span>
                <button onClick={() => openEditBudget(b.category)} className="text-primary font-semibold">
                  {tr.editBudget}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {modalMode === "add" ? tr.budgetAddTitle : `${tr.editBudget} · ${modalCategory}`}
            </DialogTitle>
            <DialogDescription>{modalMode === "add" ? tr.budgetAddDesc : tr.budgetEditDesc}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleModalSubmit} className="space-y-4">
            {modalMode === "add" && (
              <label className="text-xs font-semibold text-muted-foreground">
                {tr.newBudgetCategory}
                <input
                  value={modalCategory}
                  onChange={(e) => setModalCategory(e.target.value)}
                  className="w-full mt-1 border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder={tr.categoryPlaceholder}
                  required
                />
              </label>
            )}
            <label className="text-xs font-semibold text-muted-foreground">
              {tr.setBudgetLimit}
              <input
                type="number"
                value={modalLimit}
                onChange={(e) => setModalLimit(e.target.value)}
                className="w-full mt-1 border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="5000"
                required
                min={1}
              />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="text-xs font-semibold text-muted-foreground">
                {tr.cancel}
              </button>
              <button type="submit" className="text-xs font-semibold text-primary">
                {tr.save}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BudgetPage;
