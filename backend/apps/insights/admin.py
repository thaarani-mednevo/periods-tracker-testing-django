from django.contrib import admin

from .models import PhaseInsight, PhaseTips, PhaseTips


@admin.register(PhaseInsight)
class PhaseInsightAdmin(admin.ModelAdmin):
    list_display = ("profile", "phase", "cycle_start", "model", "generated_at")
    list_filter = ("phase", "model")
    raw_id_fields = ("profile",)
    readonly_fields = ("facts", "facts_hash")

@admin.register(PhaseTips)
class PhaseTipsAdmin(admin.ModelAdmin):
    list_display = ("profile", "phase", "date", "model", "generated_at")
    list_filter = ("phase", "model")
    raw_id_fields = ("profile",)
    readonly_fields = ("input_hash",)