import time

from django.db import transaction
from rest_framework import status
from rest_framework.response import Response

from apps.cycles.access import PatientScopedView, PublicView
from apps.cycles.exceptions import CycleAPIError
from apps.cycles.services.cycle_service import seed_first_period

from .models import OnboardingDraft, OnboardingProfile
from .serializers import (
    OnboardingDraftSerializer,
    OnboardingProfileSerializer,
    OnboardingSubmissionSerializer,
)


class OnboardingProfileView(PatientScopedView):
    def get(self, request):
        """Dashboard calls this to decide: onboarding or tracker. 404 ONBOARDING_REQUIRED = show onboarding."""
        return Response(OnboardingProfileSerializer(self.get_profile(request)).data)

    def post(self, request):
        # "Edit setup" re-submits: update this patient's profile so logged periods stay attached.
        patient = self.get_patient(request)
        existing = OnboardingProfile.objects.filter(patient=patient).first()
        serializer = OnboardingSubmissionSerializer(existing, data=request.data, context={"patient": patient})
        if not serializer.is_valid():
            return Response(
                {"message": "Validation failed", "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )
        with transaction.atomic():
            profile = serializer.save()
            seed_first_period(profile)
        return Response(
            {
                "id": str(profile.id),
                "createdAt": profile.created_at.isoformat(),
                "savedAt": int(time.time() * 1000),
            },
            status=status.HTTP_200_OK,
        )


class OnboardingProgressView(PatientScopedView):
    """Fired on every step's Next click: upserts this patient's draft."""

    def patch(self, request):
        serializer = OnboardingDraftSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"message": "Validation failed", "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )
        draft, _ = OnboardingDraft.objects.update_or_create(
            patient=self.get_patient(request),
            defaults={"step": serializer.validated_data["step"], "data": serializer.validated_data["data"]},
        )
        return Response(
            {"step": draft.step, "updatedAt": draft.updated_at.isoformat()},
            status=status.HTTP_200_OK,
        )


class HealthView(PublicView):
    def get(self, request):
        return Response({"status": "ok", "message": "onboarding service healthy"})