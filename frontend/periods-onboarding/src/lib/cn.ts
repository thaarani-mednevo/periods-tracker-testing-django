/** Tiny className joiner — filters out falsy values. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** Shared Tailwind class patterns used across components. */
export const ui = {
  label: "text-body-sm font-semibold text-ink-label",
  helper: "text-body-sm leading-snug text-ink-muted",
  sectionTitle: "text-body-sm font-semibold uppercase tracking-[0.12em] text-ink-small",
  input:
    "h-12 pointer-fine:h-11 w-full rounded-[14px] border border-line-input bg-white px-4 text-base text-[#30272C] placeholder:text-ink-placeholder transition-[border-color,box-shadow] duration-200 ease-out focus:border-rose focus:outline-none focus:ring-[3px] focus:ring-rose/10",
  inputError: "border-rose-deep/60 ring-[3px] ring-rose/10",
} as const;
