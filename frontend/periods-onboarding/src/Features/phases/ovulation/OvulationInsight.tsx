import { ArrowRight, Droplet, Equal, FlaskConical, Heart, Info, Sparkles, Thermometer, X } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import type { DailyLog } from "../../../services/logs";
import { LuModal } from "../shared/ui/LuModal";
import { plural, type BbtAnalysis, type WindowStatus } from "./fertility";
import { WELLNESS_GROUPS } from "./ovulationContent";
import { CheckList } from "./OvulationParts";

const panel = "rounded-lu-card border border-lu-brand-line bg-white p-lu-card shadow-lu-card";

const joinParts = (parts: string[]) =>
  parts.length <= 1 ? parts.join("") : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;

function Chip({ icon, label, value, muted }: { icon: ReactNode; label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex w-full min-w-0 items-center gap-3 rounded-full bg-white py-2 pl-2 pr-5 shadow-[0px_4px_14px_-4px_rgba(236,72,153,0.25)] md:w-auto">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#FDF2F8] text-[#EC4899]" aria-hidden="true">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[9px] font-medium uppercase tracking-[0.14em] text-lu-ink-soft">{label}</span>
        <span className={`mt-0.5 block text-lu-label font-semibold ${muted ? "text-lu-ink-soft" : "text-[#EC4899]"}`}>{value}</span>
      </span>
    </div>
  );
}

function Join({ label, icon }: { label: string; icon?: ReactNode }) {
  return (
    <div className="flex shrink-0 items-center gap-1.5 text-lu-ink-muted md:flex-col" aria-hidden="true">
      <span className="flex size-5 items-center justify-center rounded-full bg-[#FDF2F8] text-[#EC4899]">
        {icon ?? <ArrowRight className="size-[11px] rotate-90 md:rotate-0" />}
      </span>
      <span className="whitespace-nowrap text-[9px] font-medium uppercase tracking-[0.14em]">{label}</span>
    </div>
  );
}

/**
 * "Fertility Insight" + "What this means" (ovulation-phase design).
 * Built only from what the user logged today plus the estimated window. Nothing is pre-filled.
 */
