import { FormEvent, useEffect, useMemo, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import EmptyState from "@/components/EmptyState";
import { db, type PersonalBudgetRow, type PersonalExpenseRow } from "@/lib/db";
import { subscribeDataChanged } from "@/lib/events";
import PageHeader from "@/components/PageHeader";
import { Plus } from "lucide-react";

type ModalMode = "add" | "edit";

const BudgetPage = () => {
  const { language, session } = useApp();
  const tr = t[language];
  const userId = session?.user?.id ?? null;
  const [budgets, setBudgets] = useState<PersonalBudgetRow[]>([]);
  const [expenses, setExpenses] = useState<PersonalExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<"all" | string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("add");
  const [modalCategory, setModalCategory] = useState("");
  const [modalLimit, setModalLimit] = useState("5000");

  const load = async () => {
    if (!userId) {
      setBudgets([]);
      setExpenses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [budRes, expRes] = await Promise.all([
      db.personal.listBudgets(userId),
      db.personal.listExpenses(userId),
    ]);
    if (budRes.data) setBudgets(budRes.data);
    if (expRes.data) setExpenses(expRes.data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    return subscribeDataChanged(() => {
      void load();
    });
  }, [userId]);

  const monthPrefix = new Date().toISOString().slice(0, 7);
  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) {
      if (!e.spent_on.startsWith(monthPrefix)) continue;
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    }
    return map;
  }, [expenses, monthPrefix]);

  const viewBudgets = useMemo(() => {
    return budgets.map((b) => ({
      category: b.category,
      limit: b.monthly_limit,
      spent: spentByCategory.get(b.category) ?? 0,
    }));
  }, [budgets, spentByCategory]);

  const filteredBudgets = filterCategory === "all" ? viewBudgets : viewBudgets.filter((b) => b.category === filterCategory);
  const totalLimit = viewBudgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = viewBudgets.reduce((s, b) => s + b.spent, 0);

  const openEditBudget = (category: string) => {
    const budget = viewBudgets.find((b) => b.category === category);
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

  const handleModalSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const limit = Number(modalLimit);
    if (Number.isNaN(limit) || limit <= 0) return;
    if (!userId) return;
    const category = modalMode === "edit" ? modalCategory : modalCategory.trim();
    if (!category) return;
    await db.personal.upsertBudget({ user_id: userId, category, monthly_limit: limit });
    await load();
    setFilterCategory(category);
    setModalOpen(false);
  };

  const titleCase = (value: string) =>
    value
      .split(" ")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <PageHeader
        title={tr.budget}
        right={(
          <button
            onClick={openAddBudget}
            className="bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition"
          >
            <Plus className="h-4 w-4" /> {tr.addBudgetCategory}
          </button>
        )}
        below={(
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">{tr.budgetFilterTitle}</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterCategory("all")}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${filterCategory === "all" ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground"}`}
              >
                {tr.budgetAllCategories}
              </button>
              {budgets.map((b) => (
                <button
                  key={b.category}
                  onClick={() => setFilterCategory(b.category)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${filterCategory === b.category ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground"}`}
                >
                  {titleCase(b.category)}
                </button>
              ))}
            </div>
          </div>
        )}
      />

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
        {loading ? (
          <EmptyState title="Loading…" subtitle="" />
        ) : filteredBudgets.length === 0 ? (
          <EmptyState title={tr.noData} subtitle={tr.addFirst} />
        ) : filteredBudgets.map((b) => {
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
