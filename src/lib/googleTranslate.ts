export const GOOGLE_TRANSLATE_LANGUAGE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "en", label: "English" },
  { value: "zh-CN", label: "Chinese (Simplified)" },
  { value: "zh-TW", label: "Chinese (Traditional)" },
  { value: "af", label: "Afrikaans" },
  { value: "sq", label: "Albanian" },
  { value: "ar", label: "Arabic" },
  { value: "hy", label: "Armenian" },
  { value: "az", label: "Azerbaijani" },
  { value: "eu", label: "Basque" },
  { value: "be", label: "Belarusian" },
  { value: "bn", label: "Bengali" },
  { value: "bs", label: "Bosnian" },
  { value: "bg", label: "Bulgarian" },
  { value: "ca", label: "Catalan" },
  { value: "ceb", label: "Cebuano" },
  { value: "hr", label: "Croatian" },
  { value: "cs", label: "Czech" },
  { value: "da", label: "Danish" },
  { value: "nl", label: "Dutch" },
  { value: "eo", label: "Esperanto" },
  { value: "et", label: "Estonian" },
  { value: "fi", label: "Finnish" },
  { value: "fr", label: "French" },
  { value: "gl", label: "Galician" },
  { value: "ka", label: "Georgian" },
  { value: "de", label: "German" },
  { value: "el", label: "Greek" },
  { value: "gu", label: "Gujarati" },
  { value: "ht", label: "Haitian Creole" },
  { value: "ha", label: "Hausa" },
  { value: "he", label: "Hebrew" },
  { value: "hi", label: "Hindi" },
  { value: "hmn", label: "Hmong" },
  { value: "hu", label: "Hungarian" },
  { value: "is", label: "Icelandic" },
  { value: "ig", label: "Igbo" },
  { value: "id", label: "Indonesian" },
  { value: "ga", label: "Irish" },
  { value: "it", label: "Italian" },
  { value: "ja", label: "Japanese" },
  { value: "jw", label: "Javanese" },
  { value: "kn", label: "Kannada" },
  { value: "kk", label: "Kazakh" },
  { value: "km", label: "Khmer" },
  { value: "ko", label: "Korean" },
  { value: "lo", label: "Lao" },
  { value: "la", label: "Latin" },
  { value: "lv", label: "Latvian" },
  { value: "lt", label: "Lithuanian" },
  { value: "mk", label: "Macedonian" },
  { value: "ms", label: "Malay" },
  { value: "mt", label: "Maltese" },
  { value: "mr", label: "Marathi" },
  { value: "mn", label: "Mongolian" },
  { value: "my", label: "Myanmar (Burmese)" },
  { value: "ne", label: "Nepali" },
  { value: "no", label: "Norwegian" },
  { value: "fa", label: "Persian" },
  { value: "pl", label: "Polish" },
  { value: "pt", label: "Portuguese" },
  { value: "pa", label: "Punjabi" },
  { value: "ro", label: "Romanian" },
  { value: "ru", label: "Russian" },
  { value: "sr", label: "Serbian" },
  { value: "sk", label: "Slovak" },
  { value: "sl", label: "Slovenian" },
  { value: "so", label: "Somali" },
  { value: "es", label: "Spanish" },
  { value: "sw", label: "Swahili" },
  { value: "sv", label: "Swedish" },
  { value: "ta", label: "Tamil" },
  { value: "te", label: "Telugu" },
  { value: "th", label: "Thai" },
  { value: "tr", label: "Turkish" },
  { value: "uk", label: "Ukrainian" },
  { value: "ur", label: "Urdu" },
  { value: "vi", label: "Vietnamese" },
  { value: "cy", label: "Welsh" },
  { value: "yi", label: "Yiddish" },
  { value: "yo", label: "Yoruba" },
  { value: "zu", label: "Zulu" },
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
