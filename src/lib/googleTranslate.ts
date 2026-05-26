export const GOOGLE_TRANSLATE_LANGUAGE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "zh-CN", label: "Mandarin" },
  { value: "zh-TW", label: "Cantonese" },
];

export const setGoogTransCookie = (lang: string) => {
  if (typeof document === "undefined") return;
  const normalized = lang || "en";
  const value = `/en/${normalized}`;
  document.cookie = `googtrans=${value};path=/;max-age=31536000`;

  if (typeof window === "undefined") return;
  const hostname = window.location.hostname;
  if (!hostname || hostname === "localhost") return;
  const domains = new Set<string>([hostname, `.${hostname}`]);
  const parts = hostname.split(".").filter(Boolean);
  if (parts.length >= 2) {
    const parent = parts.slice(-2).join(".");
    domains.add(parent);
    domains.add(`.${parent}`);
  }

  for (const domain of domains) {
    document.cookie = `googtrans=${value};path=/;domain=${domain};max-age=31536000`;
  }
};

export const clearGoogleTranslateBanner = () => {
  if (typeof document === "undefined") return;
  const bannerFrame = document.querySelector("iframe.goog-te-banner-frame");
  bannerFrame?.remove();

  const googleUi = document.getElementById("goog-gt-tt");
  googleUi?.remove();

  document.body.style.top = "0px";
  document.documentElement.style.top = "0px";
};

export const forceEnglishOnBoot = () => {
  setGoogTransCookie("en");
  clearGoogleTranslateBanner();

  // Some browsers keep the banner around briefly; nudge it again.
  if (typeof window !== "undefined") {
    window.setTimeout(() => {
      setGoogTransCookie("en");
      clearGoogleTranslateBanner();
    }, 50);
    window.setTimeout(() => {
      setGoogTransCookie("en");
      clearGoogleTranslateBanner();
    }, 300);
  }
};

export const applyGoogleTranslateLanguage = (lang: string) => {
  setGoogTransCookie(lang);
  const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");
  if (!select) return false;
  const dispatch = () => select.dispatchEvent(new Event("change", { bubbles: true }));

  // Google Translate can be flaky when switching between two non-English languages.
  // Nudging it back to English first makes the second switch much more reliable.
  if (lang !== "en" && select.value !== "en" && select.value !== lang) {
    select.value = "en";
    dispatch();
    window.setTimeout(() => {
      const latest = document.querySelector<HTMLSelectElement>(".goog-te-combo");
      if (!latest) return;
      latest.value = lang;
      latest.dispatchEvent(new Event("change", { bubbles: true }));
    }, 60);
    return true;
  }

  if (select.value !== lang) {
    select.value = lang;
    dispatch();
  } else {
    // Even if it's already selected, re-dispatch so the widget re-applies.
    dispatch();
  }

  // Extra safety: re-apply shortly after in case the widget ignored the first event.
  window.setTimeout(() => {
    const latest = document.querySelector<HTMLSelectElement>(".goog-te-combo");
    if (!latest) return;
    if (latest.value !== lang) {
      latest.value = lang;
    }
    latest.dispatchEvent(new Event("change", { bubbles: true }));
  }, 350);
  return true;
};

export const applyGoogleTranslateLanguageWithRetry = (
  lang: string,
  opts?: { maxAttempts?: number; intervalMs?: number },
) => {
  const maxAttempts = opts?.maxAttempts ?? 60;
  const intervalMs = opts?.intervalMs ?? 75;

  let attempts = 0;
  const tryApply = () => {
    attempts += 1;
    setGoogTransCookie(lang);
    const ok = applyGoogleTranslateLanguage(lang);
    if (ok) return;
    if (attempts >= maxAttempts) return;
    window.setTimeout(tryApply, intervalMs);
  };

  tryApply();
};
