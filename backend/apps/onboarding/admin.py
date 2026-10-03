from django.contrib import admin

from .models import OnboardingDraft, OnboardingProfile


@admin.register(OnboardingProfile)
class OnboardingProfileAdmin(admin.ModelAdmin):
    list_display = ("patient", "last_period", "period_regularity", "created_at")
    list_filter = ("period_regularity", "fertility_goal")
    raw_id_fields = ("patient",)


@admin.register(OnboardingDraft)
class OnboardingDraftAdmin(admin.ModelAdmin):
    list_display = ("patient", "step", "updated_at")