import { Bell, ChevronRight, Heart } from "lucide-react";
import { useCallback, useState, type ReactNode } from "react";
import { InfoCard } from "../../Elements/infoCard/InfoCard";
import { useAsync } from "../../hooks/useAsync";
import { submitOnboardingProfile } from "../../services/onboarding";
import { getProfile, goalFromJourney, journeyFromGoal, type Journey } from "../../services/settings";
import type { OnboardingData } from "../../types";
import settingsCalendar from "../../assets/phases/settings-calendar.png";
import { JourneyIcon, LeadDaysPicker, SettingRow } from "./controls";
import { getJourneyOption } from "./journeyOptions";
import { ManageJourneyModal } from "./ManageJourneyModal";

const Divider = () => <hr className="my-2 border-[#F1DDE8]/60" />;

function SettingsCard({ title, icon, iconClass, children }: { title: string; icon: ReactNode; iconClass: string; children: ReactNode }) {
  return (
    <section className="flex h-full flex-col rounded-[22px] border border-[#F1DDE8]/80 bg-white p-6 shadow-[0_4px_20px_rgba(23,21,43,0.03)] sm:p-7">
      <div className="mb-5 flex items-center gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconClass}`} aria-hidden="true">{icon}</div>
        <h3 className="text-base font-bold tracking-tight text-[#17152B] sm:text-lg">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

/** Same Settings for every phase. Values come from, and are saved to, the onboarding profile. */
export function SettingsPanel({ data }: { data: OnboardingData }) {
  const load = useCallback((s: AbortSignal) => getProfile(s), []);
  const profile = useAsync(load);
  const [busy, setBusy] = useState(false);
  const [journeyOpen, setJourneyOpen] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const p = profile.data;

  if (!p) {
    return profile.status === "error" ? (
      <InfoCard live>
        {profile.error?.message ?? "Couldn't load your settings."}{" "}
        <button type="button" onClick={profile.refetch} className="font-semibold underline">Try again</button>
      </InfoCard>
    ) : (
      <p className="text-lu-body text-lu-ink-muted">Loading settings…</p>
    );
  }

  const journey = journeyFromGoal(p.fertilityGoal);
  const option = getJourneyOption(journey);

  const save = async (patch: Partial<OnboardingData>, okText = "Settings saved") => {
    if (busy) return false;
    setBusy(true);
    setMessage(null);
    const res = await submitOnboardingProfile({ ...data, ...p, ...patch } as OnboardingData);
    setBusy(false);
    if (!res.success) {
      setMessage({ kind: "error", text: res.error ?? "Couldn't save your settings." });
      return false;
    }
    profile.refetch();
    setMessage({ kind: "ok", text: okText });
    return true;
  };

  const changeJourney = (next: Journey) =>
    save({ fertilityGoal: goalFromJourney(next) }, `Journey set to "${getJourneyOption(next).title}"`);

  return (
    <div className="w-full space-y-7 pb-8 text-left sm:space-y-8">
      {message && (
        <p
          role={message.kind === "error" ? "alert" : "status"}
          className={`rounded-2xl px-4 py-3 text-lu-label font-medium ${message.kind === "error" ? "bg-[#FFF1F2] text-[#E11D48]" : "bg-[#F0FDF4] text-[#15803D]"}`}
        >
          {message.text}
        </p>
      )}

      <section aria-labelledby="journey-title" className="space-y-2">
        <div>
          <h2 id="journey-title" className="text-xl font-bold tracking-tight text-[#17152B] sm:text-2xl">Health Journey Settings</h2>
          <p className="mt-0.5 text-xs font-medium text-[#68708A] sm:text-sm">Manage your journey and life stages</p>
        </div>
        <div className="relative mt-3 flex w-full flex-col items-center justify-between gap-6 overflow-hidden rounded-[24px] border border-[#F1DDE8]/80 bg-white p-6 shadow-[0_4px_20px_rgba(23,21,43,0.03)] sm:p-7 md:flex-row md:p-8">
          <div className="w-full max-w-xl min-w-0 flex-1 space-y-4">
            <span className="block text-[0.68rem] font-bold uppercase tracking-wider text-[#68708A]">Current journey</span>
            <div className="flex items-start gap-3.5 sm:items-center">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br p-0.5 shadow-md ${option.accentGradient}`}>
                <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-white/10 text-white">
                  <JourneyIcon icon={option.icon} className="h-6 w-6" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight text-[#17152B] sm:text-xl">{option.title}</h3>
                <p className="text-xs font-medium leading-relaxed text-[#68708A] sm:text-[0.84rem]">{option.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-[#DCFCE7] bg-[#F0FDF4] p-3">
              <span className="h-2 w-2 rounded-full bg-[#16A34A]" aria-hidden="true" />
              <span className="text-xs font-bold text-[#15803D]">Currently Active</span>
            </div>
            <button
              type="button"
              onClick={() => setJourneyOpen(true)}
              aria-haspopup="dialog"
              className="inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#F5F0FF] px-4 text-xs font-bold tracking-tight text-[#6C5CE7] transition-colors hover:bg-[#EDE5FF] sm:text-sm"
            >
              <span>Manage Journey</span>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <div className="flex h-44 w-44 shrink-0 items-center justify-center sm:h-56 sm:w-56">
            <img src={settingsCalendar} alt="" width={220} height={220} loading="lazy" className="h-auto max-h-full w-auto max-w-full select-none object-contain drop-shadow-md" />
          </div>
        </div>
      </section>

      <section aria-labelledby="preferences-title" className="space-y-2 pt-1">
        <div>
          <h2 id="preferences-title" className="text-xl font-bold tracking-tight text-[#17152B] sm:text-2xl">Settings &amp; Preferences</h2>
          <p className="mt-0.5 text-xs font-medium text-[#68708A] sm:text-sm">Manage your wellness experience</p>
        </div>
        <div className="mt-3 grid w-full grid-cols-1 items-stretch gap-5 sm:gap-6 lg:grid-cols-2">
          <SettingsCard title="Notifications" icon={<Bell className="h-[18px] w-[18px]" />} iconClass="bg-[#FFF0F6] text-[#F43F8F]">
            <div className="space-y-3">
              <SettingRow
                label="Period reminders"
                description="Get a reminder before your period starts"
                checked={p.periodReminder}
                disabled={busy}
                onChange={(v) => save({ periodReminder: v, periodReminderDays: p.periodReminderDays ?? 1 })}
              />
              {p.periodReminder && (
                <LeadDaysPicker label="Remind me" value={p.periodReminderDays ?? 1} disabled={busy} onChange={(d) => save({ periodReminderDays: d })} />
              )}
            </div>
            <Divider />
            <div className="space-y-3">
              <SettingRow
                label="Ovulation alerts"
                description="Notify on fertile window"
                checked={p.ovulationReminder}
                disabled={busy}
                onChange={(v) => save({ ovulationReminder: v, ovulationReminderDays: p.ovulationReminderDays ?? 1 })}
              />
              {p.ovulationReminder && (
                <LeadDaysPicker label="Remind me" value={p.ovulationReminderDays ?? 1} disabled={busy} onChange={(d) => save({ ovulationReminderDays: d })} />
              )}
            </div>
          </SettingsCard>

          <SettingsCard title="Fertility Goals" icon={<Heart className="h-[18px] w-[18px] fill-[#16A34A] stroke-none" />} iconClass="bg-[#DCFCE7] text-[#16A34A]">
            <SettingRow
              label="Trying to conceive"
              description="Track ovulation closely"
              checked={journey === "trying_to_conceive"}
              disabled={busy}
              onChange={(v) => changeJourney(v ? "trying_to_conceive" : "cycle_tracking")}
            />
            <Divider />
            <SettingRow
              label="Intercourse Tracking"
              description="Tracking across all cycle phases"
              checked={p.fertilityTracking?.intercourse ?? false}
              disabled={busy}
              onChange={(v) => save({ fertilityTracking: { ...p.fertilityTracking, intercourse: v } })}
            />
            <Divider />
            <SettingRow
              label="Pregnancy prevention"
              description="Avoid fertile window"
              checked={journey === "pregnancy_prevention"}
              disabled={busy}
              onChange={(v) => changeJourney(v ? "pregnancy_prevention" : "cycle_tracking")}
            />
          </SettingsCard>
        </div>
      </section>

      {journeyOpen && <ManageJourneyModal current={journey} onClose={() => setJourneyOpen(false)} onSave={changeJourney} />}
    </div>
  );
}