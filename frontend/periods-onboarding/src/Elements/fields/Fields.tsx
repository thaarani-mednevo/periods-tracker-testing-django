import { CircleAlert, type LucideIcon } from "lucide-react";
import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { cn, ui } from "../../lib/cn";
import { Icon3D } from "../icon3D/Icon3D";

export function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-2 flex animate-expand items-center gap-1.5 text-body-sm font-medium text-rose-ink">
      <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  srOnlyLabel?: boolean;
  trailing?: ReactNode;
}

export function TextField({ id, label, value, onChange, error, hint, srOnlyLabel, trailing, className, ...rest }: TextFieldProps) {
  const describedBy = [error ? `${id}-error` : "", hint ? `${id}-hint` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className={cn(ui.label, "mb-2 block", srOnlyLabel && "sr-only")}>
        {label}
      </label>
      <div className="relative flex items-center gap-2">
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={cn(ui.input, error && ui.inputError)}
          {...rest}
        />
        {trailing}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className={cn(ui.helper, "mt-1.5")}>
          {hint}
        </p>
      )}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

interface NumberFieldProps {
  id: string;
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  unit?: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  decimals?: boolean;
  className?: string;
}

/**
 * Numeric input that keeps its own text buffer (so "58." can be typed) while
 * exposing a clean number | undefined to the onboarding state.
 */
export function NumberField({ id, label, value, onChange, unit, placeholder, error, hint, decimals, className }: NumberFieldProps) {
  const [text, setText] = useState(value === undefined ? "" : String(value));

  // Re-sync if the value is changed externally (restored progress, Review edits). Done during render,
  // and only when the buffer no longer represents the value, so a half-typed "58." is never clobbered.
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    const parsed = text.trim() === "" ? undefined : Number(text);
    if (parsed !== value) setText(value === undefined ? "" : String(value));
  }

  const handle = (raw: string) => {
    const pattern = decimals ? /^\d{0,3}(\.\d{0,1})?$/ : /^\d{0,3}$/;
    if (!pattern.test(raw)) return;
    setText(raw);
    const n = raw === "" || raw === "." ? undefined : Number(raw);
    onChange(n !== undefined && Number.isFinite(n) ? n : undefined);
  };

  const describedBy = [error ? `${id}-error` : "", hint ? `${id}-hint` : ""].filter(Boolean).join(" ") || undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className={cn(ui.label, "mb-1.5 block")}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          inputMode={decimals ? "decimal" : "numeric"}
          autoComplete="off"
          value={text}
          placeholder={placeholder}
          onChange={(e) => handle(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={cn(ui.input, "h-12 pr-14 text-heading font-semibold tabular-nums pointer-fine:h-11", error && ui.inputError)}
        />
        {unit && (
          <span className="pointer-events-none absolute inset-y-0 right-4 grid place-items-center text-body font-semibold text-rose-ink">
            {unit}
          </span>
        )}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className={cn(ui.helper, "mt-1.5")}>
          {hint}
        </p>
      )}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

/** Group label + optional helper for a set of controls. */
export function FieldGroup({
  title,
  helper,
  children,
  error,
  errorId,
  className,
  icon,
}: {
  icon?: LucideIcon;
  title: string;
  helper?: string;
  children: ReactNode;
  error?: string;
  errorId?: string;
  className?: string;
}) {
  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend className="mb-1.5 flex w-full items-center gap-2.5">
        {icon && <Icon3D icon={icon} size="sm" active className="size-8 rounded-[10px]" />}
        <span className="flex flex-col gap-0.5">
          <span className="text-body font-semibold text-ink">{title}</span>
          {helper && <span className={ui.helper}>{helper}</span>}
        </span>
      </legend>
      {children}
      <FieldError id={errorId} message={error} />
    </fieldset>
  );
}
