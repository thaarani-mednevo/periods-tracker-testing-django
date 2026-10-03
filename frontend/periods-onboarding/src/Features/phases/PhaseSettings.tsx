import { useCycle } from "../../hooks/useCycle";
import type { OnboardingData } from "../../types";
import { SettingsPanel } from "../settings/SettingsPanel";
import { LutealShell } from "./luteal/components/Shell";

interface PhaseSettingsProps {
  data: OnboardingData;
  onBack: () => void;
  onOpenCalendar: () => void;
  onOpenDailyLog: () => void;
  onOpenTrends: () => void;
  day?: string;
}

export function PhaseSettings({
  data,
  day,
  onBack,
  onOpenCalendar,
  onOpenDailyLog,
  onOpenTrends,
}: PhaseSettingsProps) {
  const cycle = useCycle(day);

  if (cycle.status === "loading") {
    return <p className="text-body text-ink-muted">Loading…</p>;
  }

  if (cycle.status === "ready" && cycle.data) {
    return (
      <div className="animate-fade-up pb-12">
        <LutealShell
          data={data}
          state={cycle.data}
          active="settings"
          onNavigate={(tab) => {
            if (tab === "overview") onBack();
            else if (tab === "calendar") onOpenCalendar();
            else if (tab === "daily-log") onOpenDailyLog();
            else if (tab === "insights") onOpenTrends();
          }}
        />

        <SettingsPanel data={data} />
      </div>
    );
  }

  return <SettingsPanel data={data} />;
}