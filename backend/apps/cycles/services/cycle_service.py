"""
Orchestration layer: DB rows -> engines -> API-shaped dicts.
Everything derived is recomputed on every read, so log / edit / delete of a
period automatically updates cycle history, predictions, phases and confidence
(KT rule 5) with no cache to invalidate.
"""
from __future__ import annotations

from datetime import date, timedelta

from rest_framework import status

from ..exceptions import CycleAPIError
from ..models import PeriodCycle
from .confidence_engine import assess_confidence
from .cycle_engine import PeriodRecord, build_cycle_profile
from .phase_engine import UNKNOWN, build_windows, cycle_day, get_phase, window_for

FUTURE_TOLERANCE_DAYS = 1       # server runs UTC, users do not (IST is +5:30)
MAX_PERIOD_LENGTH_DAYS = 14
MIN_DAYS_BETWEEN_STARTS = 10    # closer than this is the same period logged twice
MAX_RANGE_DAYS = 370


def _iso(d: date | None) -> str | None:
    return d.isoformat() if d else None


# ---------------------------------------------------------------- engine wiring
def _stated_values(profile) -> tuple[int | None, int | None]:
    cycle = profile.cycle_length if profile.cycle_length_option == "known" else None
    duration = profile.manual_period_duration if profile.use_manual_duration else profile.period_duration
    if duration is not None and not (1 <= duration <= MAX_PERIOD_LENGTH_DAYS):
        duration = None
    return cycle, duration


def _run_engines(profile, as_of: date):
    rows = list(PeriodCycle.objects.filter(profile=profile).order_by("start_date"))
    records = [PeriodRecord(r.start_date, r.end_date) for r in rows]
    stated_cycle, stated_period = _stated_values(profile)
    cycle_profile = build_cycle_profile(records, stated_cycle, stated_period)
    windows, prediction = build_windows(records, cycle_profile, as_of)
    return rows, cycle_profile, windows, prediction


# ---------------------------------------------------------------------- reads
def _next_phase(today: date, w, phase: str) -> dict | None:
    """The next phase boundary after today, taken from the engine's own window."""
    if w is None or phase == UNKNOWN:
        return None
    steps = [("follicular", w.period_end + timedelta(days=1))]
    if w.ovulation is not None:
        steps += [("ovulation", w.ovulation), ("luteal", w.ovulation + timedelta(days=1))]
    if w.next_start is not None:
        steps.append(("menstrual", w.next_start))
    for name, start in steps:
        if start > today:
            return {"phase": name, "startDate": _iso(start), "daysUntil": (start - today).days}
    return None


# ---------------------------------------------------------------------- reads
def _phase_ranges(w, phase: str) -> list[dict]:
    """Start/end of each phase in the current cycle, straight from the engine's window."""
    if w is None or phase == UNKNOWN:
        return []
    rows = [("menstrual", w.start, w.period_end)]
    if w.ovulation is not None:
        rows += [
            ("follicular", w.period_end + timedelta(days=1), w.ovulation - timedelta(days=1)),
            ("ovulation", w.ovulation, w.ovulation),
            ("luteal", w.ovulation + timedelta(days=1), w.next_start - timedelta(days=1) if w.next_start else None),
        ]
    return [
        {"phase": n, "start": _iso(s), "end": _iso(e), "isCurrent": n == phase}
        for n, s, e in rows
        if e is None or e >= s
    ]


# ---------------------------------------------------------------------- reads
def current_state(profile, today: date) -> dict:
    _, cprof, windows, prediction = _run_engines(profile, today)
    w = window_for(today, windows)
    phase = get_phase(today, w)

    overdue_days = 0
    next_date = next_type = next_range = None
    upcoming = next((x for x in windows if x.start > today), None)
    if upcoming is not None:
        next_date, next_type = upcoming.start, "observed" if upcoming.start_observed else "estimated"
        next_range = prediction.next_period_range if prediction and upcoming.start == prediction.next_period else None
    elif prediction is not None:
        next_date, next_type, next_range = prediction.next_period, "estimated", prediction.next_period_range
        overdue_days = max((today - prediction.next_period).days, 0)

    confidence = assess_confidence(cprof, overdue_days)
    in_cycle = w is not None and phase != UNKNOWN
    next_phase = _next_phase(today, w, phase)
    phases = _phase_ranges(w, phase)

    return {
        "date": today.isoformat(),
        "cycleDay": cycle_day(today, w),
        "phase": phase,
        "period": None if w is None else {
            "start": _iso(w.start),
            "end": _iso(w.period_end),
            "type": "observed" if w.period_end_observed else "estimated",
            "startType": "observed" if w.start_observed else "estimated",
        },
        "nextPeriod": None if next_date is None else {
            "date": _iso(next_date),
            "type": next_type,
            "rangeStart": _iso(next_range[0]) if next_range else None,
            "rangeEnd": _iso(next_range[1]) if next_range else None,
        },
        "ovulation": None if not in_cycle or w.ovulation is None else {
            "date": _iso(w.ovulation),
            "type": "estimated",
            "windowStart": _iso(w.ovulation_range[0]),
            "windowEnd": _iso(w.ovulation_range[1]),
        },
        "nextPhase": next_phase,
        "phases": phases,
        "daysUntilNextPeriod": None if next_date is None else (next_date - today).days,
        "isOverdue": overdue_days > 0,
        "overdueDays": overdue_days,
        "confidence": {"level": confidence.level, "reasons": list(confidence.reasons)},
        "cycleProfile": {
            "sampleSize": cprof.sample_size,
            "medianCycleLength": cprof.prediction_length,
            "variability": None if cprof.variability is None else round(cprof.variability, 2),
            "typicalPeriodLength": cprof.period_length,
            "lengthSource": cprof.length_source,
        },
    }


