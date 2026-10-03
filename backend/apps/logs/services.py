from __future__ import annotations

from datetime import date

from django.db import transaction
from django.utils import timezone

from .models import DailyLog, Medication
from .schema import FIELD_MAP, LIST_FIELDS


def empty_log(day: date) -> dict:
    out: dict = {"date": day.isoformat()}
    for api in FIELD_MAP:
        out[api] = [] if api in LIST_FIELDS else None
    return out


def serialize(log: DailyLog | None, day: date) -> dict:
    if log is None:
        return empty_log(day)
    out: dict = {"date": log.date.isoformat()}
    for api, attr in FIELD_MAP.items():
        value = getattr(log, attr)
        if api in LIST_FIELDS:
            out[api] = value or []
        else:
            out[api] = None if value == "" else value
    return out


def _is_empty(log: DailyLog) -> bool:
    for attr in FIELD_MAP.values():
        value = getattr(log, attr)
        if not (value is None or value == "" or value == []):
            return False
    return True


@transaction.atomic
def save_log(profile, day: date, data: dict) -> dict:
    log, _ = DailyLog.objects.get_or_create(profile=profile, date=day)
    for api, value in data.items():
        if api in LIST_FIELDS:
            value = value or []
        elif isinstance(value, str):
            value = value.strip() or None
        elif api == "bbtCelsius" and value is not None:
            value = round(value, 2)
        setattr(log, FIELD_MAP[api], value)
    if log.clots_present is not True:
        log.clot_size = None
    if _is_empty(log):
        log.delete()
        return empty_log(day)
    log.save()
    return serialize(log, day)


def _ended(m: Medication, today: date) -> bool:
    return m.end_date is not None and m.end_date < today


@transaction.atomic
def sync_profile_medications(profile, names) -> None:
    """Setup-la type panna names-a Daily Log medications-oda match pannum."""
    wanted: dict[str, str] = {}
    for raw in names or []:
        name = (raw or "").strip()[:100]
        if name:
            wanted.setdefault(name.casefold(), name)

    today = timezone.localdate()
    have: set[str] = set()
    for m in Medication.objects.filter(profile=profile, is_active=True):
        key = m.name.strip().casefold()
        if key in wanted:
            have.add(key)
        elif not _ended(m, today):
            m.is_active = False
            m.save(update_fields=["is_active"])

    for key, name in wanted.items():
        if key not in have:
            Medication.objects.create(profile=profile, name=name)


def ensure_profile_medications(profile) -> None:
    """One-time backfill: pazhaiya profiles-la names JSON-la mattum irukkum."""
    snapshot = profile.medications if isinstance(profile.medications, list) else []
    if snapshot and not Medication.objects.filter(profile=profile).exists():
        sync_profile_medications(profile, snapshot)


def active_medication_names(profile) -> list[str]:
    """Edit setup-la kaattura names (Daily Log table thaan source of truth)."""
    ensure_profile_medications(profile)
    today = timezone.localdate()
    seen: set[str] = set()
    names: list[str] = []
    for m in Medication.objects.filter(profile=profile, is_active=True).order_by("created_at", "id"):
        key = m.name.strip().casefold()
        if key and key not in seen and not _ended(m, today):
            seen.add(key)
            names.append(m.name.strip())
    return names