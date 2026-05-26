import { useEffect, useRef } from "react";
import { useApp } from "@/contexts/AppContext";
import { applyGoogleTranslateLanguageWithRetry, forceEnglishOnBoot, setGoogTransCookie } from "@/lib/googleTranslate";

const SCRIPT_ID = "google-translate-script";
const ELEMENT_ID = "google_translate_element";

const GoogleTranslateLoader = () => {
  const { translateLang } = useApp();
  const initializedRef = useRef(false);

  const initTranslateElement = () => {
    if (initializedRef.current) return;
    if (!window.google?.translate?.TranslateElement) return;
    const host = document.getElementById(ELEMENT_ID);
    if (!host) return;

    initializedRef.current = true;
    // eslint-disable-next-line no-new
    new window.google.translate.TranslateElement(
      {
        pageLanguage: "en",
        autoDisplay: false,
      },
      ELEMENT_ID,
    );
  };

  const ensureTranslateScript = () => {
    if (typeof window === "undefined") return;
    if (window.google?.translate?.TranslateElement) return;
    if (document.getElementById(SCRIPT_ID)) return;

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.setAttribute("src", "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit");
    document.body.appendChild(script);
  };

  useEffect(() => {
    // Force English on initial load so we don't auto-translate on first paint.
    forceEnglishOnBoot();

    window.googleTranslateElementInit = initTranslateElement;
    if (window.google?.translate?.TranslateElement) {
      initTranslateElement();
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Keep the app clean by default: don't load Google Translate unless the user opts in.
    if (!translateLang || translateLang === "en") {
      forceEnglishOnBoot();
      if (window.google?.translate?.TranslateElement) {
        applyGoogleTranslateLanguageWithRetry("en", { maxAttempts: 12, intervalMs: 75 });
      } else {
        setGoogTransCookie("en");
      }
      return;
    }

    ensureTranslateScript();
    initTranslateElement();
    setGoogTransCookie(translateLang);
    applyGoogleTranslateLanguageWithRetry(translateLang);
  }, [translateLang]);

  return (
    <div
      id={ELEMENT_ID}
      className="notranslate"
      translate="no"
      style={{
        position: "fixed",
        left: -9999,
        top: 0,
        width: 1,
        height: 1,
        overflow: "hidden",
        opacity: 0,
        pointerEvents: "none",
      }}
    />
  );
};

export default GoogleTranslateLoader;

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate?: {
        TranslateElement?: new (
          options: {
            pageLanguage: string;
            autoDisplay: boolean;
          },
          elementId: string,
        ) => unknown;
      };
    };
  }
}
