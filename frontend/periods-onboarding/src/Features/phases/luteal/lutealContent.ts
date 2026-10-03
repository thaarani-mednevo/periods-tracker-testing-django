import { Activity, Brain, type LucideIcon } from "lucide-react";

/** Static explainer copy for the luteal phase. Nothing personal lives here; all dates and values come from the backend. */
export const LUTEAL_COPY = {
  heading: "You're in your luteal phase",
  description:
    "Your body is preparing for menstruation. You may notice changes in mood, fatigue, cravings and sleep during this phase.",
  about: [
    {
      icon: Activity,
      category: "Hormonal Changes",
      title: "Progesterone is higher",
      text: "Progesterone typically rises during the luteal phase and may contribute to changes in body temperature, mood and energy.",
    },
    {
      icon: Brain,
      category: "Body & Mind",
      title: "Energy may be lower",
      text: "You may feel more tired or less energetic during this phase. Rest and balanced nutrition can help support your wellbeing.",
    },
  ] satisfies { icon: LucideIcon; category: string; title: string; text: string }[],
};