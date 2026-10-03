"""
Phase insights: engine decides WHAT phase / WHEN it changes, Groq only explains it.

Transition detection is lazy and idempotent: whenever the dashboard asks for today's insight we look
up (profile, cycle_start, phase). No row (or the engine's facts changed) = a new phase has started, so
generate once and store. Opening the dashboard 50 times in one phase costs one Groq call.
"""
from __future__ import annotations

import hashlib
import json
import logging
from datetime import date, timedelta

from django.conf import settings

from apps.cycles.services import cycle_service
from apps.cycles.services.phase_engine import UNKNOWN

from .models import PhaseInsight

log = logging.getLogger(__name__)

MAX_SUMMARY_CHARS = 600
MAX_TIPS = 4
MAX_TIP_CHARS = 140

_BASE_PROMPT = """You write short, warm wellness explanations inside a period-tracking app.
The app's own calculation engine has already decided the user's current phase and all dates. They are
facts. Never change, question or recalculate them, and never invent dates or numbers.

Rules:
- Explain what this phase generally means and what many people feel or find helpful during it.
- Plain, supportive English, second person ("you"). No medical advice, no diagnosis.
{journey_rule}
- Dates are estimates; say "around" or "likely" when you mention them. Do not state a cycle day number.
- If "overdue" is true, gently note the period is later than predicted; do not speculate about causes.
- summary: 2-3 sentences, max 450 characters.
- tips: exactly 3 short, practical, general self-care tips (max 100 characters each).
Reply with JSON only: {{"summary": "...", "tips": ["...", "...", "..."]}}"""

# What the model may say about fertility depends on the journey the user chose in Settings.
JOURNEY_RULES = {
    "cycle_tracking": (
        "- Do not mention contraception, and never promise or deny fertility."
    ),
    "trying_to_conceive": (
        "- The user is trying to conceive. When facts has fertile_window dates you may say the days around "
        "ovulation are generally when conception is most likely, and mention best_days_start..ovulation_date as "
        "the highest-chance days (always as estimates). You may suggest, in general terms, that logging cervical "
        "mucus, temperature or LH tests can help. Never promise or guarantee conception, never say the user is or "
        "is not fertile, and never give medical advice."
    ),
    "pregnancy_prevention": (
        "- The user wants to avoid pregnancy. When facts has fertile_window dates you may say pregnancy is more "
        "likely on those days (always as estimates). Make clear that cycle tracking alone is not a reliable method "
        "of contraception, and never describe any day as safe. Do not recommend any contraceptive product, "
        "medication or dose."
    ),
}


def system_prompt(journey: str) -> str:
    return _BASE_PROMPT.format(journey_rule=JOURNEY_RULES.get(journey, JOURNEY_RULES["cycle_tracking"]))


GOAL_TO_JOURNEY = {
    "trying-to-conceive": "trying_to_conceive",
    "pregnancy-prevention": "pregnancy_prevention",
}


def journey_for(profile) -> str:
    """The saved journey (Settings > Manage journey). Anything else is plain cycle tracking."""
    return GOAL_TO_JOURNEY.get(getattr(profile, "fertility_goal", "") or "", "cycle_tracking")


# ------------------------------------------------------------------ facts (engine -> LLM input)
def _fertile_window(ovulation_iso: str | None) -> dict | None:
    """Same window the UI shows: 5 days before ovulation to 1 day after; best days = ovulation -2..0."""
    if not ovulation_iso:
        return None
    ov = date.fromisoformat(ovulation_iso)
    return {
        "start": (ov - timedelta(days=5)).isoformat(),
        "end": (ov + timedelta(days=1)).isoformat(),
        "best_days_start": (ov - timedelta(days=2)).isoformat(),
    }


