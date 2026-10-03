import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAsync } from "../../../../hooks/useAsync";
import { addMonths, diffDays } from "../../../../lib/dailyLogDate";
import { addDays } from "../../../../lib/isoDate";
import type { ApiError } from "../../../../services/api/client";
import { getPredictions, localISODate } from "../../../../services/cycle";
import {
  addMedication, emptyLog, getDailyLog, getLogRange, getMedications, removeMedication, saveDailyLog, setIntake, updateMedication,
  type DailyLog, type NewMedication,
} from "../../../../services/logs";
import { DEFAULT_STEP_GOAL, GLASS_ML, WATER_TARGET_ML } from "./constants";
import type { CycleInfo } from "./phaseCopy";

const WINDOW_DAYS = 7;
const CENTER = Math.floor(WINDOW_DAYS / 2);
const WEIGHT_KG = { min: 20, max: 300 };
const UNKNOWN: CycleInfo = { cycleDay: null, phase: "unknown" };

export type SaveStatus = "saved" | "dirty" | "stored" | "empty";
interface Nav { selectedDate: string; windowStart: string }

const fmtWeight = (kg: number | null) => (kg == null ? "" : String(kg));

const errorText = (err: ApiError) => {
  const first = err.fieldErrors ? Object.values(err.fieldErrors).flat()[0] : undefined;
  const base = err.message || "Something went wrong. Please try again.";
  return first ? `${base} ${first}` : base;
};

/** Medications for one day: list + add / edit / remove / mark taken. Saved immediately, not part of "Save Log". */
export function useMedications(day: string) {
  const load = useCallback((s: AbortSignal) => getMedications(day, s), [day]);
  const list = useAsync(load);
  const { refetch } = list;
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<unknown>) => {
    setError(null);
    try {
      await fn();
      refetch();
    } catch (err) {
      setError(errorText(err as ApiError));
    }
  };

  const medications = list.data?.medications ?? [];
  return {
    medications,
    error,
    loadError: list.status === "error" ? list.error : null,
    add: (m: NewMedication) => run(() => addMedication(m)),
    update: (id: number, m: NewMedication) => run(() => updateMedication(id, m)),
    remove: (id: number) => run(() => removeMedication(id)),
    setStatus: (id: number, next: "taken" | "skipped") => {
      const current = medications.find((m) => m.id === id)?.status;
      return run(() => setIntake(id, day, current === next ? null : next));
    },
  };
}

/**
 * Daily Log state for one selected day: 7-day date window, an editable draft of that day's log,
 * and medications. Everything is read from and saved to the Django API; nothing is mocked.
 */
