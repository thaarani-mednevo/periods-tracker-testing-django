from django.urls import path

from .views import HealthView, OnboardingProfileView, OnboardingProgressView

urlpatterns = [
    path("v1/onboarding/profile", OnboardingProfileView.as_view(), name="onboarding-profile"),
    path("v1/onboarding/progress", OnboardingProgressView.as_view(), name="onboarding-progress"),
    path("health", HealthView.as_view(), name="health"),
]