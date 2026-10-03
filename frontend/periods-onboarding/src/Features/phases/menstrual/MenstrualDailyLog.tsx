import {
  BatteryLow,
  Check,
  Droplet,
  Flame,
  Info,
  Minus,
  Plus,
  Sparkle,
  Trash2,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useId, useState, type ReactNode } from "react";

import { InfoCard } from "../../../Elements/infoCard/InfoCard";
import { useAsync } from "../../../hooks/useAsync";
import { longDate } from "../../../lib/isoDate";
import { getPhaseInsight } from "../../../services/insights";
import {
  BLOOD_COLORS,
  CLOT_SIZES,
  CRAMPS,
  ENERGIES,
  FLOWS,
  MOODS,
  PRODUCT_TYPES,
} from "../../../services/logs";
import type { CycleState } from "../../../services/cycle";
import type { OnboardingData } from "../../../types";

import { AIWellnessInsights } from "../shared/daily-log/AIWellnessInsights";
import { CycleDayStrip } from "../shared/daily-log/CycleDayStrip";
import { MedicationSection } from "../shared/daily-log/MedicationSection";
import { PHASE_TITLE } from "../shared/daily-log/phaseCopy";
import { SaveLogBar } from "../shared/daily-log/SaveLogBar";
import { useDailyLog } from "../shared/daily-log/useDailyLog";
import { MoodFace } from "../shared/ui/visuals";

import type { LutealTab } from "../luteal/components/Shell";
import { LutealShell } from "../luteal/components/Shell";

/* -------------------------------------------------------------------------- */
/* Shared look (same as the original menstruation UI)                         */
/* -------------------------------------------------------------------------- */

const CARD =
  "w-full rounded-[22px] border border-[#F1EEF3] bg-white p-5 text-left shadow-[0_8px_28px_rgba(23,21,43,0.045)]";
const LABEL = "text-xs font-bold uppercase tracking-wider text-[#68708A]";

/* -------------------------------------------------------------------------- */
/* Small building blocks                                                      */
/* -------------------------------------------------------------------------- */

interface PillsProps<T extends string> {
  options: readonly T[];
  value: T | null;
  onChange: (value: T | null) => void;
  labelledBy: string;
  columns?: 2 | 3;
  stacked?: boolean;
  disabled?: boolean;
  renderIcon?: (index: number) => ReactNode;
}