export function FertilityInsightCard({
  status,
  ttc,
  log,
  bbt,
}: {
  status: WindowStatus | null;
  ttc: boolean;
  log: DailyLog | null;
  bbt: BbtAnalysis;
}) {
  const mucus = log?.cervicalMucus ?? null;
  const lh = log?.lhTest ?? null;
  const latest = bbt.latest;

  const headline = !status
    ? "Your estimated window isn't available yet."
    : status.kind === "peak"
      ? ttc
        ? "You are likely ovulating or within the next 24–48 hours of your ovulation window."
        : "You are likely in your highest-chance days."
      : status.kind === "open"
        ? "You are inside your estimated fertile window."
        : status.kind === "before"
          ? `Your estimated fertile window opens in ${plural(status.days, "day")}.`
          : "Your estimated fertile window has passed for this cycle.";

  const chance = !status ? null : status.kind === "peak" ? "Highest chance" : status.kind === "open" ? "Higher chance" : "Lower chance";

  const chips: { key: string; icon: ReactNode; label: string; value: string; muted?: boolean }[] = [];
  const parts: string[] = [];

  chips.push({
    key: "bbt",
    icon: <Thermometer size={16} />,
    label: "Body temperature",
    value: latest == null ? "Not logged" : bbt.state === "rising" && bbt.delta != null ? `+${bbt.delta.toFixed(2)}°C` : `${latest.toFixed(2)}°C`,
    muted: latest == null,
  });
  chips.push({
    key: "mucus",
    icon: <Droplet size={16} className="fill-current" />,
    label: "Cervical mucus",
    value: mucus ?? "Not logged",
    muted: !mucus,
  });
  if (latest != null) {
    parts.push(
      bbt.state === "rising" && bbt.delta != null
        ? `your temperature is ${bbt.delta.toFixed(2)}°C above your recent baseline`
        : bbt.state === "steady"
          ? "your temperature is close to your recent baseline"
          : "your temperature is logged, but a few more mornings are needed for a baseline",
    );
  }
  if (mucus) {
    parts.push(`your cervical mucus is ${mucus.toLowerCase()}`);
  }
  if (lh) {
    chips.push({ key: "lh", icon: <FlaskConical size={16} />, label: "LH test", value: lh });
    parts.push(`your LH test is ${lh.toLowerCase()}`);
  }

  const body = parts.length
    ? `Today ${joinParts(parts)}.`
    : "Nothing is logged for today yet. Log temperature, cervical mucus or an LH test and the signs will be read together here.";

  const fertileSigns = [bbt.state === "rising", mucus === "Watery" || mucus === "Egg white", lh === "High" || lh === "Peak"].filter(Boolean).length;
  const inWindow = status?.kind === "peak" || status?.kind === "open";

  const meaning =
    parts.length === 0
      ? "Your window dates come from your cycle history only. Logging signs makes the picture more reliable."
      : fertileSigns > 0
        ? inWindow
          ? "Your logged signs point the same way as your estimated window, which supports being in or near your fertile days."
          : "Some of your signs look fertile, but they don't match your estimated window. Estimates can be off, so keep logging to see how it develops."
        : "Your logged signs don't clearly show a fertile pattern today. Keep logging to see how they change.";

  return (
    <>
      <section className={panel} aria-labelledby="fertility-insight-title">
        <div className="flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-[#EC4899]" aria-hidden="true" />
          <h3 id="fertility-insight-title" className="text-lu-label font-semibold text-lu-ink">
            Fertility Insight
          </h3>
        </div>
        <p className="mt-3 text-lu-heading font-semibold leading-snug text-lu-ink">{headline}</p>
        <p className="mt-3 text-lu-label text-lu-ink-muted">{body}</p>

        {chips.length > 0 && (
          <div className="mt-5 rounded-[20px] border-2 border-[#FCE7F1] px-[clamp(0.75rem,1.6vw,1.25rem)] pb-5 pt-4">
            <span className="block text-[10px] font-medium uppercase tracking-[0.16em] text-lu-ink-soft">Biomarker correlation</span>
            <div className="mt-4 flex flex-col items-center justify-between gap-3 md:flex-row md:flex-wrap">
              {chips.map((c, i) => (
                <Fragment key={c.key}>
                  {i > 0 && <Join label="Observed with" />}
                  <Chip icon={c.icon} label={c.label} value={c.value} muted={c.muted} />
                </Fragment>
              ))}
              {chance && (
                <>
                  <Join label="Correlates to" icon={<Equal className="size-[11px]" />} />
                  <div className="flex w-full items-center gap-3 rounded-full bg-gradient-to-r from-[#EC4899] to-[#F07BC0] py-2 pl-2 pr-6 text-white shadow-[0px_6px_18px_-4px_rgba(236,72,153,0.45)] md:w-auto">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/30" aria-hidden="true">
                      <Heart size={16} className="fill-white" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[9px] font-medium uppercase tracking-[0.14em] text-white/85">Estimated window</span>
                      <span className="mt-0.5 block text-lu-label font-bold">{chance}</span>
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="flex items-start gap-3.5 rounded-lu-card bg-[#FDF1F6] p-lu-card" aria-labelledby="what-this-means-title">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#F7A8C8] text-white" aria-hidden="true">
          <Info className="size-4" />
        </span>
        <div className="min-w-0">
          <h4 id="what-this-means-title" className="text-lu-label font-semibold text-lu-ink">
            What this means
          </h4>
          <p className="mt-1 text-lu-label text-lu-ink-muted">
            {meaning}
            {!ttc && " Tracking can't guarantee anything, so keep using your usual protection."}
          </p>
        </div>
      </section>
    </>
  );
}

/** "View Tips" popup. Same educational groups as the default ovulation screen. */
export function TipsModal({ onClose }: { onClose: () => void }) {
  return (
    <LuModal labelledBy="ovulation-tips-title" onClose={onClose} className="max-h-[90vh] max-w-[560px] overflow-y-auto p-lu-card">
      <div className="flex items-start justify-between gap-3">
        <h2 id="ovulation-tips-title" className="text-lu-heading font-semibold text-lu-ink">
          Ovulation tips
        </h2>
        <button type="button" onClick={onClose} aria-label="Close tips" className="rounded-full p-1.5 text-lu-ink-muted hover:bg-lu-brand-soft">
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-4 space-y-5">
        {WELLNESS_GROUPS.map(({ id, title, icon: Icon, tone, check, items }) => (
          <section key={id}>
            <div className="flex items-center gap-2.5">
              <span className={`flex size-9 items-center justify-center rounded-full ${tone}`} aria-hidden="true">
                <Icon className="size-[18px]" />
              </span>
              <h3 className="text-lu-label font-semibold text-lu-ink">{title}</h3>
            </div>
            <CheckList items={items} check={check} />
          </section>
        ))}
      </div>
    </LuModal>
  );
}