def build_facts(state: dict, journey: str | None = None) -> dict | None:
    """Only what the model needs. No name, age, conditions, medications or other profile data."""
    phase = state["phase"]
    if phase == UNKNOWN or state["period"] is None:
        return None
    current = next((p for p in state["phases"] if p["isCurrent"]), None)
    nxt = state["nextPhase"]
    facts = {
        "phase": phase,
        "cycle_start": state["period"]["start"],
        "phase_start": current["start"] if current else None,
        "phase_end": current["end"] if current else None,
        "next_phase": {"name": nxt["phase"], "start": nxt["startDate"]} if nxt else None,
        "ovulation_date": state["ovulation"]["date"] if state["ovulation"] else None,
        "next_period_date": state["nextPeriod"]["date"] if state["nextPeriod"] else None,
        "overdue": state["isOverdue"],
        "confidence": state["confidence"]["level"],
    }
    # Plain cycle tracking keeps the original facts (and stored insights) untouched. A fertility journey adds
    # its own keys, so the stored insight is regenerated once when the user switches journey.
    if journey and journey != "cycle_tracking":
        facts["journey"] = journey
        facts["fertile_window"] = _fertile_window(facts["ovulation_date"])
    return facts


def facts_hash(facts: dict) -> str:
    return hashlib.sha256(json.dumps(facts, sort_keys=True).encode()).hexdigest()


# ------------------------------------------------------------------ the only network call
def call_groq(facts: dict, journey: str = "cycle_tracking") -> dict:
    """Returns {"summary": str, "tips": [str]} or raises. Kept tiny so tests can replace it."""
    from groq import Groq  # lazy: the rest of the app works without the package/key

    client = Groq(api_key=settings.GROQ_API_KEY, timeout=settings.GROQ_TIMEOUT_SECONDS)
    resp = client.chat.completions.create(
        model=settings.GROQ_MODEL,
        temperature=0.4,
        max_tokens=400,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt(journey)},
            {"role": "user", "content": json.dumps(facts)},
        ],
    )
    return json.loads(resp.choices[0].message.content)


def _clean(raw: dict) -> tuple[str, list[str]]:
    summary = raw.get("summary")
    tips = raw.get("tips")
    if not isinstance(summary, str) or not summary.strip():
        raise ValueError("missing summary")
    if not isinstance(tips, list) or not all(isinstance(t, str) for t in tips):
        raise ValueError("bad tips")
    tips = [t.strip()[:MAX_TIP_CHARS] for t in tips if t.strip()][:MAX_TIPS]
    return summary.strip()[:MAX_SUMMARY_CHARS], tips


# ------------------------------------------------------------------ public API
def phase_insight_for(profile, today: date) -> dict:
    """{"status": "ready"|"unavailable"|"no_phase", "insight": {...}|None}. Never raises on LLM trouble."""
    state = cycle_service.current_state(profile, today)
    journey = journey_for(profile)
    facts = build_facts(state, journey)
    if facts is None:
        return {"status": "no_phase", "insight": None}

    digest = facts_hash(facts)
    row = PhaseInsight.objects.filter(
        profile=profile, cycle_start=facts["cycle_start"], phase=facts["phase"]
    ).first()

    if row is None or row.facts_hash != digest:
        try:
            summary, tips = _clean(call_groq(facts, journey))
        except Exception:  # network, auth, bad JSON, bad shape: show nothing rather than invent text
            log.exception("Phase insight generation failed for profile %s", profile.pk)
            if row is None:
                return {"status": "unavailable", "insight": None}
            # keep serving the older text for this phase; its dates may be slightly stale
        else:
            row, _ = PhaseInsight.objects.update_or_create(
                profile=profile,
                cycle_start=facts["cycle_start"],
                phase=facts["phase"],
                defaults={
                    "summary": summary, "tips": tips, "facts": facts,
                    "facts_hash": digest, "model": settings.GROQ_MODEL,
                },
            )

    return {
        "status": "ready",
        "insight": {
            "phase": row.phase,
            "summary": row.summary,
            "tips": row.tips,
            "generatedAt": row.generated_at.isoformat(),
        },
    }