export type CurrencyCode = string;

export const CURRENCY_OPTIONS: Array<{ code: CurrencyCode; label: string }> = [
  { code: "USD", label: "USD — US Dollar" },
  { code: "GBP", label: "GBP — British Pound" },
  { code: "HKD", label: "HKD — Hong Kong Dollar" },
  { code: "INR", label: "INR — Indian Rupee" },
  { code: "SGD", label: "SGD — Singapore Dollar" },
  { code: "CNY", label: "CNY — Chinese Yuan (RMB)" },
];

const REGION_TO_CURRENCY: Record<string, CurrencyCode> = {
  US: "USD",
  IN: "INR",
  HK: "HKD",
  SG: "SGD",
  CN: "CNY",
  GB: "GBP",
};

const TIMEZONE_TO_CURRENCY: Array<{ contains: string; code: CurrencyCode }> = [
  { contains: "Kolkata", code: "INR" },
  { contains: "Hong_Kong", code: "HKD" },
  { contains: "Singapore", code: "SGD" },
  { contains: "Shanghai", code: "CNY" },
  { contains: "Chongqing", code: "CNY" },
  { contains: "Beijing", code: "CNY" },
];

const getRegionFromLocale = (locale: string): string | null => {
  const parts = locale.replace("_", "-").split("-");
  const region = parts.findLast((p) => p.length === 2)?.toUpperCase() ?? null;
  return region;
};

export const detectDefaultCurrency = (): CurrencyCode => {
  if (typeof window === "undefined") return "USD";
  const locale = navigator.language || "en-US";
  const region = getRegionFromLocale(locale);
  if (region && REGION_TO_CURRENCY[region]) return REGION_TO_CURRENCY[region];

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  const tzMatch = TIMEZONE_TO_CURRENCY.find((x) => timeZone.includes(x.contains));
  if (tzMatch) return tzMatch.code;

  return "USD";
};

export const getCurrencySymbol = (currency: CurrencyCode, locale = "en-US") => {
  try {
    const parts = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).formatToParts(0);

    return parts.find((p) => p.type === "currency")?.value ?? currency;
  } catch {
    return currency;
  }
};

export const formatMoney = (
  amount: number,
  opts: {
    currency: CurrencyCode;
    locale?: string;
    signDisplay?: Intl.NumberFormatOptions["signDisplay"];
    maximumFractionDigits?: number;
  },
) => {
  const locale = opts.locale ?? "en-US";
  const maximumFractionDigits =
    typeof opts.maximumFractionDigits === "number"
      ? opts.maximumFractionDigits
      : Number.isInteger(amount)
        ? 0
        : 2;

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: opts.currency,
      currencyDisplay: "narrowSymbol",
      signDisplay: opts.signDisplay,
      minimumFractionDigits: 0,
      maximumFractionDigits,
    }).format(amount);
  } catch {
    // Fallback if Intl doesn't like the currency code
    return `${opts.currency} ${amount.toLocaleString()}`;
  }
};
