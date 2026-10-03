from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.onboarding.models import OnboardingProfile

from .exceptions import CycleAPIError


class PatientScopedView(APIView):
    """Every tracker endpoint belongs to the logged-in patient. The client never sends an id."""

    permission_classes = [IsAuthenticated]  # authentication classes come from REST_FRAMEWORK settings

    def get_patient(self, request):
        return request.user  # <-- the ONLY line to adapt to your real patient auth

    def get_profile(self, request) -> OnboardingProfile:
        profile = OnboardingProfile.objects.filter(patient=self.get_patient(request)).first()
        if profile is None:
            raise CycleAPIError("Complete onboarding first.", "ONBOARDING_REQUIRED", status.HTTP_404_NOT_FOUND)
        return profile