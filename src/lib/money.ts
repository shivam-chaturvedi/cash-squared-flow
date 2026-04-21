export type CurrencyCode = string;

export const CURRENCY_OPTIONS: Array<{ code: CurrencyCode; label: string }> = [
  { code: "USD", label: "USD — US Dollar" },
  { code: "INR", label: "INR — Indian Rupee" },
  { code: "HKD", label: "HKD — Hong Kong Dollar" },
  { code: "CNY", label: "CNY — Chinese Yuan (RMB)" },
  { code: "SGD", label: "SGD — Singapore Dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "GBP", label: "GBP — British Pound" },
  { code: "JPY", label: "JPY — Japanese Yen" },
  { code: "AUD", label: "AUD — Australian Dollar" },
  { code: "CAD", label: "CAD — Canadian Dollar" },
  { code: "NZD", label: "NZD — New Zealand Dollar" },
  { code: "CHF", label: "CHF — Swiss Franc" },
  { code: "SEK", label: "SEK — Swedish Krona" },
  { code: "NOK", label: "NOK — Norwegian Krone" },
  { code: "DKK", label: "DKK — Danish Krone" },
  { code: "KRW", label: "KRW — South Korean Won" },
  { code: "THB", label: "THB — Thai Baht" },
  { code: "MYR", label: "MYR — Malaysian Ringgit" },
  { code: "IDR", label: "IDR — Indonesian Rupiah" },
  { code: "PHP", label: "PHP — Philippine Peso" },
  { code: "VND", label: "VND — Vietnamese Dong" },
  { code: "AED", label: "AED — UAE Dirham" },
  { code: "SAR", label: "SAR — Saudi Riyal" },
  { code: "QAR", label: "QAR — Qatari Riyal" },
  { code: "KWD", label: "KWD — Kuwaiti Dinar" },
  { code: "BHD", label: "BHD — Bahraini Dinar" },
  { code: "OMR", label: "OMR — Omani Rial" },
  { code: "ZAR", label: "ZAR — South African Rand" },
  { code: "BRL", label: "BRL — Brazilian Real" },
  { code: "MXN", label: "MXN — Mexican Peso" },
  { code: "TRY", label: "TRY — Turkish Lira" },
  { code: "RUB", label: "RUB — Russian Ruble" },
  { code: "PLN", label: "PLN — Polish Zloty" },
  { code: "CZK", label: "CZK — Czech Koruna" },
  { code: "HUF", label: "HUF — Hungarian Forint" },
  { code: "ILS", label: "ILS — Israeli New Shekel" },
  { code: "EGP", label: "EGP — Egyptian Pound" },
  { code: "PKR", label: "PKR — Pakistani Rupee" },
  { code: "BDT", label: "BDT — Bangladeshi Taka" },
  { code: "LKR", label: "LKR — Sri Lankan Rupee" },
];

const REGION_TO_CURRENCY: Record<string, CurrencyCode> = {
  US: "USD",
  IN: "INR",
  HK: "HKD",
  SG: "SGD",
  CN: "CNY",
  GB: "GBP",
  AU: "AUD",
  CA: "CAD",
  NZ: "NZD",
  JP: "JPY",
  KR: "KRW",
  EU: "EUR",
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

