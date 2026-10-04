from datetime import date

from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .access import PatientScopedView
from .exceptions import CycleAPIError
from .serializers import PeriodSerializer, PeriodWriteSerializer
from .services import cycle_service


class ProfileScopedView(PatientScopedView):
    def query_date(self, request, name: str, default: date | None = None) -> date:
        raw = request.query_params.get(name)
        if raw is None:
            if default is None:
                raise CycleAPIError(f"`{name}` is required (YYYY-MM-DD).", "INVALID_DATE", field_errors={name: ["Required."]})
            return default
        parsed = None
        try:
            parsed = parse_date(raw)
        except ValueError:
            pass
        if parsed is None:
            raise CycleAPIError(f"`{name}` must be YYYY-MM-DD.", "INVALID_DATE", field_errors={name: ["Invalid date."]})
        return parsed

    def today(self, request) -> date:
        # The client sends its own local date; the server clock is UTC.
        return self.query_date(request, "date", default=timezone.localdate())

    def handle_exception(self, exc):
        if isinstance(exc, ValidationError):
            fields = {k: [str(e) for e in (v if isinstance(v, list) else [v])] for k, v in exc.detail.items()} \
                if isinstance(exc.detail, dict) else {}
            exc = CycleAPIError("Validation failed.", "VALIDATION_ERROR", field_errors=fields)
        return super().handle_exception(exc)


class CurrentCycleView(ProfileScopedView):
    def get(self, request):
        return Response(cycle_service.current_state(self.get_profile(request), self.today(request)))


class PredictionsView(ProfileScopedView):
    def get(self, request):
        profile = self.get_profile(request)
        return Response(cycle_service.predictions_between(
            profile, self.query_date(request, "start"), self.query_date(request, "end"), self.today(request),
        ))


class CycleHistoryView(ProfileScopedView):
    def get(self, request):
        return Response({"periods": cycle_service.history(self.get_profile(request), self.today(request))})


class PeriodListCreateView(ProfileScopedView):
    def post(self, request):
        profile = self.get_profile(request)
        s = PeriodWriteSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        period = cycle_service.create_period(
            profile, s.validated_data["start_date"], s.validated_data.get("end_date"), self.today(request)
        )
        return Response(PeriodSerializer(period).data, status=status.HTTP_201_CREATED)


class PeriodDetailView(ProfileScopedView):
    def patch(self, request, period_id: int):
        profile = self.get_profile(request)
        s = PeriodWriteSerializer(data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        period = cycle_service.update_period(profile, period_id, s.validated_data, self.today(request))
        return Response(PeriodSerializer(period).data)

    def delete(self, request, period_id: int):
        cycle_service.delete_period(self.get_profile(request), period_id)
        return Response(status=status.HTTP_204_NO_CONTENT)