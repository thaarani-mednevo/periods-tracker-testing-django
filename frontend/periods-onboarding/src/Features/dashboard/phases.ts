import { parseISODate } from "../../lib/health";
import type { CyclePhase } from "../../services/cycle";

export type PhaseId = Exclude<CyclePhase, "unknown">;

/** Static explainer copy only. Every date and every "where am I" comes from the backend. */
export const PHASES: { id: PhaseId; label: string; blurb: string }[] = [
  { id: "menstrual", label: "Menstrual", blurb: "Your period. The uterine lining sheds. Energy can feel lower, so rest and gentle movement often help." },
  { id: "follicular", label: "Follicular", blurb: "Estrogen rises as your body prepares an egg. Many people notice energy and mood lifting." },
  { id: "ovulation", label: "Ovulation", blurb: "An egg is estimated to release around this time. These dates are estimates, not a guarantee of fertility." },
  { id: "luteal", label: "Luteal", blurb: "Progesterone rises. Some people notice PMS-type symptoms as the next period gets closer." },
];

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function fmtDate(iso?: string | null): string {
  const d = iso ? parseISODate(iso) : undefined;
  return d ? `${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCDate()}` : "—";
}