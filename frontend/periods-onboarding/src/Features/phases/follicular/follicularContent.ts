import { Activity, Apple, Brain, Dumbbell, Droplets, Heart, Moon, Sprout, type LucideIcon } from "lucide-react";

/** Static educational copy for the follicular phase. Nothing personal lives here; all dates come from the backend. */
export const FOLLICULAR_COPY = {
  heading: "You're likely in your follicular phase",
  description:
    "Your body is preparing for ovulation. Estrogen is rising, so many people notice more energy and a brighter mood. A good time to build healthy habits.",
};

export const HORMONE = {
  title: "Estrogen is rising",
  text: "Estrogen steadily rises in the follicular phase while follicles mature. It can support energy, mood and focus.",
};

export const CARE_TIPS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Dumbbell, title: "Strength & cardio", text: "Energy often picks up now, so this can be a comfortable time for strength training or longer workouts." },
  { icon: Brain, title: "Focus & planning", text: "Many people feel mentally sharper in this phase. It can suit planning, learning and trying new things." },
  { icon: Apple, title: "Nutrition", text: "Choose balanced meals with protein, fresh vegetables, fruit and whole grains to support rising energy." },
  { icon: Droplets, title: "Stay hydrated", text: "Drinking water regularly also supports healthy cervical mucus as you approach your fertile window." },
  { icon: Moon, title: "Keep sleep steady", text: "A consistent sleep schedule helps your body and mood stay balanced through the cycle." },
  { icon: Sprout, title: "Start tracking early", text: "Noting basal temperature and cervical mucus now makes the fertile window easier to spot later." },
];

export const WELLNESS: { icon: LucideIcon; title: string; items: string[] }[] = [
  { icon: Apple, title: "Nutrition tips", items: ["Include lean protein and legumes", "Eat fresh fruits and vegetables", "Add whole grains and healthy fats", "Stay hydrated"] },
  { icon: Activity, title: "Exercise suggestions", items: ["Try strength training", "Cardio or brisk walking", "Group classes or new activities", "Listen to your body"] },
  { icon: Heart, title: "General wellness", items: ["Keep a regular sleep routine", "Plan social time and new goals", "Manage stress with relaxation", "Take time for self-care"] },
];