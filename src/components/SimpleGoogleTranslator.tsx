import { useApp } from "@/contexts/AppContext";
import { applyGoogleTranslateLanguageWithRetry, GOOGLE_TRANSLATE_LANGUAGE_OPTIONS } from "@/lib/googleTranslate";

const SimpleGoogleTranslator = () => {
  const { translateLang, setTranslateLang } = useApp();

  return (
    <div className="notranslate" translate="no" lang="en">
      <select
        value={translateLang}
        onChange={(e) => {
          const next = e.target.value;
          setTranslateLang(next);
          applyGoogleTranslateLanguageWithRetry(next);
        }}
        className="max-w-[190px] truncate rounded-lg border border-input bg-background px-3 py-2 text-sm sm:max-w-none"
        translate="no"
        lang="en"
      >
        {GOOGLE_TRANSLATE_LANGUAGE_OPTIONS.map((languageOption) => (
          <option key={languageOption.value} value={languageOption.value} translate="no" lang="en">
            {languageOption.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SimpleGoogleTranslator;
