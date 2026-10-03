import { useState, type ReactNode } from "react";
import { card } from "../phases/shared";

const chip = (on: boolean) =>
  `rounded-full px-3.5 py-1.5 text-body-sm font-semibold transition-colors ${
    on ? "bg-rose text-white" : "border border-blush-300 bg-white text-ink-muted hover:bg-blush-50"
  }`;

export const fieldCls = "mt-1 w-full rounded-[14px] border border-line bg-white px-3.5 py-2.5 text-body text-ink";

export function Section({ id, title, hint, children }: { id: string; title: string; hint?: string; children: ReactNode }) {
  return (
    <section className={card} aria-labelledby={id}>
      <h2 id={id} className="text-heading font-semibold text-ink">{title}</h2>
      {hint && <p className="mt-0.5 text-body-sm text-ink-muted">{hint}</p>}
      <div className="mt-4 grid gap-5">{children}</div>
    </section>
  );
}

/** Pick one option; tap the selected one again to clear it (an untouched field stays "not recorded"). */
export function ChoiceGroup<T extends string>({
  label, options, value, onChange,
}: { label: string; options: readonly T[]; value: T | null; onChange: (v: T | null) => void }) {
  return (
    <div role="group" aria-label={label}>
      <p className="text-body-sm font-semibold text-ink">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o} type="button" aria-pressed={value === o} onClick={() => onChange(value === o ? null : o)} className={chip(value === o)}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

export function YesNo({ label, value, onChange }: { label: string; value: boolean | null; onChange: (v: boolean | null) => void }) {
  return (
    <ChoiceGroup<"Yes" | "No">
      label={label}
      options={["Yes", "No"]}
      value={value === null ? null : value ? "Yes" : "No"}
      onChange={(v) => onChange(v === null ? null : v === "Yes")}
    />
  );
}

export function ScaleGroup({ label, min, max, value, onChange }: { label: string; min: number; max: number; value: number | null; onChange: (v: number | null) => void }) {
  const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <div role="group" aria-label={label}>
      <p className="text-body-sm font-semibold text-ink">{label}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {steps.map((n) => (
          <button key={n} type="button" aria-pressed={value === n} onClick={() => onChange(value === n ? null : n)} className={`${chip(value === n)} min-w-[2.5rem] !px-0 text-center`}>
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export function MultiChoice<T extends string>({
  label, options, value, onChange,
}: { label: string; options: readonly { id: T; label: string }[]; value: T[]; onChange: (v: T[]) => void }) {
  const toggle = (id: T) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  return (
    <div role="group" aria-label={label}>
      <p className="text-body-sm font-semibold text-ink">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o.id} type="button" aria-pressed={value.includes(o.id)} onClick={() => toggle(o.id)} className={chip(value.includes(o.id))}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function NumberField({
  label, value, onChange, min, max, step = 1, unit,
}: { label: string; value: number | null; onChange: (v: number | null) => void; min: number; max: number; step?: number; unit?: string }) {
  // Keep the raw text so typing "36." or "36.5" isn't rewritten on every keystroke.
  const [text, setText] = useState(value === null ? "" : String(value));
  return (
    <label className="block text-body-sm font-semibold text-ink">
      {label}
      {unit && <span className="font-normal text-ink-muted"> ({unit})</span>}
      <input
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={text}
        onChange={(e) => {
          const t = e.target.value;
          setText(t);
          if (t === "") return onChange(null);
          const n = Number(t);
          if (Number.isFinite(n)) onChange(n);
        }}
        className={fieldCls}
      />
    </label>
  );
}

export function TimeField({ label, value, onChange }: { label: string; value: string | null; onChange: (v: string | null) => void }) {
  return (
    <label className="block text-body-sm font-semibold text-ink">
      {label}
      <input type="time" value={value ?? ""} onChange={(e) => onChange(e.target.value || null)} className={fieldCls} />
    </label>
  );
}

export function NotesField({ value, onChange, max = 1000 }: { value: string | null; onChange: (v: string | null) => void; max?: number }) {
  return (
    <label className="block text-body-sm font-semibold text-ink">
      Notes
      <textarea
        value={value ?? ""}
        maxLength={max}
        rows={3}
        onChange={(e) => onChange(e.target.value || null)}
        className={`${fieldCls} resize-y`}
      />
      <span className="mt-1 block text-right text-caption font-normal text-ink-muted">{(value ?? "").length}/{max}</span>
    </label>
  );
}
