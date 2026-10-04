"""
PHASE ENGINE - "What phase does this date fall into?"

Pure Python. Phase boundaries are derived per cycle from:
  period_start, period_end, estimated_ovulation, next_period_start
No cycle day number maps to a phase; two users on day 14 can be in different phases.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from typing import Sequence

from .cycle_engine import CycleProfile, PeriodRecord
from .prediction_engine import (
    Prediction,
    estimate_ovulation,
    predict_next_period,
    uncertainty_days,
)

MENSTRUAL, FOLLICULAR, OVULATION, LUTEAL, UNKNOWN = (
    "menstrual", "follicular", "ovulation", "luteal", "unknown",
)
PROJECTION_HORIZON_CYCLES = 3  # future cycles shown on calendars; beyond that = unknown
MAX_OVERDUE_PHASE_DAYS = 45    # later than this, stop guessing a phase and ask the user to log


@dataclass(frozen=True)
class CycleWindow:
    start: date
    period_end: date
    ovulation: date | None
    ovulation_range: tuple[date, date] | None
    next_start: date | None
    next_range: tuple[date, date] | None
    start_observed: bool
    period_end_observed: bool
    next_observed: bool
    overdue_until: date | None = None  # period predicted earlier than today and not logged yet


def _period_end(period: PeriodRecord, profile: CycleProfile) -> date:
    if period.end is not None:
        return period.end
    if profile.period_length:
        return period.start + timedelta(days=max(int(profile.period_length + 0.5), 1) - 1)
    return period.start  # nothing known about length: only the start day is certain


def _window(
    period: PeriodRecord,
    start_observed: bool,
    next_start: date | None,
    next_observed: bool,
    profile: CycleProfile,
    overdue_until: date | None = None,
) -> CycleWindow:
    hw = uncertainty_days(profile)
    period_end = _period_end(period, profile)
    if next_start is not None:
        period_end = min(period_end, next_start - timedelta(days=1))
    ov = estimate_ovulation(period_end, next_start, hw) if next_start else None
    return CycleWindow(
        start=period.start,
        period_end=period_end,
        ovulation=ov[0] if ov else None,
        ovulation_range=ov[1] if ov else None,
        next_start=next_start,
        next_range=None if (next_start is None or next_observed)
        else (next_start - timedelta(days=hw), next_start + timedelta(days=hw)),
        start_observed=start_observed,
        period_end_observed=period.end is not None,
        next_observed=next_observed,
        overdue_until=overdue_until,
    )


def build_windows(
    periods: Sequence[PeriodRecord], profile: CycleProfile, as_of: date
) -> tuple[list[CycleWindow], Prediction | None]:
    ordered = sorted(periods, key=lambda p: p.start)
    if not ordered:
        return [], None

    windows = [
        _window(cur, True, nxt.start, True, profile)
        for cur, nxt in zip(ordered, ordered[1:])
    ]

    last = ordered[-1]
    prediction = predict_next_period(last.start, profile)
    if prediction is None:
        windows.append(_window(last, True, None, False, profile))
        return windows, None

    overdue = prediction.next_period <= as_of
    windows.append(
        _window(last, True, prediction.next_period, False, profile,
                overdue_until=as_of if overdue else None)
    )
    if not overdue:  # an overdue prediction is falsified; do not project from it
        start = prediction.next_period
        for _ in range(PROJECTION_HORIZON_CYCLES):
            nxt = start + timedelta(days=prediction.cycle_length)
            windows.append(_window(PeriodRecord(start), False, nxt, False, profile))
            start = nxt
    return windows, prediction


def window_for(target: date, windows: Sequence[CycleWindow]) -> CycleWindow | None:
    found = None
    for w in windows:
        if w.start <= target:
            found = w
        else:
            break
    return found


def get_phase(target: date, w: CycleWindow | None) -> str:
    if w is None or target < w.start:
        return UNKNOWN
    if target <= w.period_end:
        return MENSTRUAL
    if w.ovulation is None:
        return UNKNOWN
    if target < w.ovulation:
        return FOLLICULAR
    if target == w.ovulation:
        return OVULATION
    if w.next_start is None or target < w.next_start:
        return LUTEAL
    if (
        w.overdue_until is not None
        and target <= w.overdue_until
        and (target - w.next_start).days <= MAX_OVERDUE_PHASE_DAYS
    ):
        return LUTEAL
    return UNKNOWN


def cycle_day(target: date, w: CycleWindow | None) -> int | None:
    if w is None or get_phase(target, w) == UNKNOWN:
        return None
    return (target - w.start).days + 1