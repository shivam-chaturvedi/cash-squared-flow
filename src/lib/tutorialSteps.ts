import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Receipt,
  Users,
  Settings,
  BookOpen,
  UserPlus,
  BarChart3,
} from "lucide-react";
import type { AppMode } from "@/contexts/AppContext";

export type TutorialSection = AppMode;

export type TutorialStepDef = {
  section: TutorialSection;
  icon: LucideIcon;
  titleKey: string;
  descKey: string;
};

const personalSteps: TutorialStepDef[] = [
  {
    section: "personal",
    icon: LayoutDashboard,
    titleKey: "tutPersonalDash1Title",
    descKey: "tutPersonalDash1Desc",
  },
  {
    section: "personal",
    icon: LayoutDashboard,
    titleKey: "tutPersonalDash2Title",
    descKey: "tutPersonalDash2Desc",
  },
  {
    section: "personal",
    icon: Receipt,
    titleKey: "tutPersonalExpenses1Title",
    descKey: "tutPersonalExpenses1Desc",
  },
  {
    section: "personal",
    icon: Users,
    titleKey: "tutPersonalExpenses2Title",
    descKey: "tutPersonalExpenses2Desc",
  },
  {
    section: "personal",
    icon: Settings,
    titleKey: "tutPersonalSettingsTitle",
    descKey: "tutPersonalSettingsDesc",
  },
];

const businessSteps: TutorialStepDef[] = [
  {
    section: "business",
    icon: LayoutDashboard,
    titleKey: "tutBusinessDash1Title",
    descKey: "tutBusinessDash1Desc",
  },
  {
    section: "business",
    icon: LayoutDashboard,
    titleKey: "tutBusinessDash2Title",
    descKey: "tutBusinessDash2Desc",
  },
  {
    section: "business",
    icon: BookOpen,
    titleKey: "tutBusinessCashbook1Title",
    descKey: "tutBusinessCashbook1Desc",
  },
  {
    section: "business",
    icon: BookOpen,
    titleKey: "tutBusinessCashbook2Title",
    descKey: "tutBusinessCashbook2Desc",
  },
  {
    section: "business",
    icon: UserPlus,
    titleKey: "tutBusinessEmployees1Title",
    descKey: "tutBusinessEmployees1Desc",
  },
  {
    section: "business",
    icon: UserPlus,
    titleKey: "tutBusinessEmployees2Title",
    descKey: "tutBusinessEmployees2Desc",
  },
  {
    section: "business",
    icon: UserPlus,
    titleKey: "tutBusinessEmployees3Title",
    descKey: "tutBusinessEmployees3Desc",
  },
  {
    section: "business",
    icon: BarChart3,
    titleKey: "tutBusinessReportsTitle",
    descKey: "tutBusinessReportsDesc",
  },
  {
    section: "business",
    icon: Settings,
    titleKey: "tutBusinessSettingsTitle",
    descKey: "tutBusinessSettingsDesc",
  },
];

export const buildTutorialSteps = (accountTypes: AppMode[]): TutorialStepDef[] => {
  const hasPersonal = accountTypes.includes("personal");
  const hasBusiness = accountTypes.includes("business");
  const steps: TutorialStepDef[] = [];
  if (hasPersonal) steps.push(...personalSteps);
  if (hasBusiness) steps.push(...businessSteps);
  return steps;
};
