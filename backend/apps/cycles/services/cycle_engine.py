"""
CYCLE ENGINE - "What is this user's pattern?"

Pure Python (no Django, no I/O). Turns logged periods into a CycleProfile:
cycle lengths, median, variability, typical period length.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from statistics import mean, median, stdev
from typing import Sequence

# Data-sanity guards only (reject typos / duplicate taps), NOT prediction rules.
MIN_PLAUSIBLE_CYCLE_DAYS = 15
MAX_PLAUSIBLE_CYCLE_DAYS = 120
HISTORY_WINDOW = 6            # most recent cycle lengths that describe "now"
MIN_CYCLES_WITHOUT_PRIOR = 3  # below this the onboarding answer is blended in as a prior


@dataclass(frozen=True)
class PeriodRecord:
    start: date
    end: date | None = None

    @property
    def length_days(self) -> int | None:
        return None if self.end is None else (self.end - self.start).days + 1


@dataclass(frozen=True)
class CycleProfile:
    cycle_lengths: tuple[int, ...]   # observed start->start gaps (recent window)
    prediction_length: float | None  # median used by the prediction engine
    mean_length: float | None
    variability: float | None        # stdev of OBSERVED lengths; None if < 2 cycles
    period_length: float | None      # typical period length (observed, else onboarding)
    sample_size: int                 # number of observed cycle lengths
    length_source: str               # history | history+onboarding | onboarding | none


def cycle_lengths(periods: Sequence[PeriodRecord]) -> list[int]:
    starts = sorted(p.start for p in periods)
    gaps = [(b - a).days for a, b in zip(starts, starts[1:])]
    return [g for g in gaps if MIN_PLAUSIBLE_CYCLE_DAYS <= g <= MAX_PLAUSIBLE_CYCLE_DAYS]


def build_cycle_profile(
    periods: Sequence[PeriodRecord],
    stated_cycle_length: int | None = None,
    stated_period_length: int | None = None,
) -> CycleProfile:
    observed = cycle_lengths(periods)[-HISTORY_WINDOW:]

    observations: list[float] = list(observed)
    if stated_cycle_length and len(observed) < MIN_CYCLES_WITHOUT_PRIOR:
        observations.insert(0, float(stated_cycle_length))
        source = "history+onboarding" if observed else "onboarding"
    else:
        source = "history" if observed else "none"

    observed_period_lengths = [p.length_days for p in periods if p.length_days]
    if observed_period_lengths:
        period_length = float(median(observed_period_lengths[-HISTORY_WINDOW:]))
    else:
        period_length = float(stated_period_length) if stated_period_length else None

    return CycleProfile(
        cycle_lengths=tuple(observed),
        prediction_length=float(median(observations)) if observations else None,
        mean_length=float(mean(observed)) if observed else None,
        variability=float(stdev(observed)) if len(observed) >= 2 else None,
        period_length=period_length,
        sample_size=len(observed),
        length_source=source,
    )