export function useDailyLog(initialDay?: string) {
  const today = localISODate();
  const [nav, setNav] = useState<Nav>(() => {
    const day = initialDay ?? today;
    return { selectedDate: day, windowStart: addDays(day, -CENTER) };
  });
  const { selectedDate, windowStart } = nav;
  const windowEnd = addDays(windowStart, WINDOW_DAYS - 1);
  const dates = useMemo(() => Array.from({ length: WINDOW_DAYS }, (_, i) => addDays(windowStart, i)), [windowStart]);

  const [draft, setDraft] = useState<DailyLog | null>(null);
  const [saved, setSaved] = useState<DailyLog | null>(null);
  const [weightText, setWeightText] = useState("");
  const [stepGoal, setStepGoal] = useState<number>(DEFAULT_STEP_GOAL); // UI-only, backend has no goal field
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [noChanges, setNoChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dayRef = useRef(selectedDate);
  useEffect(() => {
    dayRef.current = selectedDate;
  }, [selectedDate]);

  const loadLog = useCallback((s: AbortSignal) => getDailyLog(selectedDate, s), [selectedDate]);
  const log = useAsync(loadLog);
  const loadPred = useCallback((s: AbortSignal) => getPredictions(windowStart, windowEnd, s), [windowStart, windowEnd]);
  const pred = useAsync(loadPred);
  const loadMarks = useCallback((s: AbortSignal) => getLogRange(windowStart, windowEnd, s), [windowStart, windowEnd]);
  const marks = useAsync(loadMarks);
  const { refetch: refetchMarks } = marks;
  const meds = useMedications(selectedDate);

  // A freshly loaded day replaces the draft. Until then `ready` is false, so a stale day is never shown.
  useEffect(() => {
    if (log.status === "ready" && log.data && log.data.date === selectedDate) {
      setDraft(log.data);
      setSaved(log.data);
      setWeightText(fmtWeight(log.data.weightKg));
    }
  }, [log.status, log.data, selectedDate]);

  const resetFlags = useCallback(() => {
    setJustSaved(false);
    setNoChanges(false);
    setError(null);
  }, []);

  // ---- date navigation
  const go = useCallback(
    (next: (n: Nav) => Nav) => {
      setNav(next);
      resetFlags();
    },
    [resetFlags],
  );
  const selectDate = useCallback(
    (date: string) =>
      go((n) => {
        const offset = diffDays(date, n.windowStart);
        const visible = offset >= 0 && offset < WINDOW_DAYS;
        return { selectedDate: date, windowStart: visible ? n.windowStart : addDays(date, -CENTER) };
      }),
    [go],
  );
  const shiftWeek = useCallback(
    (k: number) =>
      go((n) => ({ selectedDate: addDays(n.selectedDate, k * WINDOW_DAYS), windowStart: addDays(n.windowStart, k * WINDOW_DAYS) })),
    [go],
  );
  const shiftMonth = useCallback(
    (k: number) =>
      go((n) => {
        const date = addMonths(n.selectedDate, k);
        return { selectedDate: date, windowStart: addDays(date, -CENTER) };
      }),
    [go],
  );
  const goToToday = useCallback(() => go(() => ({ selectedDate: today, windowStart: addDays(today, -CENTER) })), [go, today]);

  // ---- phase + logged marks for the visible window
  const byDate = useMemo(() => new Map((pred.data?.days ?? []).map((d) => [d.date, d] as const)), [pred.data]);
  const cycleInfo = useCallback(
    (date: string): CycleInfo => {
      const d = byDate.get(date);
      return d ? { cycleDay: d.cycleDay, phase: d.phase } : UNKNOWN;
    },
    [byDate],
  );
  const logged = useMemo(() => new Set((marks.data?.logs ?? []).map((l) => l.date)), [marks.data]);
  const isLogged = useCallback((date: string) => logged.has(date), [logged]);

  // ---- draft editing
  const update = useCallback(
    <K extends keyof DailyLog>(key: K, value: DailyLog[K]) => {
      setDraft((d) => (d ? { ...d, [key]: value } : d));
      resetFlags();
    },
    [resetFlags],
  );

  /** The text box keeps what the user typed ("58." stays "58."); the draft keeps the number. */
  const changeWeight = useCallback(
    (text: string) => {
      setWeightText(text);
      const t = text.trim();
      const n = t === "" ? null : Number(t);
      update("weightKg", n !== null && !Number.isFinite(n) ? null : n);
    },
    [update],
  );

  const ml = draft?.waterMl ?? 0;
  const hydration = {
    ml,
    percent: Math.min(100, Math.round((ml / WATER_TARGET_ML) * 100)),
    remaining: Math.max(WATER_TARGET_ML - ml, 0),
    glasses: Math.floor(ml / GLASS_ML),
  };
  const changeWater = (deltaMl: number) => update("waterMl", Math.max(0, ml + deltaMl));

  const dirty = useMemo(() => !!draft && !!saved && JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);
  const hasData = useMemo(() => !!saved && JSON.stringify(saved) !== JSON.stringify(emptyLog(saved.date)), [saved]);
  const status: SaveStatus = justSaved ? "saved" : dirty ? "dirty" : hasData ? "stored" : "empty";

  const save = async () => {
    if (!draft || saving) return;
    if (!dirty) {
      setNoChanges(true);
      return;
    }
    if (selectedDate > today) {
      setError("You can't log a future day yet.");
      return;
    }
    const kg = draft.weightKg;
    if (kg != null && (kg < WEIGHT_KG.min || kg > WEIGHT_KG.max)) {
      setError(`Enter a body weight between ${WEIGHT_KG.min} and ${WEIGHT_KG.max} kg.`);
      return;
    }
    const day = selectedDate;
    setSaving(true);
    setError(null);
    try {
      const res = await saveDailyLog(day, draft);
      refetchMarks();
      if (dayRef.current === day) {
        setDraft(res);
        setSaved(res);
        setWeightText(fmtWeight(res.weightKg));
        setJustSaved(true);
      }
    } catch (err) {
      setError(errorText(err as ApiError));
    } finally {
      setSaving(false);
    }
  };

  return {
    today, selectedDate, dates, cycleInfo, isLogged,
    selectDate, goToToday, shiftWeek, shiftMonth,
    ready: draft?.date === selectedDate,
    loadError: log.status === "error" ? log.error : null,
    retry: log.refetch,
    draft, update, weightText, changeWeight,
    stepGoal, setStepGoal,
    hydration, changeWater,
    medications: meds.medications, addMed: meds.add, setMedStatus: meds.setStatus,
    removeMed: meds.remove, updateMed: meds.update, medError: meds.error,
    save, saving, error, noChanges, status,
  };
}