def predictions_between(profile, start: date, end: date, today: date) -> dict:
    if end < start:
        raise CycleAPIError("`end` must not be before `start`.", "INVALID_RANGE")
    if (end - start).days > MAX_RANGE_DAYS:
        raise CycleAPIError(f"Range cannot exceed {MAX_RANGE_DAYS} days.", "INVALID_RANGE")

    _, _, windows, _ = _run_engines(profile, today)
    days, d = [], start
    while d <= end:
        w = window_for(d, windows)
        phase = get_phase(d, w)
        observed = phase == "menstrual" and w.start_observed and w.period_end_observed
        days.append({
            "date": d.isoformat(),
            "phase": phase,
            "type": "observed" if observed else "estimated",
            "cycleDay": cycle_day(d, w),
            "isOvulationDay": phase == "ovulation",
            "inOvulationWindow": bool(w and w.ovulation_range and w.ovulation_range[0] <= d <= w.ovulation_range[1]),
        })
        d += timedelta(days=1)
    return {"start": start.isoformat(), "end": end.isoformat(), "days": days}


def history(profile, today: date) -> list[dict]:
    rows, _, _, _ = _run_engines(profile, today)
    out = []
    for i, r in enumerate(rows):
        nxt = rows[i + 1].start_date if i + 1 < len(rows) else None
        out.append({
            "id": r.id,
            "startDate": r.start_date.isoformat(),
            "endDate": _iso(r.end_date),
            "periodLength": None if r.end_date is None else (r.end_date - r.start_date).days + 1,
            "cycleLength": None if nxt is None else (nxt - r.start_date).days,
            "source": r.source,
        })
    return list(reversed(out))  # newest first


# --------------------------------------------------------------------- writes
def _validate(profile, start: date, end: date | None, today: date, exclude_id: int | None = None):
    limit = today + timedelta(days=FUTURE_TOLERANCE_DAYS)
    if start > limit:
        raise CycleAPIError("Period start cannot be in the future.", "FUTURE_DATE", field_errors={"startDate": ["Cannot be in the future."]})
    if end is not None:
        if end < start:
            raise CycleAPIError("End date cannot be before start date.", "INVALID_RANGE", field_errors={"endDate": ["Before start date."]})
        if end > limit:
            raise CycleAPIError("Period end cannot be in the future.", "FUTURE_DATE", field_errors={"endDate": ["Cannot be in the future."]})
        if (end - start).days + 1 > MAX_PERIOD_LENGTH_DAYS:
            raise CycleAPIError(f"A period cannot be longer than {MAX_PERIOD_LENGTH_DAYS} days.", "INVALID_RANGE", field_errors={"endDate": ["Too long."]})

    others = PeriodCycle.objects.filter(profile=profile)
    if exclude_id is not None:
        others = others.exclude(pk=exclude_id)
    for o in others:
        if abs((o.start_date - start).days) < MIN_DAYS_BETWEEN_STARTS:
            raise CycleAPIError(
                "A period is already logged within 10 days of this date. Edit that entry instead.",
                "PERIOD_TOO_CLOSE", status.HTTP_409_CONFLICT,
            )


def create_period(profile, start: date, end: date | None, today: date) -> PeriodCycle:
    _validate(profile, start, end, today)
    return PeriodCycle.objects.create(profile=profile, start_date=start, end_date=end, source=PeriodCycle.Source.USER)


def update_period(profile, period_id: int, data: dict, today: date) -> PeriodCycle:
    period = _get_period(profile, period_id)
    start = data.get("start_date", period.start_date)
    end = data["end_date"] if "end_date" in data else period.end_date
    _validate(profile, start, end, today, exclude_id=period.pk)
    period.start_date, period.end_date = start, end
    period.save()
    return period


def delete_period(profile, period_id: int) -> None:
    _get_period(profile, period_id).delete()


def _get_period(profile, period_id: int) -> PeriodCycle:
    try:
        return PeriodCycle.objects.get(pk=period_id, profile=profile)
    except PeriodCycle.DoesNotExist:
        raise CycleAPIError("Period not found.", "NOT_FOUND", status.HTTP_404_NOT_FOUND)


def seed_first_period(profile) -> PeriodCycle:
    """Onboarding 'last period' is the first OBSERVED start. The end stays null:
    the user only told us how long periods usually last, not when this one ended.
    Re-submitting setup moves the onboarding row instead of adding a second period."""
    same_day = PeriodCycle.objects.filter(profile=profile, start_date=profile.last_period).first()
    if same_day:
        return same_day
    seeded = PeriodCycle.objects.filter(profile=profile, source=PeriodCycle.Source.ONBOARDING).first()
    if seeded:
        seeded.start_date = profile.last_period
        seeded.end_date = None
        seeded.save()
        return seeded
    return PeriodCycle.objects.create(
        profile=profile, start_date=profile.last_period, source=PeriodCycle.Source.ONBOARDING
    )