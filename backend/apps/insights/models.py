from django.db import models


class PhaseInsight(models.Model):
    """
    AI explanation of one phase of one cycle. The phase, its dates and the transition come from the
    cycle engine (the `facts` below); the LLM only explains them. One row per (profile, cycle, phase);
    if the engine's facts change (a period was edited), the row is regenerated in place.
    """

    profile = models.ForeignKey(
        "onboarding.OnboardingProfile", on_delete=models.CASCADE, related_name="phase_insights"
    )
    cycle_start = models.DateField()
    phase = models.CharField(max_length=12)
    summary = models.TextField()
    tips = models.JSONField(default=list)
    facts = models.JSONField(default=dict)       # exactly what the model was told
    facts_hash = models.CharField(max_length=64)
    model = models.CharField(max_length=80)
    generated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "insights_phase_insight"
        constraints = [
            models.UniqueConstraint(fields=["profile", "cycle_start", "phase"], name="uniq_insight_per_phase"),
        ]

    def __str__(self):
        return f"{self.profile_id}: {self.phase} (cycle {self.cycle_start})"

class PhaseTips(models.Model):
    """
    Personalised wellness tips for one profile on one day. The input (engine facts + a small health
    snapshot + the last 7 days of logs) is hashed; the row is only regenerated when that input changes,
    so opening the tips dialog repeatedly costs one LLM call per change.
    """

    profile = models.ForeignKey(
        "onboarding.OnboardingProfile", on_delete=models.CASCADE, related_name="phase_tips"
    )
    date = models.DateField()
    phase = models.CharField(max_length=12)
    tips = models.JSONField(default=list)        # [{"title", "text", "category"}]
    based_on = models.JSONField(default=dict)    # {"logDays": int, "healthProfile": bool}
    input_hash = models.CharField(max_length=64)
    model = models.CharField(max_length=80)
    generated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "insights_phase_tips"
        constraints = [
            models.UniqueConstraint(fields=["profile", "date"], name="uniq_tips_per_day"),
        ]

    def __str__(self):
        return f"{self.profile_id}: tips {self.date} ({self.phase})"