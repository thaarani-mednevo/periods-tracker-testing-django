"""CONFIDENCE ENGINE - "How certain is the estimate?" (pure Python)"""
from __future__ import annotations

from dataclasses import dataclass

from .cycle_engine import CycleProfile

HIGH_MAX_VARIABILITY = 2.0    # KT section 4: stdev <= 2 days
MEDIUM_MAX_VARIABILITY = 5.0  # KT section 4: stdev <= 5 days
MIN_CYCLES_FOR_HIGH = 3       # one or two gaps cannot prove a pattern

_ORDER = ["low", "medium", "high"]


@dataclass(frozen=True)
class Confidence:
    level: str
    reasons: tuple[str, ...]


def assess_confidence(profile: CycleProfile, overdue_days: int = 0) -> Confidence:
    reasons: list[str] = []

    if profile.prediction_length is None:
        return Confidence("low", ("no_cycle_data",))

    if profile.sample_size == 0:
        level = 0
        reasons.append(
            "assumed_default_cycle_length" if profile.length_source == "default" else "based_on_onboarding_only"
        )
    elif profile.variability is None:
        level = 1
        reasons.append("only_one_cycle_logged")
    elif profile.variability <= HIGH_MAX_VARIABILITY:
        level = 2
    elif profile.variability <= MEDIUM_MAX_VARIABILITY:
        level = 1
        reasons.append("moderate_cycle_variability")
    else:
        level = 0
        reasons.append("high_cycle_variability")

    if level == 2 and profile.sample_size < MIN_CYCLES_FOR_HIGH:
        level = 1
        reasons.append("few_cycles_logged")

    if overdue_days > 0:
        level = max(0, level - 1)
        reasons.append("period_overdue")

    return Confidence(_ORDER[level], tuple(reasons))