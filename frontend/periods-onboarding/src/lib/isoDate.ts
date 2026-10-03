/** Date-only helpers that work on "YYYY-MM-DD" strings in the user's LOCAL calendar. */
export function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toIso(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function addDays(iso: string, n: number): string {
  const d = parseIso(iso);
  d.setDate(d.getDate() + n);
  return toIso(d);
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const weekdayShort = (iso: string) => WEEKDAYS[parseIso(iso).getDay()];
export const dayOfMonth = (iso: string) => parseIso(iso).getDate();

export function longDate(iso: string): string {
  return parseIso(iso).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}
