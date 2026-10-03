import { InfoCard } from "../../Elements/infoCard/InfoCard";
import { MedicationSection } from "../phases/shared/daily-log/MedicationSection";
import { useMedications } from "../phases/shared/daily-log/useDailyLog";

/** Medication card for pages that manage their own selected day (Follicular log, generic Daily Log page). */
export function MedicationPanel({ day }: { day: string }) {
  const meds = useMedications(day);
  const error = meds.error ?? meds.loadError?.message ?? null;
  return (
    <>
      <MedicationSection
        medications={meds.medications}
        date={day}
        onStatusChange={meds.setStatus}
        onAdd={meds.add}
        onRemove={meds.remove}
        onUpdate={meds.update}
      />
      {error && <InfoCard live>{error}</InfoCard>}
    </>
  );
}