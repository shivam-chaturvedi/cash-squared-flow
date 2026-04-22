import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { applyGoogleTranslateLanguageWithRetry, forceEnglishOnBoot, GOOGLE_TRANSLATE_LANGUAGE_OPTIONS } from "@/lib/googleTranslate";

const TranslateLanguageSelect = ({ fullWidth }: { fullWidth?: boolean }) => {
  const { translateLang, setTranslateLang, saveProfile } = useApp();
  const [saving, setSaving] = useState(false);

  return (
    <div className="notranslate" translate="no" lang="en">
      <select
        value={translateLang}
        onChange={(e) => {
          const next = e.target.value;
          setTranslateLang(next);

          if (next === "en") {
            forceEnglishOnBoot();
          } else {
            applyGoogleTranslateLanguageWithRetry(next);
          }

          setSaving(true);
          void saveProfile({ preferred_language: next }).finally(() => setSaving(false));
        }}
        className={
          fullWidth
            ? "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            : "max-w-[190px] truncate rounded-lg border border-input bg-background px-3 py-2 text-sm sm:max-w-none"
        }
        translate="no"
        lang="en"
        disabled={saving}
      >
        {GOOGLE_TRANSLATE_LANGUAGE_OPTIONS.map((languageOption) => (
          <option key={languageOption.value} value={languageOption.value} translate="no" lang="en">
            {languageOption.label}
          </option>
        ))}
      </select>
      {fullWidth && saving && <p className="mt-2 text-xs text-muted-foreground">Saving…</p>}
    </div>
  );
};

export default TranslateLanguageSelect;

