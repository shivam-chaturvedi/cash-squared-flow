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

  useEffect(() => {
    // Force English on initial load so we don't auto-translate after refresh.
    forceEnglishOnBoot();

    window.googleTranslateElementInit = initTranslateElement;

    if (window.google?.translate?.TranslateElement) {
      initTranslateElement();
      return;
    }

    if (document.getElementById(SCRIPT_ID)) return;

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.setAttribute("src", "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit");
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
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
