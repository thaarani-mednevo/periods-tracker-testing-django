import { Apple, Dumbbell, Leaf, type LucideIcon } from "lucide-react";

/** Static educational copy only. Dates, logged values and AI text always come from the backend. */
export const OVULATION_COPY = {
  heading: "You're likely ovulating around now",
  description:
    "This is your estimated ovulation window. Estrogen is typically higher around ovulation and you may feel more energetic. Timing is an estimate and can shift from cycle to cycle.",
  encouragement: "You're doing great!",
  hormones: "Estrogen is typically higher around ovulation, while progesterone begins to rise afterward.",
  energyNote: "Many people feel more energetic around ovulation.",
  moodNote: "Many people feel more confident and sociable around ovulation.",
};

export const FERTILITY_COPY = {
  trying_to_conceive: {
    eyebrow: "Trying to conceive",
    heading: "You're in your ovulation phase",
    description:
      "Your body is at its most fertile around now. Estrogen is high, and you may notice clearer cervical mucus, a rise in basal body temperature and increased energy.",
    disclaimer:
      "Fertile window and ovulation dates are estimates from your logged cycles. This is general wellness information, not medical advice. If you have been trying for a while, a healthcare professional can help.",
  },
  pregnancy_prevention: {
    eyebrow: "Pregnancy prevention",
    heading: "You're around your estimated ovulation",
    description:
      "These are the days with a higher chance of pregnancy. Your cervical mucus and temperature can help you read your fertility signs.",
    disclaimer:
      "Fertility-awareness estimates are not a reliable method of contraception on their own. This is general wellness information, not medical advice.",
  },
} as const;

export const MUCUS_SCALE = ["Dry", "Sticky", "Creamy", "Watery", "Egg white"] as const;

export const WELLNESS_GROUPS: { id: string; title: string; icon: LucideIcon; tone: string; check: string; items: string[] }[] = [
  {
    id: "nutrition",
    title: "Nutrition Tips",
    icon: Apple,
    tone: "bg-[#FFE9F5] text-[#F11174]",
    check: "text-[#F0076F]",
    items: ["Include protein-rich foods", "Eat fresh fruits and vegetables", "Stay hydrated", "Try foods rich in omega-3"],
  },
  {
    id: "exercise",
    title: "Exercise Suggestions",
    icon: Dumbbell,
    tone: "bg-[#E0F3FF] text-[#007CDA]",
    check: "text-[#F0076F]",
    items: ["Try light to moderate exercise", "Walking, yoga or strength training", "Enjoy outdoor activities", "Listen to your body"],
  },
  {
    id: "wellness",
    title: "General Wellness",
    icon: Leaf,
    tone: "bg-[#DCF9E5] text-[#00983B]",
    check: "text-[#009A3C]",
    items: ["Get enough sleep", "Manage stress with relaxation", "Take time for self-care", "Stay connected with loved ones"],
  },
];