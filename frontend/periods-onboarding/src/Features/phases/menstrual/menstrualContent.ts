import { Activity, AlertCircle, Apple, Droplets, Flame, Heart, Moon, type LucideIcon } from "lucide-react";

/** Static educational copy for the menstrual phase. Nothing personal lives here; all dates come from the backend. */
export const MENSTRUAL_COPY = {
  heading: "You're likely on your period",
  description:
    "The uterine lining is shedding. Lower energy is common. Rest, stay hydrated, and be kind to yourself.",
};

export const CARE_TIPS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Moon, title: "Rest & recovery", text: "Give your body extra rest when you need it. Gentle movement and enough sleep can help you feel more comfortable." },
  { icon: Droplets, title: "Stay hydrated", text: "Drink water regularly throughout the day. Warm fluids may also feel soothing during cramps." },
  { icon: Apple, title: "Nutrition", text: "Choose balanced meals with iron-rich foods, protein, fruits, vegetables and whole grains." },
  { icon: Flame, title: "Cramp relief", text: "A warm heating pad or warm bath may help ease menstrual cramps." },
  { icon: Activity, title: "Track your symptoms", text: "Log your flow, cramps, mood and other symptoms to understand your cycle patterns." },
  { icon: AlertCircle, title: "When to seek care", text: "If pain is severe, suddenly worse than usual, or bleeding is unusually heavy, consider contacting a healthcare professional." },
];

export const WELLNESS: { icon: LucideIcon; title: string; items: string[] }[] = [
  { icon: Apple, title: "Nutrition tips", items: ["Include iron-rich foods", "Eat fresh fruits and vegetables", "Stay hydrated", "Consider foods rich in omega-3"] },
  { icon: Activity, title: "Exercise suggestions", items: ["Try light to moderate activities", "Walking or gentle yoga", "Stretching can help reduce cramps", "Listen to your body on low-energy days"] },
  { icon: Heart, title: "General wellness", items: ["Get enough rest and sleep", "Use a heating pad for cramps", "Manage stress with relaxation techniques", "Take time for self-care"] },
];