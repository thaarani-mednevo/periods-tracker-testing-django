from django.contrib import admin

from .models import DailyLog, Medication, MedicationIntake


@admin.register(DailyLog)
class DailyLogAdmin(admin.ModelAdmin):
    list_display = ("profile", "date", "updated_at")
    raw_id_fields = ("profile",)


@admin.register(Medication)
class MedicationAdmin(admin.ModelAdmin):
    list_display = ("name", "profile", "is_active")
    raw_id_fields = ("profile",)


admin.site.register(MedicationIntake)
