"""
PREDICTION ENGINE - "What are the estimated future boundaries?"

Pure Python. Produces estimated next-period and ovulation dates WITH ranges.
Never decides phases (that is the phase engine's job).
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta

from .cycle_engine import CycleProfile

# Population-level model parameter (KT section 4 marks it "illustrative, replace with a
# validated model"). It is the ONLY ovulation assumption in the codebase, it lives in one
# place, and the real luteal length of each cycle is an OUTPUT (next_period - ovulation).
LUTEAL_ESTIMATE_DAYS = 13
DEFAULT_UNCERTAINTY_DAYS = 3  # half-width when variability is unknown (little data)
MAX_UNCERTAINTY_DAYS = 5


@dataclass(frozen=True)
class Prediction:
    cycle_length: int
    next_period: date
    next_period_range: tuple[date, date]
    half_width: int


def _round_half_up(x: float) -> int:
    return int(x + 0.5)


def uncertainty_days(profile: CycleProfile) -> int:
    """Wider range for more variable cycles; same code path for regular and irregular."""
    if profile.variability is None:
        return DEFAULT_UNCERTAINTY_DAYS
    return max(1, min(MAX_UNCERTAINTY_DAYS, _round_half_up(profile.variability)))


def predict_next_period(last_start: date, profile: CycleProfile) -> Prediction | None:
    if profile.prediction_length is None:
        return None  # no history and no onboarding answer -> do not invent a number
    length = _round_half_up(profile.prediction_length)
    hw = uncertainty_days(profile)
    nxt = last_start + timedelta(days=length)
    return Prediction(
        cycle_length=length,
        next_period=nxt,
        next_period_range=(nxt - timedelta(days=hw), nxt + timedelta(days=hw)),
        half_width=hw,
    )


def estimate_ovulation(
    period_end: date, next_start: date, half_width: int
) -> tuple[date, tuple[date, date]] | None:
    """Ovulation date + range for the cycle that ends on `next_start`.
    Always after the period and before the next one; None if the cycle is too short."""
    earliest = period_end + timedelta(days=1)
    latest = next_start - timedelta(days=1)
    if earliest > latest:
        return None
    ov = min(max(next_start - timedelta(days=LUTEAL_ESTIMATE_DAYS), earliest), latest)
    lo = max(ov - timedelta(days=half_width), earliest)
    hi = min(ov + timedelta(days=half_width), latest)
    return ov, (lo, hi)