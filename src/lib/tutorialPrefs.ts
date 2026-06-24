import type { AppMode } from "@/contexts/AppContext";

export const TUTORIAL_COMPLETED_KEY = "tutorial_completed";
export const TUTORIAL_PERSONAL_KEY = "tutorial_completed_personal";
export const TUTORIAL_BUSINESS_KEY = "tutorial_completed_business";

export type TutorialSection = AppMode;

const sectionKey = (section: TutorialSection) =>
  section === "personal" ? TUTORIAL_PERSONAL_KEY : TUTORIAL_BUSINESS_KEY;

const hasLegacyTutorialComplete = (notificationPrefs: Record<string, unknown> | null | undefined) =>
  notificationPrefs?.[TUTORIAL_COMPLETED_KEY] === true ||
  notificationPrefs?.onboarding_completed === true;

export const isSectionTutorialCompleted = (
  notificationPrefs: Record<string, unknown> | null | undefined,
  section: TutorialSection,
) => {
  if (hasLegacyTutorialComplete(notificationPrefs)) return true;
  if (!notificationPrefs) return false;
  return notificationPrefs[sectionKey(section)] === true;
};

export const incompleteTutorialSections = (
  notificationPrefs: Record<string, unknown> | null | undefined,
  accountTypes: AppMode[],
): AppMode[] => accountTypes.filter((t) => !isSectionTutorialCompleted(notificationPrefs, t));

export const isTutorialCompletedForTypes = (
  notificationPrefs: Record<string, unknown> | null | undefined,
  accountTypes: AppMode[],
) => {
  if (!accountTypes.length) return true;
  if (hasLegacyTutorialComplete(notificationPrefs)) return true;
  return accountTypes.every((t) => isSectionTutorialCompleted(notificationPrefs, t));
};

/** @deprecated Prefer isTutorialCompletedForTypes with account_types */
export const isTutorialCompleted = (
  notificationPrefs: Record<string, unknown> | null | undefined,
  accountTypes?: AppMode[],
) => {
  if (accountTypes?.length) return isTutorialCompletedForTypes(notificationPrefs, accountTypes);
  return hasLegacyTutorialComplete(notificationPrefs);
};

export const markSectionTutorialCompleted = (
  existing: Record<string, unknown> | null | undefined,
  section: TutorialSection,
): Record<string, unknown> => ({
  ...(existing ?? {}),
  [sectionKey(section)]: true,
});

export const finalizeTutorialPrefs = (
  existing: Record<string, unknown> | null | undefined,
  accountTypes: AppMode[],
  sectionJustFinished?: TutorialSection,
): Record<string, unknown> => {
  let prefs = sectionJustFinished
    ? markSectionTutorialCompleted(existing, sectionJustFinished)
    : { ...(existing ?? {}) };
  if (isTutorialCompletedForTypes(prefs, accountTypes)) {
    prefs = { ...prefs, [TUTORIAL_COMPLETED_KEY]: true };
  }
  return prefs;
};

export const tutorialCompletedPrefs = (
  existing: Record<string, unknown> | null | undefined,
  accountTypes: AppMode[] = ["personal", "business"],
): Record<string, unknown> => {
  let prefs = { ...(existing ?? {}) };
  for (const section of accountTypes) {
    prefs = markSectionTutorialCompleted(prefs, section);
  }
  prefs[TUTORIAL_COMPLETED_KEY] = true;
  return prefs;
};