/** Single-choice buttons. Tapping the selected one again clears it. */
function Pills<T extends string>({
  options,
  value,
  onChange,
  labelledBy,
  columns = 2,
  stacked,
  disabled,
  renderIcon,
}: PillsProps<T>) {
  return (
    <div
      role="group"
      aria-labelledby={labelledBy}
      className={
        stacked
          ? "space-y-1.5"
          : `grid gap-2 ${columns === 3 ? "grid-cols-3" : "grid-cols-2"}`
      }
    >
      {options.map((option, index) => {
        const selected = option === value;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => onChange(selected ? null : option)}
            className={`flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-xl border px-3 text-xs font-bold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
              stacked ? "w-full justify-start" : "justify-center"
            } ${
              selected
                ? "border-[#D81B60] bg-[#D81B60] text-white shadow-sm"
                : "border-gray-100 bg-[#FAF8FA] text-[#55607A] hover:bg-pink-50 hover:text-[#17152B]"
            }`}
          >
            {renderIcon && (
              <span className="shrink-0" aria-hidden="true">
                {renderIcon(index)}
              </span>
            )}
            <span>{option}</span>
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Blood flow                                                                 */
/* -------------------------------------------------------------------------- */

const FLOW_ORDER = ["Light", "Medium", "Heavy", "Spotting"];
const flowRank = (flow: string) => {
  const i = FLOW_ORDER.indexOf(flow);
  return i === -1 ? FLOW_ORDER.length : i;
};

function FlowIcon({ flow }: { flow: string }) {
  if (flow === "Spotting") return <Sparkle className="h-3.5 w-3.5 fill-current" />;
  const count = flow === "Heavy" ? 3 : flow === "Medium" ? 2 : 1;
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: count }, (_, i) => (
        <Droplet key={i} className={`${count === 3 ? "h-3 w-3" : "h-3.5 w-3.5"} fill-current`} />
      ))}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Products                                                                   */
/* -------------------------------------------------------------------------- */

const PRODUCT_SIZES: Record<string, readonly string[]> = {
  Pad: ["Small", "Medium", "Large", "Overnight"],
  Tampon: ["Light", "Regular", "Super"],
  "Menstrual cup": ["Small", "Medium", "Large"],
  Other: [],
};

const PRODUCT_COPY: Record<string, { title: string; hint: string }> = {
  Pad: { title: "Pads", hint: "Disposable pads" },
  Tampon: { title: "Tampons", hint: "Internal protection" },
  "Menstrual cup": { title: "Menstrual cup", hint: "Reusable cup" },
  Other: { title: "Other", hint: "Anything else you used" },
};

const QTY_MIN = 1;
const QTY_MAX = 20;

/* -------------------------------------------------------------------------- */
/* Props                                                                      */
/* -------------------------------------------------------------------------- */

interface MenstrualDailyLogProps {
  data: OnboardingData;
  state: CycleState;
  initialDay?: string;
  onDateChange: (date: string) => void;
  onNavigate: (tab: LutealTab) => void;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function MenstrualDailyLog({
  data,
  state,
  initialDay,
  onDateChange,
  onNavigate,
}: MenstrualDailyLogProps) {
  const log = useDailyLog(initialDay);
  const { draft } = log;

  const [addingProduct, setAddingProduct] = useState(false);

  const flowId = useId();
  const moodId = useId();
  const colorId = useId();
  const crampsId = useId();
  const clotsId = useId();
  const clotSizeId = useId();
  const energyId = useId();

  /* Keep parent phase/date in sync with the date picked in the strip. */
  useEffect(() => {
    const expectedDate = initialDay ?? log.today;
    if (log.selectedDate !== expectedDate) onDateChange(log.selectedDate);
  }, [log.selectedDate, log.today, initialDay, onDateChange]);

  const loadInsight = useCallback(
    (signal: AbortSignal) => getPhaseInsight(log.selectedDate, signal),
    [log.selectedDate],
  );
  const insight = useAsync(loadInsight);

  const info = log.cycleInfo(log.selectedDate);
  const isToday = log.selectedDate === log.today;

  /* ---- Products ---------------------------------------------------------- */

  const products = draft?.products ?? [];

  const addProduct = (type: (typeof PRODUCT_TYPES)[number]) => {
    const sizes = PRODUCT_SIZES[type] ?? [];
    log.update("products", [
      ...products,
      { type, label: type, size: sizes[0] ?? null, quantity: QTY_MIN },
    ]);
    setAddingProduct(false);
  };

  const patchProduct = (index: number, patch: { quantity?: number; size?: string | null }) =>
    log.update(
      "products",
      products.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    );

  const removeProduct = (index: number) =>
    log.update(
      "products",
      products.filter((_, i) => i !== index),
    );

  /* ---- Clots ------------------------------------------------------------- */

  const clotsOn = draft?.clotsPresent === true;

  const toggleClots = () => {
    if (clotsOn) {
      log.update("clotsPresent", false);
      log.update("clotSize", null);
      return;
    }
    log.update("clotsPresent", true);
    if (!draft?.clotSize) log.update("clotSize", CLOT_SIZES[0]);
  };

  const ENERGY_ICONS = [
    <BatteryLow key="low" className="h-4 w-4" />,
    <Zap key="mid" className="h-4 w-4" />,
    <Flame key="high" className="h-4 w-4" />,
  ];

  return (
    <div className="animate-fade-up pb-12">
      <LutealShell data={data} state={state} active="daily-log" onNavigate={onNavigate} />

      <div className="flex flex-col gap-lu-grid">
        {/* Date selector (unchanged) */}
        <CycleDayStrip
          today={log.today}
          dates={log.dates}
          selectedDate={log.selectedDate}
          info={info}
          cycleInfo={log.cycleInfo}
          isLogged={log.isLogged}
          onSelect={(date) => {
            log.selectDate(date);
            onDateChange(date);
          }}
          onToday={() => {
            log.goToToday();
            onDateChange(log.today);
          }}
          onShiftWeek={log.shiftWeek}
          onShiftMonth={log.shiftMonth}
        />

        {log.loadError && (
          <InfoCard live>
            {log.loadError.message || "Couldn't load this day."}{" "}
            <button type="button" onClick={log.retry} className="font-semibold underline">
              Try again
            </button>
          </InfoCard>
        )}

        {!log.ready && !log.loadError && (
          <p className="text-lu-body text-lu-ink-muted">Loading…</p>
        )}

        {log.ready && draft && (
          <>
            {/* Phase heading */}
            <div className="pt-1">
              <h2 className="text-lu-title font-bold text-lu-ink">{PHASE_TITLE[info.phase]}</h2>
              <p className="mt-0.5 text-lu-body text-lu-ink-muted">
                {isToday ? "Today, " : ""}
                {longDate(log.selectedDate)}
              </p>
            </div>

            {isToday && (
              <AIWellnessInsights
                cycleDay={info.cycleDay}
                phase={info.phase}
                insight={insight.data?.insight ?? null}
                loading={insight.status === "loading"}
              />
            )}

            {/* Two columns, same as the original menstruation UI */}
            <div className="grid w-full grid-cols-1 items-start gap-5 lg:grid-cols-2">
              {/* ------------------------- LEFT ------------------------- */}
              <div className="w-full space-y-5">
                {/* Blood flow */}
                <section
                  aria-labelledby={flowId}
                  className="relative flex min-h-[190px] w-full flex-col justify-between overflow-hidden rounded-[22px] p-5 text-white shadow-[0_8px_28px_rgba(23,21,43,0.08)] sm:p-6"
                  style={{ background: "linear-gradient(135deg, #FF5E62 0%, #E83A64 45%, #B81958 100%)" }}
                >
                  <div className="z-10 space-y-1 text-left">
                    <h3 id={flowId} className="block text-xs font-bold uppercase tracking-wider text-white/90">
                      Blood flow
                    </h3>
                    <p className="text-2xl font-black leading-tight tracking-tight sm:text-3xl" aria-live="polite">
                      {draft.flow ?? "Not logged"}
                    </p>
                  </div>

                  <div role="group" aria-labelledby={flowId} className="z-10 grid grid-cols-4 gap-2 pt-4">
                    {[...FLOWS].sort((a, b) => flowRank(a) - flowRank(b)).map((flow) => {
                      const selected = flow === draft.flow;
                      return (
                        <button
                          key={flow}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => log.update("flow", selected ? null : flow)}
                          className={`flex min-h-[52px] cursor-pointer flex-col items-center justify-center gap-1 rounded-full px-1 text-xs font-bold transition-all duration-200 ${
                            selected ? "bg-white text-[#A3155A] shadow-md" : "bg-white/20 text-white hover:bg-white/30"
                          }`}
                        >
                          <span className="flex h-4 items-center justify-center" aria-hidden="true">
                            <FlowIcon flow={flow} />
                          </span>
                          <span className="max-w-full truncate text-[0.72rem] sm:text-xs">{flow}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-10 -right-10 h-36 w-36 rounded-full bg-white/10 blur-xl"
                  />
                </section>

                {/* Products used */}
                <section className={`${CARD} sm:p-6`}>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className={LABEL}>Products used</h3>
                    <button
                      type="button"
                      onClick={() => setAddingProduct((v) => !v)}
                      aria-expanded={addingProduct}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-pink-200 bg-[#FFF0F6] px-4 py-2 text-xs font-bold text-[#D81B60] hover:bg-pink-100"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      Add another entry
                    </button>
                  </div>

                  {addingProduct && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {PRODUCT_TYPES.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => addProduct(type)}
                          className="cursor-pointer rounded-full border border-[#F1EEF3] bg-white px-4 py-2 text-xs font-semibold text-[#55607A] hover:border-pink-200 hover:bg-pink-50"
                        >
                          {PRODUCT_COPY[type]?.title ?? type}
                        </button>
                      ))}
                    </div>
                  )}

                  {products.length === 0 ? (
                    <p className="mt-4 text-xs font-medium text-[#68708A]">
                      No products logged for this day. Use “Add another entry” to log one.
                    </p>
                  ) : (
                    <ul className="mt-4 space-y-3">
                      {products.map((product, index) => {
                        const copy = PRODUCT_COPY[product.type] ?? { title: product.type, hint: "" };
                        const sizes = PRODUCT_SIZES[product.type] ?? [];
                        return (
                          <li
                            key={`${product.type}-${index}`}
                            className="rounded-2xl border border-pink-100 bg-[#FFF8FB] p-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-3">
                                <span
                                  aria-hidden="true"
                                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#F43F8F] shadow-sm"
                                >
                                  <Droplet className="h-5 w-5" />
                                </span>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-bold text-[#17152B]">{copy.title}</p>
                                  <p className="truncate text-xs font-medium text-[#68708A]">{copy.hint}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="flex items-center rounded-full border border-pink-100 bg-white">
                                  <button
                                    type="button"
                                    aria-label={`Decrease ${copy.title}`}
                                    disabled={product.quantity <= QTY_MIN}
                                    onClick={() => patchProduct(index, { quantity: product.quantity - 1 })}
                                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#17152B] disabled:cursor-not-allowed disabled:opacity-30"
                                  >
                                    <Minus className="h-4 w-4" aria-hidden="true" />
                                  </button>
                                  <span className="min-w-6 text-center text-sm font-bold text-[#17152B]" aria-live="polite">
                                    {product.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    aria-label={`Increase ${copy.title}`}
                                    disabled={product.quantity >= QTY_MAX}
                                    onClick={() => patchProduct(index, { quantity: product.quantity + 1 })}
                                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#17152B] disabled:cursor-not-allowed disabled:opacity-30"
                                  >
                                    <Plus className="h-4 w-4" aria-hidden="true" />
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  aria-label={`Remove ${copy.title}`}
                                  onClick={() => removeProduct(index)}
                                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#8A92A6] hover:bg-white hover:text-[#D81B60]"
                                >
                                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                                </button>
                              </div>
                            </div>

                            {sizes.length > 0 && (
                              <label className="mt-3 block">
                                <span className="text-[0.66rem] font-bold uppercase tracking-wider text-[#68708A]">
                                  Size / absorbency
                                </span>
                                <select
                                  value={product.size ?? sizes[0]}
                                  onChange={(e) => patchProduct(index, { size: e.target.value })}
                                  className="mt-1 w-full rounded-xl border border-[#F1EEF3] bg-white px-3 py-2.5 text-sm font-semibold text-[#17152B]"
                                >
                                  {sizes.map((size) => (
                                    <option key={size} value={size}>
                                      {size}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  <p className="mt-4 text-xs font-medium text-[#68708A]">
                    Used more than one size today? Add a separate entry for each size or absorbency.
                  </p>
                </section>
              </div>

              {/* ------------------------- RIGHT ------------------------ */}
              <div className="w-full space-y-5">
                {/* Mood */}
                <section aria-labelledby={moodId} className={`${CARD} sm:p-6`}>
                  <h3 id={moodId} className="text-base font-bold tracking-tight text-[#17152B]">
                    Mood
                  </h3>
                  <p className="inline-flex items-center gap-1 text-xs font-medium text-[#68708A]">
                    Select how you feel today
                    <Info className="h-3.5 w-3.5 text-[#8A92A6]" aria-hidden="true" />
                  </p>
                  <div role="group" aria-labelledby={moodId} className="grid grid-cols-5 gap-1.5 pt-3 sm:gap-2.5">
                    {MOODS.map((mood) => {
                      const selected = mood === draft.mood;
                      return (
                        <button
                          key={mood}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => log.update("mood", selected ? null : mood)}
                          className={`flex min-h-[76px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl px-0.5 py-2 transition-all duration-200 ${
                            selected
                              ? "border-2 border-[#F43F8F] bg-[#FFF0F6]"
                              : "border border-[#F1EEF3] bg-white hover:border-pink-200 hover:bg-pink-50/50"
                          }`}
                        >
                          <MoodFace value={mood} />
                          <span
                            className={`text-[0.68rem] tracking-tight sm:text-xs ${
                              selected ? "font-bold text-[#F43F8F]" : "font-medium text-[#68708A]"
                            }`}
                          >
                            {mood}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Blood colour */}
                <section aria-labelledby={colorId} className={`${CARD} space-y-3`}>
                  <h3 id={colorId} className={LABEL}>
                    Blood color
                  </h3>
                  <div role="group" aria-labelledby={colorId} className="grid grid-cols-1 gap-2.5 min-[400px]:grid-cols-2">
                    {BLOOD_COLORS.map((color) => {
                      const selected = color === draft.bloodColor;
                      const hex =
                        color === "Bright Red"
                          ? "#EF4444"
                          : color === "Dark Red"
                            ? "#881337"
                            : color === "Brown"
                              ? "#78350F"
                              : "#FB7185";
                      return (
                        <button
                          key={color}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => log.update("bloodColor", selected ? null : color)}
                          className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-2xl px-3 transition-all duration-200 ${
                            selected
                              ? "border-2 border-[#F43F8F] bg-[#FFF0F6]"
                              : "border border-gray-100 bg-white hover:border-pink-200 hover:bg-pink-50/40"
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
                            style={{ backgroundColor: hex }}
                          >
                            {selected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                          </span>
                          <span className={`text-xs sm:text-sm ${selected ? "font-bold text-[#17152B]" : "font-semibold text-[#68708A]"}`}>
                            {color}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Cramps + clots */}
                <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2">
                  <section aria-labelledby={crampsId} className={`${CARD} space-y-3`}>
                    <h3 id={crampsId} className={`${LABEL} flex items-center gap-1.5`}>
                      Cramps level <span aria-hidden="true">🤕</span>
                    </h3>
                    <Pills
                      options={CRAMPS}
                      value={draft.cramps}
                      onChange={(v) => log.update("cramps", v)}
                      labelledBy={crampsId}
                      columns={2}
                    />
                  </section>

                  <section aria-labelledby={clotsId} className={`${CARD} space-y-3`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFF0F6]"
                          aria-hidden="true"
                        >
                          <Droplet className="h-4 w-4 text-[#F43F8F]" />
                        </div>
                        <div>
                          <h3 id={clotsId} className="text-xs font-bold leading-tight text-[#17152B] sm:text-sm">
                            Clots present
                          </h3>
                          <p className="text-[0.7rem] font-medium leading-tight text-[#68708A]">Track blood clots</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={clotsOn}
                        aria-labelledby={clotsId}
                        onClick={toggleClots}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                          clotsOn ? "bg-[#F43F8F]" : "bg-[#E5E7EB]"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ${
                            clotsOn ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="space-y-1 pt-1">
                      <p id={clotSizeId} className="text-[0.66rem] font-bold uppercase tracking-wider text-[#68708A]">
                        Clot size
                      </p>
                      <Pills
                        options={CLOT_SIZES}
                        value={clotsOn ? draft.clotSize : null}
                        onChange={(v) => log.update("clotSize", v)}
                        labelledBy={clotSizeId}
                        columns={3}
                        disabled={!clotsOn}
                      />
                    </div>
                  </section>
                </div>

                {/* Energy + medication */}
                <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
                  <section aria-labelledby={energyId} className={`${CARD} space-y-3`}>
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600"
                        aria-hidden="true"
                      >
                        <Flame className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 id={energyId} className="text-xs font-bold leading-tight text-[#17152B] sm:text-sm">
                          Energy level
                        </h3>
                        <p className="text-[0.7rem] font-medium leading-tight text-[#68708A]">Daily vitality rating</p>
                      </div>
                    </div>
                    <Pills
                      options={ENERGIES}
                      value={draft.energy}
                      onChange={(v) => log.update("energy", v)}
                      labelledBy={energyId}
                      stacked
                      renderIcon={(i) => ENERGY_ICONS[i]}
                    />
                  </section>

                  <MedicationSection
                    variant="menstrual"
                    medications={log.medications}
                    date={log.selectedDate}
                    onStatusChange={log.setMedStatus}
                    onAdd={log.addMed}
                    onRemove={log.removeMed}
                  />
                </div>

                {log.medError && <InfoCard live>{log.medError}</InfoCard>}
              </div>
            </div>

            {/* Save */}
            <SaveLogBar
              date={log.selectedDate}
              onSave={log.save}
              error={log.error}
              noChanges={log.noChanges}
              status={log.status}
            />
          </>
        )}
      </div>
    </div>
  );
}