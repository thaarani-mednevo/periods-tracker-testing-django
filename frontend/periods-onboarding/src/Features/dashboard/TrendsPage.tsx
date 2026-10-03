// frontend/src/Features/dashboard/TrendsPage.tsx
import { LutealShell } from "../phases/luteal/components/Shell";
import type { OnboardingData } from "../../types";
import { InfoCard } from "../../Elements/infoCard/InfoCard";
import { useCycle } from "../../hooks/useCycle";
import { InsightsPage } from "../insights/InsightsPage";

export function TrendsPage({
  data,
  onOpenOverview,
  onOpenCalendar,
  onOpenDailyLog,
  onOpenSettings,
  day,
}: {
  data: OnboardingData;
  onBack: () => void;
  onOpenOverview: () => void;
  onOpenCalendar: () => void;
  onOpenDailyLog: () => void;
  onOpenSettings: () => void;
  day?: string;
}) {
  const cycle = useCycle(day);

  return (
    <div className="animate-fade-up pb-12">
      {cycle.status === "ready" && cycle.data && (
        <LutealShell
          data={data}
          state={cycle.data}
          active="insights"
          onNavigate={(tab) => {
            if (tab === "overview") onOpenOverview();
            else if (tab === "calendar") onOpenCalendar();
            else if (tab === "daily-log") onOpenDailyLog();
            else if (tab === "settings") onOpenSettings();
          }}
        />
      )}

      {cycle.status === "loading" && <p className="text-body text-ink-muted">Loading…</p>}
      {cycle.status === "error" && (
        <InfoCard live>
          {cycle.error?.message ?? "Couldn't load your cycle."}{" "}
          <button type="button" onClick={cycle.refetch} className="font-semibold underline">
            Try again
          </button>
        </InfoCard>
      )}
      {cycle.status === "ready" && cycle.data && <InsightsPage state={cycle.data} day={day} />}
    </div>
  );
}