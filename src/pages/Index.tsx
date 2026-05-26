import {
  BarChart3,
  BookOpen,
  Building2,
  ChevronRight,
  FileDown,
  Globe,
  LineChart,
  PiggyBank,
  Receipt,
  Shield,
  TrendingDown,
  TrendingUp,
  Users,
  Users2,
  Wallet,
  DollarSign,
  ArrowRightLeft,
  Bell,
  Star,
} from "lucide-react";

interface LandingPageProps {
  onLogin: () => void;
  onSignup: () => void;
}

const LandingPage = ({ onLogin, onSignup }: LandingPageProps) => {
  return (
    <div className="min-h-screen bg-background font-sans overflow-x-hidden">
      {/* ── Top accent bar ── */}
      <div className="h-1.5 w-full bg-gradient-to-r from-primary via-[hsl(145_63%_42%)] to-[#F04507]" />

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 border-b border-border bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <img
            src="/logo.png"
            alt="Cash Squared Flow"
            className="h-10 w-auto rounded-lg border-2 border-[#F04507] bg-white/40 object-contain"
          />
          <div className="flex items-center gap-3">
            <button
              onClick={onLogin}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition"
            >
              Sign In
            </button>
            <button
              onClick={onSignup}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pb-24 pt-20 text-center">
        {/* Background blobs */}
        <div className="pointer-events-none absolute -top-20 left-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 right-1/4 h-80 w-80 rounded-full bg-[hsl(145_63%_42%)]/10 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-5">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
            Business &amp; Personal Money Management
          </div>

          <h1 className="mb-5 text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Take Control of Every{" "}
            <span className="bg-gradient-to-r from-primary to-[hsl(145_63%_42%)] bg-clip-text text-transparent">
              Rupee You Earn
            </span>
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            Cash Squared Flow is the all-in-one cash management app for small
            businesses and individuals — track customers, suppliers, employees,
            expenses, budgets, and split bills with friends. All in one place.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={onSignup}
              className="flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30 hover:opacity-90 transition"
            >
              Start for Free <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={onLogin}
              className="flex items-center gap-2 rounded-xl border border-border bg-white px-7 py-3.5 text-base font-medium text-foreground hover:bg-accent transition"
            >
              Sign In to Account
            </button>
          </div>

          {/* Stats row */}
          <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Business Pages", value: "7+" },
              { label: "Personal Pages", value: "5+" },
              { label: "Export Formats", value: "PDF & Excel" },
              { label: "Languages", value: "4" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-border bg-white p-4 shadow-sm"
              >
                <p className="text-2xl font-bold text-primary">{s.value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Two modes ── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-5">
          <SectionLabel>Two Modes, One App</SectionLabel>
          <h2 className="section-title">Built for Business &amp; Personal</h2>
          <p className="section-sub">
            Switch seamlessly between business and personal modes. Your data is
            always kept separate, always in sync.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {/* Business */}
            <ModeCard
              icon={<Building2 className="h-6 w-6 text-primary" />}
              color="primary"
              title="Business Mode"
              description="Everything a small business owner needs to manage daily cash flow, customers, and team."
              features={[
                "Dashboard — daily cash snapshot",
                "Customers — give/get balances",
                "Suppliers — track payables",
                "Employees — invite & manage access",
                "Expenses — business spending log",
                "Cashbook — full transaction ledger",
                "Reports — PDF & Excel export",
              ]}
              ctaLabel="Start Business Account"
              onCta={onSignup}
            />

            {/* Personal */}
            <ModeCard
              icon={<Wallet className="h-6 w-6 text-[hsl(145_63%_42%)]" />}
              color="green"
              title="Personal Mode"
              description="Track your personal finances, set budgets, get insights, and split expenses with friends."
              features={[
                "Dashboard — monthly spending overview",
                "Expenses — log every purchase",
                "Budget — set limits per category",
                "Insights — charts & spending trends",
                "Friends — IOUs & split tracking",
              ]}
              ctaLabel="Start Personal Account"
              onCta={onSignup}
            />
          </div>
        </div>
      </section>

      {/* ── Business features deep-dive ── */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-6xl px-5">
          <SectionLabel>Business</SectionLabel>
          <h2 className="section-title">Every Tool Your Business Needs</h2>
          <p className="section-sub">
            From your first customer to your hundredth transaction — Cash Squared
            Flow keeps every number in order.
          </p>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<BarChart3 className="h-5 w-5" />}
              iconBg="bg-primary/10 text-primary"
              title="Business Dashboard"
              desc="See your real-time cash position, total money coming in and going out, and outstanding customer balances at a glance."
            />
            <FeatureCard
              icon={<Users className="h-5 w-5" />}
              iconBg="bg-blue-50 text-blue-600"
              title="Customer Management"
              desc="Track every customer balance — who owes you money and who you owe. Add transactions in seconds with the quick-add FAB."
            />
            <FeatureCard
              icon={<ArrowRightLeft className="h-5 w-5" />}
              iconBg="bg-purple-50 text-purple-600"
              title="Supplier Management"
              desc="Keep a record of all your suppliers. Track how much you owe and manage your payables effortlessly."
            />
            <FeatureCard
              icon={<Users2 className="h-5 w-5" />}
              iconBg="bg-orange-50 text-orange-600"
              title="Employee Management"
              desc="Invite employees to the app with page-level access control. Employees see only what you allow — no more, no less."
            />
            <FeatureCard
              icon={<Receipt className="h-5 w-5" />}
              iconBg="bg-red-50 text-red-600"
              title="Business Expenses"
              desc="Log all business spending by category. Filter by date range and see exactly where the money is going."
            />
            <FeatureCard
              icon={<BookOpen className="h-5 w-5" />}
              iconBg="bg-indigo-50 text-indigo-600"
              title="Cashbook Ledger"
              desc="A chronological ledger of every cash-in and cash-out entry. Your single source of truth for daily business cash flow."
            />
            <FeatureCard
              icon={<FileDown className="h-5 w-5" />}
              iconBg="bg-teal-50 text-teal-600"
              title="Reports & Export"
              desc="Generate detailed business reports and export them as PDF or Excel files — share with your accountant in one click."
            />
            <FeatureCard
              icon={<TrendingUp className="h-5 w-5" />}
              iconBg="bg-green-50 text-green-600"
              title="Cash In Tracking"
              desc="Every payment received is logged and categorized, giving you a clear picture of your daily revenue."
            />
            <FeatureCard
              icon={<TrendingDown className="h-5 w-5" />}
              iconBg="bg-rose-50 text-rose-600"
              title="Cash Out Tracking"
              desc="Track all outgoing payments and expenses in one place, so you always know your true net position."
            />
          </div>
        </div>
      </section>

      {/* ── Personal features deep-dive ── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-5">
          <SectionLabel>Personal</SectionLabel>
          <h2 className="section-title">Smart Personal Finance</h2>
          <p className="section-sub">
            Your money, your rules. Set budgets, track every expense, and finally
            know where your money goes.
          </p>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<PiggyBank className="h-5 w-5" />}
              iconBg="bg-primary/10 text-primary"
              title="Personal Dashboard"
              desc="See your monthly spending broken down by category in a beautiful pie chart. Know in seconds if you're on track."
            />
            <FeatureCard
              icon={<Receipt className="h-5 w-5" />}
              iconBg="bg-green-50 text-green-600"
              title="Expense Tracker"
              desc="Log every purchase — food, transport, entertainment — with a description and category. Filter and search with ease."
            />
            <FeatureCard
              icon={<DollarSign className="h-5 w-5" />}
              iconBg="bg-orange-50 text-orange-600"
              title="Category Budgets"
              desc="Set spending limits per category and see your actual vs. budgeted spend in real time. Never overspend again."
            />
            <FeatureCard
              icon={<LineChart className="h-5 w-5" />}
              iconBg="bg-purple-50 text-purple-600"
              title="Insights & Trends"
              desc="Visualize your spending history with interactive charts. Spot patterns and make smarter money decisions over time."
            />
            <FeatureCard
              icon={<Users className="h-5 w-5" />}
              iconBg="bg-blue-50 text-blue-600"
              title="Friends & IOUs"
              desc="Track money lent to and borrowed from friends. See exactly who owes you and who you owe — no awkward conversations needed."
            />
          </div>
        </div>
      </section>

      {/* ── All pages list ── */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-6xl px-5">
          <SectionLabel>Sitemap</SectionLabel>
          <h2 className="section-title">Every Page at a Glance</h2>
          <p className="section-sub">
            A complete overview of every screen in the app — no surprises, no hidden menus.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {/* Business pages */}
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </span>
                <h3 className="text-lg font-semibold text-foreground">Business Pages</h3>
              </div>
              <ul className="space-y-2.5">
                {[
                  { path: "/", label: "Dashboard", desc: "Cash snapshot & stats" },
                  { path: "/customers", label: "Customers", desc: "Give/get balances" },
                  { path: "/suppliers", label: "Suppliers", desc: "Payables tracking" },
                  { path: "/employees", label: "Employees", desc: "Team & access control" },
                  { path: "/expenses", label: "Expenses", desc: "Business spending log" },
                  { path: "/cashbook", label: "Cashbook", desc: "Full transaction ledger" },
                  { path: "/reports", label: "Reports", desc: "PDF & Excel export" },
                  { path: "/settings", label: "Settings", desc: "Profile, currency, language" },
                ].map((p) => (
                  <li key={p.path} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10 text-[10px] font-bold text-primary">
                      ✓
                    </span>
                    <div>
                      <span className="text-sm font-medium text-foreground">{p.label}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{p.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Personal pages */}
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(145_63%_42%)]/10">
                  <Wallet className="h-5 w-5 text-[hsl(145_63%_42%)]" />
                </span>
                <h3 className="text-lg font-semibold text-foreground">Personal Pages</h3>
              </div>
              <ul className="space-y-2.5">
                {[
                  { path: "/", label: "Dashboard", desc: "Monthly spending pie chart" },
                  { path: "/expenses", label: "Expenses", desc: "Personal spending log" },
                  { path: "/budget", label: "Budget", desc: "Per-category budget limits" },
                  { path: "/insights", label: "Insights", desc: "Charts & spending trends" },
                  { path: "/friends", label: "Friends", desc: "IOU & split tracking" },
                  { path: "/settings", label: "Settings", desc: "Profile, currency, language" },
                ].map((p) => (
                  <li key={p.path + p.label} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[hsl(145_63%_42%)]/10 text-[10px] font-bold text-[hsl(145_63%_42%)]">
                      ✓
                    </span>
                    <div>
                      <span className="text-sm font-medium text-foreground">{p.label}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{p.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Shared / auth pages */}
              <div className="mt-5 border-t border-border pt-5">
                <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Onboarding &amp; Auth
                </p>
                <ul className="space-y-2">
                  {[
                    "Login / Sign Up",
                    "Email OTP Verification",
                    "Terms of Service",
                    "Account Type Selection",
                    "Business Setup Wizard",
                    "App Tutorial",
                    "Team Invite Link",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-border" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Platform features ── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-5">
          <SectionLabel>Platform</SectionLabel>
          <h2 className="section-title">Built with the Best</h2>
          <p className="section-sub">
            Secure, fast, and works across all your devices. No installs needed.
          </p>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <PlatformCard
              icon={<Shield className="h-6 w-6 text-primary" />}
              title="Secure by Default"
              desc="Your data lives in Supabase — encrypted at rest and in transit. Email OTP verification on every signup."
            />
            <PlatformCard
              icon={<Globe className="h-6 w-6 text-primary" />}
              title="Multi-Language"
              desc="Use the app in English, Hindi, Mandarin, or Cantonese. Switch language anytime from Settings."
            />
            <PlatformCard
              icon={<DollarSign className="h-6 w-6 text-primary" />}
              title="Multi-Currency"
              desc="Choose your preferred currency and all amounts are displayed consistently throughout the app."
            />
            <PlatformCard
              icon={<Bell className="h-6 w-6 text-primary" />}
              title="Notifications"
              desc="Get alerts for important transactions, employee activity, and budget overruns."
            />
          </div>
        </div>
      </section>

      {/* ── Testimonial / social proof ── */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-[hsl(145_63%_42%)]/5 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <SectionLabel>Why Cash Squared Flow</SectionLabel>
          <h2 className="section-title">Made for Real Business Owners</h2>
          <p className="section-sub">
            Whether you run a local shop, a freelance practice, or just want to
            manage your personal wallet — we've got every screen covered.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: <TrendingUp className="h-5 w-5 text-[hsl(145_63%_42%)]" />,
                title: "Know Your Cash Position Instantly",
                desc: "The dashboard shows your net cash position in real time — no spreadsheets, no confusion.",
              },
              {
                icon: <Users className="h-5 w-5 text-primary" />,
                title: "Customers & Suppliers in One View",
                desc: "Stop juggling notebooks. Every customer and supplier balance is tracked digitally.",
              },
              {
                icon: <Star className="h-5 w-5 text-[#F04507]" />,
                title: "Switch Modes Anytime",
                desc: "You can have both a business account and a personal account under one login — and switch between them with one tap.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-border bg-white p-6 shadow-sm"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
                  {item.icon}
                </div>
                <h3 className="mb-2 text-base font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative overflow-hidden bg-primary py-24 text-center text-primary-foreground">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary via-primary to-[hsl(220_70%_35%)]" />
        <div className="pointer-events-none absolute -left-20 top-0 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 right-0 h-80 w-80 rounded-full bg-white/5 blur-3xl" />

        <div className="relative mx-auto max-w-2xl px-5">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary-foreground/70">
            Get started today
          </p>
          <h2 className="mb-5 text-4xl font-bold leading-tight">
            Your Finances, Finally Under Control
          </h2>
          <p className="mb-8 text-lg text-primary-foreground/80">
            Join thousands of business owners and individuals who use Cash Squared
            Flow to manage their money smarter.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={onSignup}
              className="flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-primary shadow-xl hover:opacity-90 transition"
            >
              Create Free Account <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={onLogin}
              className="rounded-xl border border-primary-foreground/30 px-8 py-3.5 text-base font-medium text-primary-foreground hover:bg-white/10 transition"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border bg-white py-8 text-center">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-5">
          <img
            src="/logo.png"
            alt="Cash Squared Flow"
            className="h-8 w-auto rounded-lg border border-[#F04507] bg-white/40 object-contain"
          />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Cash Squared Flow. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <button onClick={onLogin} className="hover:text-foreground transition">
              Sign In
            </button>
            <span>·</span>
            <button onClick={onSignup} className="hover:text-foreground transition">
              Sign Up Free
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

/* ─── Sub-components ─── */

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
    {children}
  </div>
);

const FeatureCard = ({
  icon,
  iconBg,
  title,
  desc,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  desc: string;
}) => (
  <div className="rounded-2xl border border-border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
    <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}>
      {icon}
    </div>
    <h3 className="mb-1.5 text-sm font-semibold text-foreground">{title}</h3>
    <p className="text-xs leading-relaxed text-muted-foreground">{desc}</p>
  </div>
);

const ModeCard = ({
  icon,
  color,
  title,
  description,
  features,
  ctaLabel,
  onCta,
}: {
  icon: React.ReactNode;
  color: "primary" | "green";
  title: string;
  description: string;
  features: string[];
  ctaLabel: string;
  onCta: () => void;
}) => {
  const accent =
    color === "primary"
      ? "border-primary/20 bg-primary/5"
      : "border-[hsl(145_63%_42%)]/20 bg-[hsl(145_63%_42%)]/5";
  const btnCls =
    color === "primary"
      ? "bg-primary text-primary-foreground"
      : "bg-[hsl(145_63%_42%)] text-white";
  const checkCls =
    color === "primary" ? "text-primary" : "text-[hsl(145_63%_42%)]";

  return (
    <div className={`rounded-2xl border p-7 ${accent}`}>
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
          {icon}
        </span>
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
      </div>
      <p className="mb-5 text-sm text-muted-foreground">{description}</p>
      <ul className="mb-6 space-y-2.5">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2.5 text-sm text-foreground">
            <svg
              className={`h-4 w-4 shrink-0 ${checkCls}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {f}
          </li>
        ))}
      </ul>
      <button
        onClick={onCta}
        className={`w-full rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 transition ${btnCls}`}
      >
        {ctaLabel}
      </button>
    </div>
  );
};

const PlatformCard = ({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) => (
  <div className="rounded-2xl border border-border bg-white p-5 text-center shadow-sm">
    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
      {icon}
    </div>
    <h3 className="mb-1.5 text-sm font-semibold text-foreground">{title}</h3>
    <p className="text-xs leading-relaxed text-muted-foreground">{desc}</p>
  </div>
);

export default LandingPage;
