import type { Journey } from "../../services/settings";

export interface JourneyOption {
  id: Journey;
  title: string;
  description: string;
  icon: "sparkles" | "heart" | "shield";
  accentGradient: string;
  iconBg: string;
  iconColor: string;
}

export const JOURNEY_OPTIONS: readonly JourneyOption[] = [
  {
    id: "cycle_tracking",
    title: "Track My Cycle",
    description: "Track your periods, cycle patterns, symptoms and menstrual health.",
    icon: "sparkles",
    accentGradient: "from-[#FF6EA8] via-[#E5469D] to-[#8B5CF6]",
    iconBg: "bg-[#FFF0F6]",
    iconColor: "text-[#F43F8F]",
  },
  {
    id: "trying_to_conceive",
    title: "Trying to Conceive",
    description: "Track your fertile window, ovulation and conception-related patterns.",
    icon: "heart",
    accentGradient: "from-[#FF6584] via-[#F43F8F] to-[#E11D48]",
    iconBg: "bg-[#FFF0F6]",
    iconColor: "text-[#F43F8F]",
  },
  {
    id: "pregnancy_prevention",
    title: "Pregnancy Prevention",
    description: "Track your cycle phases, fertile window and period predictions.",
    icon: "shield",
    accentGradient: "from-[#A855F7] via-[#8B5CF6] to-[#6366F1]",
    iconBg: "bg-[#F3E8FF]",
    iconColor: "text-[#8B5CF6]",
  },
];

export const getJourneyOption = (id: Journey): JourneyOption => JOURNEY_OPTIONS.find((j) => j.id === id) ?? JOURNEY_OPTIONS[0];