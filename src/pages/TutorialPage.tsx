import { useCallback, useEffect, useMemo, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { ChevronRight, ChevronLeft } from "lucide-react";
import TopAccent from "@/components/TopAccent";
import { buildTutorialSteps } from "@/lib/tutorialSteps";
import { finalizeTutorialPrefs } from "@/lib/tutorialPrefs";
import type { TutorialSection } from "@/lib/tutorialSteps";

const TutorialPage = () => {
  const {
    language,
    accountTypes,
    profile,
    saveProfile,
    tutorialRunMode,
    tutorialSections,
    endTutorialRun,
  } = useApp();
  const tr = t[language];
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [completedSection, setCompletedSection] = useState<TutorialSection | null>(null);

  const sectionsForRun = tutorialSections ?? accountTypes;
  const steps = useMemo(() => buildTutorialSteps(sectionsForRun), [sectionsForRun]);
  const currentStep = steps[step];
  const isLast = step >= steps.length - 1;
  const isReplay = tutorialRunMode === "replay";
  const hasMultipleSections = sectionsForRun.length > 1;

  useEffect(() => {
    setStep(0);
    setCompletedSection(null);
  }, [sectionsForRun.join(",")]);

  const findNextSectionStart = useCallback(
    (fromIndex: number, section: TutorialSection) => {
      for (let i = fromIndex + 1; i < steps.length; i++) {
        if (steps[i].section !== section) return i;
      }
      return -1;
    },
    [steps],
  );

  const exitTutorialRun = useCallback(
    async (sectionJustFinished?: TutorialSection) => {
      if (saving) return;
      setSaving(true);
      if (tutorialRunMode === "onboarding" && sectionJustFinished) {
        await saveProfile({
          notification_prefs: finalizeTutorialPrefs(
            profile?.notification_prefs,
            accountTypes,
            sectionJustFinished,
          ),
        });
      }
      setSaving(false);
      endTutorialRun();
    },
    [accountTypes, endTutorialRun, profile?.notification_prefs, saveProfile, saving, tutorialRunMode],
  );

  useEffect(() => {
    if (steps.length === 0) void exitTutorialRun();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps.length]);

  const skipCurrentSection = async () => {
    if (!currentStep && !completedSection) return;
    const section = completedSection ?? currentStep.section;
    if (tutorialRunMode === "onboarding") {
      setSaving(true);
      await saveProfile({
        notification_prefs: finalizeTutorialPrefs(profile?.notification_prefs, accountTypes, section),
      });
      setSaving(false);
    }
    setCompletedSection(null);
    const nextIdx = findNextSectionStart(step, section);
    if (nextIdx >= 0) setStep(nextIdx);
    else endTutorialRun();
  };

  if (steps.length === 0) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background text-muted-foreground">
        Loading…
      </div>
    );
  }

  const sectionLabel = (section: TutorialSection) =>
    section === "business" ? tr.business : tr.personal;

  const skipLabel = hasMultipleSections
    ? tr.skipTutorialSection.replace("{section}", sectionLabel(completedSection ?? currentStep.section))
    : tr.skipTutorial;

  if (completedSection) {
    const nextSection = steps[step + 1]?.section;
    const completedLabel = sectionLabel(completedSection);
    const nextLabel = nextSection ? sectionLabel(nextSection) : "";

    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <TopAccent />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md animate-fade-in text-center">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-muted-foreground">
                {tr.tutorialStepOf.replace("{current}", String(step + 1)).replace("{total}", String(steps.length))}
              </p>
              <button
                type="button"
                onClick={() => void skipCurrentSection()}
                disabled={saving}
                className="text-sm text-muted-foreground hover:text-foreground transition disabled:opacity-50"
              >
                {skipLabel}
              </button>
            </div>

            <div className="bg-card border border-border p-6 mb-4">
              <h1 className="text-xl font-bold mb-3">
                {tr.tutorialSectionCompleteTitle.replace("{section}", completedLabel)}
              </h1>
              <p className="text-muted-foreground text-base">
                {nextSection
                  ? tr.tutorialSectionCompleteDesc.replace("{next}", nextLabel)
                  : tr.tutorialRewatchHint}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                void (async () => {
                  if (tutorialRunMode === "onboarding") {
                    setSaving(true);
                    await saveProfile({
                      notification_prefs: finalizeTutorialPrefs(
                        profile?.notification_prefs,
                        accountTypes,
                        completedSection,
                      ),
                    });
                    setSaving(false);
                  }
                  const nextIdx = findNextSectionStart(step, completedSection);
                  setCompletedSection(null);
                  if (nextIdx >= 0) setStep(nextIdx);
                  else endTutorialRun();
                })();
              }}
              disabled={saving}
              className="w-full bg-primary text-primary-foreground py-2.5 font-semibold text-base hover:opacity-90 transition disabled:opacity-50"
            >
              {tr.understood}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const title = tr[currentStep.titleKey as keyof typeof tr] ?? currentStep.titleKey;
  const desc = tr[currentStep.descKey as keyof typeof tr] ?? currentStep.descKey;
  const StepIcon = currentStep.icon;

  const showSectionBanner =
    step === 0 || (step > 0 && steps[step - 1].section !== currentStep.section);
  const nextStepChangesSection = !isLast && steps[step + 1]?.section !== currentStep.section;

  const handleNext = () => {
    if (nextStepChangesSection) {
      setCompletedSection(currentStep.section);
      return;
    }
    setStep(step + 1);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <TopAccent />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in text-center">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-muted-foreground">
              {isReplay ? tr.rewatchTutorial : tr.tutorialStepOf.replace("{current}", String(step + 1)).replace("{total}", String(steps.length))}
            </p>
            <button
              type="button"
              onClick={() => void skipCurrentSection()}
              disabled={saving}
              className="text-sm text-muted-foreground hover:text-foreground transition disabled:opacity-50"
            >
              {skipLabel}
            </button>
          </div>

          <h1 className="text-xl font-bold mb-2">{tr.tutorialTitle}</h1>
          {showSectionBanner && (
            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-4">
              {currentStep.section === "personal" ? tr.tutorialPersonalSection : tr.tutorialBusinessSection}
            </p>
          )}

          <div className="bg-card border border-border p-6 mb-4 text-left">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              {sectionLabel(currentStep.section)}
            </p>
            <div className="w-16 h-16 bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <StepIcon className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-lg font-bold mb-2 text-center">{title}</h2>
            <p className="text-muted-foreground text-base text-center">{desc}</p>
            <p className="text-xs text-muted-foreground text-center mt-4 pt-3 border-t border-border">
              {tr.tutorialRewatchHint}
            </p>
          </div>

          <div className="flex justify-center gap-1.5 mb-4 flex-wrap max-w-xs mx-auto">
            {steps.map((s, i) => (
              <div
                key={`${s.titleKey}-${i}`}
                className={`h-2 rounded-full transition ${
                  i === step ? "w-6 bg-primary" : "w-2 bg-border"
                } ${s.section === "business" && i > 0 && steps[i - 1]?.section === "personal" ? "ml-2" : ""}`}
              />
            ))}
          </div>

          <div className="flex gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                disabled={saving}
                className="flex-1 border border-input py-2.5 font-medium text-base flex items-center justify-center gap-1 hover:bg-accent transition disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" /> {tr.back}
              </button>
            )}
            {!isLast ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={saving}
                className="flex-1 bg-primary text-primary-foreground py-2.5 font-semibold text-base flex items-center justify-center gap-1 hover:opacity-90 transition disabled:opacity-50"
              >
                {tr.next} <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void exitTutorialRun(currentStep.section)}
                disabled={saving}
                className="flex-1 bg-primary text-primary-foreground py-2.5 font-semibold text-base hover:opacity-90 transition disabled:opacity-50"
              >
                {saving ? "Saving…" : tr.tutorialDone}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => void skipCurrentSection()}
            disabled={saving}
            className="mt-3 text-sm text-muted-foreground hover:text-foreground transition disabled:opacity-50"
          >
            {skipLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialPage;
