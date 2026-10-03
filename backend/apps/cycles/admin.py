from django.contrib import admin

from .models import PeriodCycle


@admin.register(PeriodCycle)
class PeriodCycleAdmin(admin.ModelAdmin):
    list_display = ("profile", "start_date", "end_date", "source")
    list_filter = ("source",)
    date_hierarchy = "start_date"