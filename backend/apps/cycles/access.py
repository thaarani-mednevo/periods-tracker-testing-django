from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from apps.onboarding.models import OnboardingProfile

from .exceptions import CycleAPIError


class PublicView(APIView):
    """Open endpoints (signup, login, health): no token needed."""

    authentication_classes = []
    permission_classes = [AllowAny]


class ProtectedView(APIView):
    """Login required. Every protected endpoint inherits from this class."""

    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]


class PatientScopedView(ProtectedView):
    """Every tracker endpoint belongs to the logged-in patient. The client never sends an id."""

    def get_patient(self, request):
        return request.user

    def get_profile(self, request) -> OnboardingProfile:
        profile = OnboardingProfile.objects.filter(patient=self.get_patient(request)).first()
        if profile is None:
            raise CycleAPIError("Complete onboarding first.", "ONBOARDING_REQUIRED", status.HTTP_404_NOT_FOUND)
        return profile