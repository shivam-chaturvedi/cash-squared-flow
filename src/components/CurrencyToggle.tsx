import { useApp } from "@/contexts/AppContext";
import { CURRENCY_OPTIONS } from "@/lib/money";

const CurrencyToggle = (_props: { compact?: boolean }) => {
  const { currency, setCurrency } = useApp();

  return (
    <select
      className="notranslate max-w-[190px] truncate rounded-lg border border-input bg-background px-3 py-2 text-sm sm:max-w-none"
      value={currency}
      onChange={(e) => setCurrency(e.target.value)}
      aria-label="Currency"
      translate="no"
      lang="en"
    >
      {CURRENCY_OPTIONS.map((c) => (
        <option key={c.code} value={c.code} translate="no" lang="en">
          {c.label}
        </option>
      ))}
    </select>
  );
};

export default CurrencyToggle;
