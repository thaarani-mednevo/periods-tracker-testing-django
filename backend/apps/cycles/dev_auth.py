from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.authentication import BaseAuthentication


class DevPatientAuthentication(BaseAuthentication):
    """DEV ONLY: while DEBUG is on, X-Dev-Patient header decides which patient. Replace with the real patient auth."""

    def authenticate(self, request):
        if not settings.DEBUG:
            return None
        username = request.headers.get("X-Dev-Patient", "").strip()[:150] or "dev-patient"
        user, _ = get_user_model().objects.get_or_create(username=username)
        return (user, None)