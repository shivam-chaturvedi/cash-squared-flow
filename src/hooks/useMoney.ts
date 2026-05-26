import { useMemo } from "react";
import { useApp } from "@/contexts/AppContext";
import { formatMoney, getCurrencySymbol } from "@/lib/money";

export const useMoney = () => {
  const { currency, language } = useApp();

  return useMemo(() => {
    const locale = language;
    return {
      currency,
      locale,
      currencySymbol: getCurrencySymbol(currency, locale),
      formatMoney: (amount: number, opts?: { signDisplay?: Intl.NumberFormatOptions["signDisplay"] }) =>
        formatMoney(amount, { currency, locale, signDisplay: opts?.signDisplay }),
      formatMoneyAbs: (amount: number) => formatMoney(Math.abs(amount), { currency, locale }),
    };
  }, [currency, language]);
};

