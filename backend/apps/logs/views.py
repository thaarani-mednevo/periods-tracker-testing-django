from datetime import date, timedelta

from django.utils.dateparse import parse_date
from rest_framework import status
from rest_framework.response import Response

from apps.cycles.exceptions import CycleAPIError
from apps.cycles.views import ProfileScopedView

from . import services
from .models import DailyLog, Medication, MedicationIntake
from .serializers import DailyLogWriteSerializer, IntakeSerializer, MedicationWriteSerializer

FUTURE_TOLERANCE_DAYS = 1  # server runs UTC, users do not
MAX_RANGE_DAYS = 370


class LogScopedView(ProfileScopedView):
    def parse_day(self, request, raw: str, *, allow_future: bool) -> date:
        try:
            parsed = parse_date(raw)
        except ValueError:
            parsed = None
        if parsed is None:
            raise CycleAPIError("Date must be YYYY-MM-DD.", "INVALID_DATE")
        if not allow_future and parsed > self.today(request) + timedelta(days=FUTURE_TOLERANCE_DAYS):
            raise CycleAPIError("You can't log a future date.", "DATE_IN_FUTURE")
        return parsed

    def query_range(self, request) -> tuple[date, date]:
        start, end = self.query_date(request, "start"), self.query_date(request, "end")
        if end < start or (end - start).days > MAX_RANGE_DAYS:
            raise CycleAPIError(f"Range must be 0-{MAX_RANGE_DAYS} days.", "INVALID_RANGE")
        return start, end


class DailyLogView(LogScopedView):
    def get(self, request, day: str):
        d = self.parse_day(request, day, allow_future=True)
        row = DailyLog.objects.filter(profile=self.get_profile(request), date=d).first()
        return Response(services.serialize(row, d))

    def put(self, request, day: str):
        d = self.parse_day(request, day, allow_future=False)
        profile = self.get_profile(request)
        s = DailyLogWriteSerializer(data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        return Response(services.save_log(profile, d, s.validated_data))

    def delete(self, request, day: str):
        d = self.parse_day(request, day, allow_future=True)
        DailyLog.objects.filter(profile=self.get_profile(request), date=d).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class LogRangeView(LogScopedView):
    """GET /v1/logs?start=&end= -> only the days that have data, oldest first."""

    def get(self, request):
        profile = self.get_profile(request)
        start, end = self.query_range(request)
        rows = DailyLog.objects.filter(profile=profile, date__range=(start, end)).order_by("date")
        return Response({"logs": [services.serialize(r, r.date) for r in rows]})


# --------------------------------------------------------------------------- medications
def _med_dict(m: Medication, intake_status: str = "pending") -> dict:
    return {
        "id": m.id, "name": m.name, "dose": m.dose, "form": m.form, "frequency": m.frequency,
        "time": m.time, "startDate": m.start_date.isoformat() if m.start_date else None,
        "endDate": m.end_date.isoformat() if m.end_date else None,
        "reminder": m.reminder, "status": intake_status,
    }


def _scheduled_on(m: Medication, day: date) -> bool:
    return (m.start_date is None or m.start_date <= day) and (m.end_date is None or day <= m.end_date)


def _not_ended_on(m: Medication, day: date) -> bool:
    return m.end_date is None or day <= m.end_date

class MedicationListView(LogScopedView):
    def get(self, request):
        """Medications scheduled on ?day= (default: today), each with that day's status."""
        profile = self.get_profile(request)
        services.ensure_profile_medications(profile)
        day = self.query_date(request, "day", default=self.today(request))
        meds = [m for m in Medication.objects.filter(profile=profile, is_active=True) if _not_ended_on(m, day)]        
        statuses = dict(MedicationIntake.objects.filter(medication__in=meds, date=day).values_list("medication_id", "status"))
        return Response({"medications": [_med_dict(m, statuses.get(m.id, "pending")) for m in meds]})

    def post(self, request):
        profile = self.get_profile(request)
        s = MedicationWriteSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        v = s.validated_data
        med = Medication.objects.create(
            profile=profile, name=v["name"], dose=v["dose"].strip(), form=v["form"].strip(),
            frequency=v["frequency"].strip(), time=v["time"], start_date=v["startDate"],
            end_date=v["endDate"], reminder=v["reminder"],
        )
        return Response(_med_dict(med), status=status.HTTP_201_CREATED)


class MedicationDetailView(LogScopedView):
    def patch(self, request, med_id: int):
        med = Medication.objects.filter(profile=self.get_profile(request), id=med_id, is_active=True).first()
        if med is None:
            raise CycleAPIError("Medication not found.", "NOT_FOUND", status.HTTP_404_NOT_FOUND)
        s = MedicationWriteSerializer(data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        v = s.validated_data
        start = v["startDate"] if "startDate" in v else med.start_date
        end = v["endDate"] if "endDate" in v else med.end_date
        if start and end and end < start:
            raise CycleAPIError("Validation failed.", "VALIDATION_ERROR",
                                field_errors={"endDate": ["End date can't be before the start date."]})
        columns = {"name": "name", "dose": "dose", "form": "form", "frequency": "frequency", "time": "time",
                   "startDate": "start_date", "endDate": "end_date", "reminder": "reminder"}
        changed = []
        for api, attr in columns.items():
            if api in v:
                setattr(med, attr, v[api].strip() if isinstance(v[api], str) else v[api])
                changed.append(attr)
        if changed:
            med.save(update_fields=changed)
        return Response(_med_dict(med))

    def delete(self, request, med_id: int):
        med = Medication.objects.filter(profile=self.get_profile(request), id=med_id, is_active=True).first()
        if med is None:
            raise CycleAPIError("Medication not found.", "NOT_FOUND", status.HTTP_404_NOT_FOUND)
        med.is_active = False
        med.save(update_fields=["is_active"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class MedicationIntakeView(LogScopedView):
    def put(self, request, med_id: int, day: str):
        d = self.parse_day(request, day, allow_future=False)
        med = Medication.objects.filter(profile=self.get_profile(request), id=med_id, is_active=True).first()
        if med is None:
            raise CycleAPIError("Medication not found.", "NOT_FOUND", status.HTTP_404_NOT_FOUND)
        s = IntakeSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        new_status = s.validated_data["status"]
        if new_status is None:
            MedicationIntake.objects.filter(medication=med, date=d).delete()
            return Response({"id": med.id, "status": "pending"})
        MedicationIntake.objects.update_or_create(medication=med, date=d, defaults={"status": new_status})
        return Response({"id": med.id, "status": new_status})


class MedicationHistoryView(LogScopedView):
    """GET /v1/medications/history?start=&end= -> logged intakes, newest first."""

    def get(self, request):
        profile = self.get_profile(request)
        start, end = self.query_range(request)
        rows = list(
            MedicationIntake.objects.filter(medication__profile=profile, date__range=(start, end))
            .select_related("medication").order_by("-date", "medication__name")[:300]
        )
        marked = {r.medication_id for r in rows if r.date == end}
        pending = [
            {"date": end.isoformat(), "name": m.name, "dose": m.dose, "status": "pending"}
            for m in Medication.objects.filter(profile=profile, is_active=True).order_by("name")
            if _scheduled_on(m, end) and m.id not in marked
        ]
        return Response({"intakes": pending + [
            {"date": r.date.isoformat(), "name": r.medication.name, "dose": r.medication.dose, "status": r.status}
            for r in rows
        ]})
