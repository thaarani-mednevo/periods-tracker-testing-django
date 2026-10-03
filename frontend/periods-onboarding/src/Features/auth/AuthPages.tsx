import { useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from "react";
import { ApiError } from "../../services/api/client";
import { login, signup, type AuthResult } from "../../services/auth";

const btn =
  "w-full rounded-full bg-rose px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-60";
const linkBtn = "text-sm font-semibold text-rose-ink hover:underline disabled:opacity-50";
const inputCls =
  "w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-base outline-none focus:border-rose";

function Shell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-black/5 bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>
        <div className="mt-6 space-y-4">{children}</div>
      </div>
    </main>
  );
}

function Field({ label, errors, ...props }: { label: string; errors?: string[] } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      <input className={inputCls} {...props} />
      {errors?.map((m) => (
        <span key={m} className="block text-sm text-red-600">{m}</span>
      ))}
    </label>
  );
}

function useForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string[]>>({});
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    setFields({});
    try {
      await fn();
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
        setFields(e.fieldErrors ?? {});
      } else setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, fields, run };
}

const ErrorText = ({ text }: { text: string }) =>
  text ? <p role="alert" className="text-sm text-red-600">{text}</p> : null;

/* ---------------- Login ---------------- */
export function LoginPage(props: { onAuth: (r: AuthResult) => void; onSignup: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { busy, error, run } = useForm();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => props.onAuth(await login({ email, password })));
  };

  return (
    <Shell title="Welcome back" subtitle="Log in to continue">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <ErrorText text={error} />
        <button className={btn} disabled={busy}>{busy ? "Logging in…" : "Log in"}</button>
      </form>
      <button type="button" className={linkBtn} onClick={props.onSignup}>New here? Create account</button>
    </Shell>
  );
}

/* ---------------- Signup ---------------- */
export function SignupPage(props: { onAuth: (r: AuthResult) => void; onLogin: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { busy, error, fields, run } = useForm();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => props.onAuth(await signup({ name, email, password })));
  };

  return (
    <Shell title="Create your account" subtitle="It takes less than a minute">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} errors={fields.name} />
        <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} errors={fields.email} />
        <Field label="Password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} errors={fields.password} />
        {!Object.keys(fields).length && <ErrorText text={error} />}
        <button className={btn} disabled={busy}>{busy ? "Creating…" : "Sign up"}</button>
      </form>
      <button type="button" className={linkBtn} onClick={props.onLogin}>Already have an account? Log in</button>
    </Shell>
  );
}